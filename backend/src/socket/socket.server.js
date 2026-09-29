const { Server } = require("socket.io");
const UserModel = require("../model/user.model");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const { generateContent, generateVector } = require("../service/ai.service");
const MsgModel = require("../model/msg.models");
const ChatModel = require("../model/chat.model");
const {
  CreateMemory,
  queryMemory,
  DeleteMemory,
} = require("../service/vector.service");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const MAX_ATTACHMENT_COUNT = 5;
const MAX_DOCUMENT_TEXT_LENGTH = 16000;
async function prepareAttachments(attachments = []) {
  if (
    !Array.isArray(attachments) ||
    attachments.length > MAX_ATTACHMENT_COUNT
  ) {
    throw new Error("Upload up to 5 files per message.");
  }
  let totalBytes = 0;
  const prepared = [];
  for (const attachment of attachments) {
    const name = typeof attachment?.name === "string" ? attachment.name : "";
    const extension = name.split(".").pop()?.toLowerCase();
    const acceptedTypes = {
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain",
    };
    const mimeType =
      acceptedTypes[extension] || (attachment?.mimeType || "").toLowerCase();
    const isImage = /^image\/(png|jpeg|webp|gif)$/.test(mimeType);
    const isDocument = Object.values(acceptedTypes).includes(mimeType);
    if (
      !name ||
      (!isImage && !isDocument) ||
      typeof attachment?.data !== "string"
    ) {
      throw new Error(
        "Only PDF, DOCX, TXT, PNG, JPG, WEBP, and GIF files are supported.",
      );
    }
    const buffer = Buffer.from(attachment.data, "base64");
    totalBytes += buffer.length;
    if (!buffer.length || totalBytes > MAX_ATTACHMENT_BYTES) {
      throw new Error("Attachments must total 8 MB or less.");
    }
    let extractedText = "";
    if (extension === "pdf") {
      extractedText = (await pdfParse(buffer)).text;
    } else if (extension === "docx") {
      extractedText = (
        await mammoth.extractRawText({
          buffer,
        })
      ).value;
    } else if (extension === "txt") {
      extractedText = buffer.toString("utf8");
    }
    prepared.push({
      name: name.slice(0, 180),
      mimeType,
      extractedText: extractedText.slice(0, MAX_DOCUMENT_TEXT_LENGTH),
      imageData: isImage ? attachment.data : null,
    });
  }
  return prepared;
}
async function initSocketServer(httpserver) {
  const io = new Server(httpserver, {
    maxHttpBufferSize: 12 * 1024 * 1024,
    cors: {
      origin: [
        "https://chatgpt-prjct-1-cohrat-1.onrender.com",
        "https://chatgpt-prjct-1-cohrat-2.onrender.com",
        "http://localhost:5173",
      ],
      withCredentials: true,
    },
  });
  io.use(async (socket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
      if (!cookies.token) {
        return next(new Error("Unauthorized"));
      }
      const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
      const user = await UserModel.findById(decoded.id);
      if (!user) {
        return next(new Error("User not found"));
      }
      socket.user = user;
      next();
    } catch (error) {
      console.error("Socket Error:", error.message);
      next(new Error("Invalid token"));
    }
  });
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    socket.on("chat-operation", async (payload = {}) => {
      try {
        const chat = await ChatModel.findOne({
          _id: payload.chat,
          user: socket.user._id,
        });
        if (!chat)
          throw new Error(
            "Conversation not found. Start a new chat and try again.",
          );
        const operation = payload.operation || "send";
        const attachments = await prepareAttachments(payload.attachments || []);
        const userText =
          typeof payload.content === "string" ? payload.content.trim() : "";
        const extractedText = attachments
          .map(
            (file) =>
              file.extractedText &&
              `\n\nFile: ${file.name}\n${file.extractedText}`,
          )
          .filter(Boolean)
          .join("")
          .slice(0, MAX_DOCUMENT_TEXT_LENGTH);
        if (operation !== "regenerate" && !userText && !attachments.length) {
          throw new Error("Add a message or attach a file first.");
        }
        if (userText.length > 8000)
          throw new Error("Messages must be 8000 characters or fewer.");
        let userMessage;
        if (operation === "edit") {
          userMessage = await MsgModel.findOne({
            _id: payload.messageId,
            chat: chat._id,
            user: socket.user._id,
            role: "user",
          });
          if (!userMessage) throw new Error("That message could not be found.");
          const removed = await MsgModel.find({
            chat: chat._id,
            createdAt: {
              $gt: userMessage.createdAt,
            },
          })
            .select("_id")
            .lean();
          await MsgModel.deleteMany({
            _id: {
              $in: removed.map((item) => item._id),
            },
          });
          await DeleteMemory(removed.map((item) => item._id.toString()));
          userMessage.content = userText;
          userMessage.attachments = attachments.map(({ name, mimeType }) => ({
            name,
            mimeType,
          }));
          userMessage.extractedText = extractedText;
          await userMessage.save();
        } else if (operation === "regenerate") {
          const targetReply = await MsgModel.findOne({
            _id: payload.messageId,
            chat: chat._id,
            user: socket.user._id,
            role: "model",
          });
          if (!targetReply)
            throw new Error("That response could not be found.");
          userMessage = await MsgModel.findOne({
            chat: chat._id,
            user: socket.user._id,
            role: "user",
            createdAt: {
              $lt: targetReply.createdAt,
            },
          }).sort({
            createdAt: -1,
          });
          if (!userMessage)
            throw new Error(
              "The question for this response could not be found.",
            );
          const removed = await MsgModel.find({
            chat: chat._id,
            createdAt: {
              $gte: targetReply.createdAt,
            },
          })
            .select("_id")
            .lean();
          await MsgModel.deleteMany({
            _id: {
              $in: removed.map((item) => item._id),
            },
          });
          await DeleteMemory(removed.map((item) => item._id.toString()));
        } else {
          userMessage = await MsgModel.create({
            chat: chat._id,
            user: socket.user._id,
            content: userText || "Please review the attached file(s).",
            attachments: attachments.map(({ name, mimeType }) => ({
              name,
              mimeType,
            })),
            extractedText,
            role: "user",
          });
        }
        const [messages, queryVector] = await Promise.all([
          MsgModel.find({
            chat: chat._id,
          })
            .sort({
              createdAt: 1,
            })
            .lean(),
          generateVector(
            `${userMessage.content}\n${userMessage.extractedText || ""}`,
          ),
        ]);
        await CreateMemory({
          messageId: userMessage._id.toString(),
          vectors: queryVector,
          metadata: {
            chat: chat._id.toString(),
            user: socket.user._id.toString(),
            text: `${userMessage.content}\n${userMessage.extractedText || ""}`,
          },
        });
        const memory = await queryMemory({
          queryVector,
          limit: 3,
          metadata: {
            chat: chat._id.toString(),
          },
        });
        const history = messages.map((message) => {
          const parts = [
            {
              text: `${message.content}${message.extractedText ? `\n${message.extractedText}` : ""}`,
            },
          ];
          if (message._id.toString() === userMessage._id.toString()) {
            for (const file of attachments) {
              if (file.imageData) {
                parts.push({
                  inlineData: {
                    mimeType: file.mimeType,
                    data: file.imageData,
                  },
                });
              }
            }
          }
          return {
            role: message.role,
            parts,
          };
        });
        if (memory.length) {
          history.unshift({
            role: "user",
            parts: [
              {
                text: `Relevant conversation memories:\n${memory
                  .map((item) => item.metadata?.text || "")
                  .filter(Boolean)
                  .join("\n")}`,
              },
            ],
          });
        }
        const response = await generateContent(history);
        const [responseMessage, responseVectors] = await Promise.all([
          MsgModel.create({
            chat: chat._id,
            user: socket.user._id,
            content: response,
            role: "model",
          }),
          generateVector(response),
        ]);
        await CreateMemory({
          messageId: responseMessage._id.toString(),
          vectors: responseVectors,
          metadata: {
            chat: chat._id.toString(),
            user: socket.user._id.toString(),
            text: response,
            role: "model",
          },
        });
        chat.lastActivity = new Date();
        await chat.save();
        socket.emit("ai-response", {
          id: responseMessage._id.toString(),
          userMessageId: userMessage._id.toString(),
          content: response,
          chat: chat._id.toString(),
        });
      } catch (error) {
        console.error("Chat operation error:", error.message);
        socket.emit("ai-error", {
          message:
            error.message ||
            "The assistant could not respond. Please try again.",
        });
      }
    });
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
  return io;
}
module.exports = initSocketServer;













// const { Server } = require("socket.io");

// const UserModel = require("../model/user.model");
// const cookie = require("cookie");
// const jwt = require("jsonwebtoken");

// const {
//   generateContent,
//   generateVector,
// } = require("../service/ai.service");

// const MsgModel = require("../model/msg.models");
// const ChatModel = require("../model/chat.model");

// const {
//   CreateMemory,
//   queryMemory,
//   DeleteMemory,
// } = require("../service/vector.service");

// const pdfParse = require("pdf-parse");
// const mammoth = require("mammoth");

// const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
// const MAX_ATTACHMENT_COUNT = 5;
// const MAX_DOCUMENT_TEXT_LENGTH = 16000;


// async function prepareAttachments(attachments = []) {
//   if (
//     !Array.isArray(attachments) ||
//     attachments.length > MAX_ATTACHMENT_COUNT
//   ) {
//     throw new Error("Upload up to 5 files per message.");
//   }

//   let totalBytes = 0;
//   const prepared = [];

//   for (const attachment of attachments) {
//     const name =
//       typeof attachment?.name === "string"
//         ? attachment.name
//         : "";

//     const extension = name.split(".").pop()?.toLowerCase();

//     const acceptedTypes = {
//       pdf: "application/pdf",
//       docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
//       txt: "text/plain",
//     };

//     const mimeType =
//       acceptedTypes[extension] ||
//       (attachment?.mimeType || "").toLowerCase();

//     const isImage =
//       /^image\/(png|jpeg|webp|gif)$/.test(mimeType);

//     const isDocument =
//       Object.values(acceptedTypes).includes(mimeType);

//     if (
//       !name ||
//       (!isImage && !isDocument) ||
//       typeof attachment?.data !== "string"
//     ) {
//       throw new Error(
//         "Only PDF, DOCX, TXT, PNG, JPG, WEBP, and GIF files are supported."
//       );
//     }

//     const buffer = Buffer.from(
//       attachment.data,
//       "base64"
//     );

//     totalBytes += buffer.length;

//     if (
//       !buffer.length ||
//       totalBytes > MAX_ATTACHMENT_BYTES
//     ) {
//       throw new Error(
//         "Attachments must total 8 MB or less."
//       );
//     }

//     let extractedText = "";

//     if (extension === "pdf") {
//       extractedText = (
//         await pdfParse(buffer)
//       ).text;
//     } else if (extension === "docx") {
//       extractedText = (
//         await mammoth.extractRawText({
//           buffer,
//         })
//       ).value;
//     } else if (extension === "txt") {
//       extractedText = buffer.toString("utf8");
//     }

//     prepared.push({
//       name: name.slice(0, 180),
//       mimeType,
//       extractedText:
//         extractedText.slice(
//           0,
//           MAX_DOCUMENT_TEXT_LENGTH
//         ),
//       imageData: isImage
//         ? attachment.data
//         : null,
//     });
//   }

//   return prepared;
// }


// async function initSocketServer(httpserver) {
//   const io = new Server(httpserver, {
//     maxHttpBufferSize: 12 * 1024 * 1024,

//     cors: {
//       origin:
//         "https://chatgpt-prjct-1-cohrat-1.onrender.com",
//       credentials: true,
//     },
//   });


//   // =========================
//   // SOCKET AUTHENTICATION
//   // =========================

//   io.use(async (socket, next) => {
//     try {
//       const cookies = cookie.parse(
//         socket.handshake.headers?.cookie || ""
//       );

//       if (!cookies.token) {
//         return next(
//           new Error("Unauthorized")
//         );
//       }

//       const decoded = jwt.verify(
//         cookies.token,
//         process.env.JWT_SECRET
//       );

//       const user = await UserModel.findById(
//         decoded.id
//       );

//       if (!user) {
//         return next(
//           new Error("User not found")
//         );
//       }

//       socket.user = user;

//       next();

//     } catch (error) {
//       console.error(
//         "Socket Error:",
//         error.message
//       );

//       next(
//         new Error("Invalid token")
//       );
//     }
//   });


//   // =========================
//   // CONNECTION
//   // =========================

//   io.on("connection", (socket) => {

//     console.log(
//       "User connected:",
//       socket.id
//     );


//     // =========================
//     // CHAT OPERATION
//     // =========================

//     socket.on(
//       "chat-operation",
//       async (payload = {}) => {

//         try {

//           // =========================
//           // FIND CHAT
//           // =========================

//           const chat =
//             await ChatModel.findOne({
//               _id: payload.chat,
//               user: socket.user._id,
//             });

//           if (!chat) {
//             throw new Error(
//               "Conversation not found. Start a new chat and try again."
//             );
//           }


//           // =========================
//           // OPERATION
//           // =========================

//           const operation =
//             payload.operation || "send";


//           // =========================
//           // ATTACHMENTS
//           // =========================

//           const attachments =
//             await prepareAttachments(
//               payload.attachments || []
//             );


//           // =========================
//           // USER MESSAGE
//           // =========================

//           const userText =
//             typeof payload.content === "string"
//               ? payload.content.trim()
//               : "";


//           const extractedText =
//             attachments
//               .map(
//                 (file) =>
//                   file.extractedText &&
//                   `\n\nFile: ${file.name}\n${file.extractedText}`
//               )
//               .filter(Boolean)
//               .join("")
//               .slice(
//                 0,
//                 MAX_DOCUMENT_TEXT_LENGTH
//               );


//           // =========================
//           // VALIDATION
//           // =========================

//           if (
//             operation !== "regenerate" &&
//             !userText &&
//             !attachments.length
//           ) {
//             throw new Error(
//               "Add a message or attach a file first."
//             );
//           }


//           if (userText.length > 8000) {
//             throw new Error(
//               "Messages must be 8000 characters or fewer."
//             );
//           }


//           let userMessage;


//           // =========================
//           // EDIT
//           // =========================

//           if (operation === "edit") {

//             userMessage =
//               await MsgModel.findOne({
//                 _id: payload.messageId,
//                 chat: chat._id,
//                 user: socket.user._id,
//                 role: "user",
//               });


//             if (!userMessage) {
//               throw new Error(
//                 "That message could not be found."
//               );
//             }


//             const removed =
//               await MsgModel.find({
//                 chat: chat._id,
//                 createdAt: {
//                   $gt: userMessage.createdAt,
//                 },
//               })
//                 .select("_id")
//                 .lean();


//             await MsgModel.deleteMany({
//               _id: {
//                 $in: removed.map(
//                   (item) => item._id
//                 ),
//               },
//             });


//             await DeleteMemory(
//               removed.map(
//                 (item) =>
//                   item._id.toString()
//               )
//             );


//             userMessage.content =
//               userText;

//             userMessage.attachments =
//               attachments.map(
//                 ({
//                   name,
//                   mimeType,
//                 }) => ({
//                   name,
//                   mimeType,
//                 })
//               );

//             userMessage.extractedText =
//               extractedText;


//             await userMessage.save();
//           }


//           // =========================
//           // REGENERATE
//           // =========================

//           else if (
//             operation === "regenerate"
//           ) {

//             const targetReply =
//               await MsgModel.findOne({
//                 _id: payload.messageId,
//                 chat: chat._id,
//                 user: socket.user._id,
//                 role: "model",
//               });


//             if (!targetReply) {
//               throw new Error(
//                 "That response could not be found."
//               );
//             }


//             userMessage =
//               await MsgModel.findOne({
//                 chat: chat._id,
//                 user: socket.user._id,
//                 role: "user",
//                 createdAt: {
//                   $lt: targetReply.createdAt,
//                 },
//               }).sort({
//                 createdAt: -1,
//               });


//             if (!userMessage) {
//               throw new Error(
//                 "The question for this response could not be found."
//               );
//             }


//             const removed =
//               await MsgModel.find({
//                 chat: chat._id,
//                 createdAt: {
//                   $gte: targetReply.createdAt,
//                 },
//               })
//                 .select("_id")
//                 .lean();


//             await MsgModel.deleteMany({
//               _id: {
//                 $in: removed.map(
//                   (item) => item._id
//                 ),
//               },
//             });


//             await DeleteMemory(
//               removed.map(
//                 (item) =>
//                   item._id.toString()
//               )
//             );
//           }


//           // =========================
//           // NORMAL SEND
//           // =========================

//           else {

//             userMessage =
//               await MsgModel.create({
//                 chat: chat._id,
//                 user: socket.user._id,
//                 content:
//                   userText ||
//                   "Please review the attached file(s).",

//                 attachments:
//                   attachments.map(
//                     ({
//                       name,
//                       mimeType,
//                     }) => ({
//                       name,
//                       mimeType,
//                     })
//                   ),

//                 extractedText,
//                 role: "user",
//               });
//           }


//           // =========================
//           // GET HISTORY + USER VECTOR
//           // =========================

//           const [
//             messages,
//             queryVector,
//           ] = await Promise.all([

//             MsgModel.find({
//               chat: chat._id,
//             })
//               .sort({
//                 createdAt: 1,
//               })
//               .lean(),

//             generateVector(
//               `${userMessage.content}\n${
//                 userMessage.extractedText || ""
//               }`
//             ),
//           ]);


//           // =========================
//           // QUERY MEMORY
//           // =========================

//           const memory =
//             await queryMemory({
//               queryVector,
//               limit: 3,

//               metadata: {
//                 chat:
//                   chat._id.toString(),
//               },
//             });


//           // =========================
//           // SAVE USER MEMORY
//           // BACKGROUND
//           // =========================

//           CreateMemory({
//             messageId:
//               userMessage._id.toString(),

//             vectors: queryVector,

//             metadata: {
//               chat:
//                 chat._id.toString(),

//               user:
//                 socket.user._id.toString(),

//               text:
//                 `${userMessage.content}\n${
//                   userMessage.extractedText ||
//                   ""
//                 }`,
//             },
//           }).catch((error) => {
//             console.error(
//               "User memory save error:",
//               error.message
//             );
//           });


//           // =========================
//           // BUILD HISTORY
//           // =========================

//           const history =
//             messages.map((message) => {

//               const parts = [
//                 {
//                   text:
//                     `${message.content}${
//                       message.extractedText
//                         ? `\n${message.extractedText}`
//                         : ""
//                     }`,
//                 },
//               ];


//               if (
//                 message._id.toString() ===
//                 userMessage._id.toString()
//               ) {

//                 for (
//                   const file of attachments
//                 ) {

//                   if (file.imageData) {

//                     parts.push({
//                       inlineData: {
//                         mimeType:
//                           file.mimeType,

//                         data:
//                           file.imageData,
//                       },
//                     });

//                   }
//                 }
//               }


//               return {
//                 role: message.role,
//                 parts,
//               };
//             });


//           // =========================
//           // ADD RAG MEMORY
//           // =========================

//           if (memory.length) {

//             history.unshift({
//               role: "user",

//               parts: [
//                 {
//                   text:
//                     `Relevant conversation memories:\n${memory
//                       .map(
//                         (item) =>
//                           item.metadata
//                             ?.text || ""
//                       )
//                       .filter(Boolean)
//                       .join("\n")}`,
//                 },
//               ],
//             });

//           }


//           // =========================
//           // GENERATE AI RESPONSE
//           // =========================

//           console.time(
//             "Gemini response time"
//           );

//           const response =
//             await generateContent(
//               history
//             );

//           console.timeEnd(
//             "Gemini response time"
//           );


//           // =========================
//           // SAVE AI RESPONSE
//           // =========================

//           const responseMessage =
//             await MsgModel.create({
//               chat: chat._id,
//               user: socket.user._id,
//               content: response,
//               role: "model",
//             });


//           // =========================
//           // SEND RESPONSE IMMEDIATELY
//           // =========================

//           socket.emit(
//             "ai-response",
//             {
//               id:
//                 responseMessage._id.toString(),

//               userMessageId:
//                 userMessage._id.toString(),

//               content: response,

//               chat:
//                 chat._id.toString(),
//             }
//           );


//           // =========================
//           // BACKGROUND WORK
//           // =========================

//           (async () => {

//             try {

//               console.log(
//                 "Starting background AI memory save..."
//               );


//               // Generate response vector
//               const responseVectors =
//                 await generateVector(
//                   response
//                 );


//               // Save AI response in Pinecone
//               await CreateMemory({
//                 messageId:
//                   responseMessage._id.toString(),

//                 vectors:
//                   responseVectors,

//                 metadata: {
//                   chat:
//                     chat._id.toString(),

//                   user:
//                     socket.user._id.toString(),

//                   text:
//                     response,

//                   role: "model",
//                 },
//               });


//               // Update chat activity
//               chat.lastActivity =
//                 new Date();

//               await chat.save();


//               console.log(
//                 "Background AI memory save completed."
//               );

//             } catch (backgroundError) {

//               console.error(
//                 "Background AI memory/save error:",
//                 backgroundError.message
//               );

//             }

//           })();


//         } catch (error) {

//           console.error(
//             "Chat operation error:",
//             error.message
//           );


//           socket.emit(
//             "ai-error",
//             {
//               message:
//                 error.message ||
//                 "The assistant could not respond. Please try again.",
//             }
//           );

//         }

//       }
//     );


//     // =========================
//     // DISCONNECT
//     // =========================

//     socket.on(
//       "disconnect",
//       () => {

//         console.log(
//           "User disconnected:",
//           socket.id
//         );

//       }
//     );

//   });


//   return io;
// }


// module.exports = initSocketServer;