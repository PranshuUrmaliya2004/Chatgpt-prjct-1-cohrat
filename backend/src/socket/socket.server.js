

// const { Server } = require('socket.io');
// const UserModel = require('../model/user.model');
// const cookie = require('cookie');
// const jwt = require('jsonwebtoken');
// const { generateContent, generateVector } = require("../service/ai.service");
// const MsgModel = require("../model/msg.models")

// const {
//     CreateMemory,
//     queryMemory
// } = require("../service/vector.service");
// async function initSocketServer(httpserver) {

//     const io = new Server(httpserver, {});
// //         role: item.role,
// //         parts: [
//         chatHistory.reverse();

//         // 6. Convert STM to Gemini format
//         const stm = chatHistory.map(item => {
//             return {
//                 role: item.role,
//                 parts: [
//                     {
//                         text: item.content
//                     }
//                 ]
//             };
//         });

//         // 7. Convert LTM to Gemini format
//         const ltm = (memory || []).map(item => {
//             return {
//                 role: "user",
//                 parts: [
//                     {
//                         text: item.text || item.metadata?.text || ""
//                     }
//                 ]
//             };
//         });

//         // 8. Combine STM + LTM
//         const history = [
//             ...ltm,
//             ...stm
//         ];

//         console.log("HISTORY:", history);

//         // 9. Generate AI response
//         const response = await generateContent(history);

//         // 10. Save AI response
//         const responseMsg = await MsgModel.create({
//             chat: msgPayload.chat,
//             user: socket.user._id,
//             content: response,
//             role: "model"
//         });

//         // 11. Generate AI response vector
//         const responseVectors = await generateVector(response);

//         // 12. Save AI response in LTM
//         await CreateMemory({
//             messageId: responseMsg._id,
//             vectors: responseVectors,
//             metadata: {
//                 chat: msgPayload.chat,
//                 user: socket.user._id,
//                 text: response
//             }
//         });

//         // 13. Send response to client
//         socket.emit("ai-response", {
//             content: response,
//             chat: msgPayload.chat
//         });

//     } catch (error) {
//         console.log("AI Message Error:", error.message);

//         socket.emit("ai-error", {
//             message: "Something went wrong"
//         });
//     }
// });

//             // Client ko message send
//             socket.emit('ai-response', {
//                 content:response,
//                 chat:msgPayload.chat
//             });

//         });


//         // User disconnect
//     //     socket.on('disconnect', () => {

//     //         console.log('User disconnected:', socket.id);

//     //     });

//     // });

    
//     return io;
// }

// module.exports = initSocketServer;

/*
const { Server } = require('socket.io');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const UserModel = require('../model/user.model');
const ChatModel = require('../model/chat.model');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const MsgModel = require('../model/msg.models');
const { generateContent } = require('../service/ai.service');

async function initSocketServer(httpserver) {
    const io = new Server(httpserver, {
        cors: {
            origin: 'origin: "https://chatgpt-prjct-1-cohrat-1.onrender.com"',
            credentials: true
        }
    });

    io.use(async (socket, next) => {
        try {
            const cookies = cookie.parse(socket.handshake.headers?.cookie || '');
            if (!cookies.token) return next(new Error('Unauthorized'));

            const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
            const user = await UserModel.findById(decoded.id);
            if (!user) return next(new Error('Unauthorized'));

            socket.user = user;
            next();
        } catch {
            next(new Error('Unauthorized'));
        }
    });

    io.on('connection', (socket) => {
        socket.on('ai-msg', async (payload = {}) => {
            try {
                const content = typeof payload.content === 'string' ? payload.content.trim() : '';
                if (!content || content.length > 8000 || !payload.chat) {
                    socket.emit('ai-error', { message: 'Enter a message of up to 8000 characters.' });
                    return;
                }

                const chat = await ChatModel.findOne({
                    _id: payload.chat,
                    user: socket.user._id
                });
                if (!chat) {
                    socket.emit('ai-error', { message: 'Conversation not found. Start a new chat and try again.' });
                    return;
                }

                await MsgModel.create({
                    chat: chat._id,
                    user: socket.user._id,
                    content,
                    role: 'user'
                });

                const messages = await MsgModel.find({ chat: chat._id })
                    .sort({ createdAt: -1 })
                    .limit(12)
                    .lean();
                messages.reverse();

                const response = await generateContent(messages.map((message) => ({
                    role: message.role,
                    parts: [{ text: message.content }]
                })));

                await MsgModel.create({
                    chat: chat._id,
                    user: socket.user._id,
                    content: response,
                    role: 'model'
                });
                chat.lastActivity = new Date();
                await chat.save();

                socket.emit('ai-response', {
                    content: response,
                    chat: chat._id.toString()
                });
            } catch (error) {
                console.error('AI message error:', error.message);
                socket.emit('ai-error', { message: 'The assistant could not respond. Please try again.' });
            }
        });
    });

    return io;
}

module.exports = initSocketServer;
*/







// const { Server } = require("socket.io");
// const UserModel = require("../model/user.model");
// const cookie = require("cookie");
// const jwt = require("jsonwebtoken");

// const {
//     generateContent,
//     generateVector
// } = require("../service/ai.service");

// const MsgModel = require("../model/msg.models");

// const {
//     CreateMemory,
//     queryMemory
// } = require("../service/vector.service");


// async function initSocketServer(httpserver) {

//     const io = new Server(httpserver, {});


//     // Socket middleware
//     io.use(async (socket, next) => {

//         try {

//             const cookies = cookie.parse(
//                 socket.handshake.headers?.cookie || ""
//             );

//             if (!cookies.token) {
//                 return next(new Error("Unauthorized"));
//             }

//             const decoded = jwt.verify(
//                 cookies.token,
//                 process.env.JWT_SECRET
//             );

//             const user = await UserModel.findById(decoded.id);

//             if (!user) {
//                 return next(new Error("User not found"));
//             }

//             socket.user = user;

//             next();

//         } catch (error) {

//             console.log("Socket Error:", error.message);

//             next(new Error("Invalid token"));

//         }

//     });


//     // Connection
//     io.on("connection", (socket) => {

//         console.log("User connected:", socket.id);


//         socket.on("ai-msg", async (msgPayload) => {

//             try {

//                 console.log("USER MESSAGE:", msgPayload);


//                 const userId =
//                     socket.user._id.toString();

//                 const chatId =
//                     msgPayload.chat.toString();


//                 // 1. Generate vector of current question
//                 const vectors =
//                     await generateVector(
//                         msgPayload.content
//                     );

//                 console.log(
//                     "VECTOR LENGTH:",
//                     vectors?.length
//                 );


//                 // 2. Search OLD memories FIRST
//                 const memory =
//                     await queryMemory({

//                         queryVector: vectors,

//                         limit: 5,

//                         metadata: {
//                             user: userId
//                         }

//                     });

//                 console.log(
//                     "PINECONE MEMORY:",
//                     memory
//                 );


//                 // 3. Save user message in MongoDB
//                 const message =
//                     await MsgModel.create({

//                         chat: chatId,

//                         user: msgPayload.user,

//                         content: msgPayload.content,

//                         role: "user"

//                     });


//                 // 4. Save current user message in Pinecone
//                 await CreateMemory({

//                     messageId:
//                         message._id.toString(),

//                     vectors: vectors,

//                     metadata: {

//                         chat: chatId,

//                         user: userId,

//                         text: msgPayload.content

//                     }

//                 });


//                 // 5. Get current chat history
//                 const chatHistory =
//                     await MsgModel.find({
//                         chat: chatId
//                     })
//                     .sort({
//                         createdAt: -1
//                     })
//                     .limit(4)
//                     .lean();

//                 chatHistory.reverse();


       




//                 // 6. Convert memory into text
//                 const memoryText =
//                     memory
//                         .map(item =>
//                             item.metadata?.text
//                         )
//                         .filter(Boolean)
//                         .join("\n");


//                 // 7. Create prompt
//                 const promptText = `

// You are a helpful AI assistant.

// Use relevant previous memories when answering.

// Do not invent information.

// RELEVANT PREVIOUS MEMORIES:

// ${memoryText || "No relevant previous memory found."}

// CURRENT CHAT HISTORY:

// ${chatHistory
//     .map(item =>
//         `${item.role}: ${item.content}`
//     )
//     .join("\n")}

// Answer the latest user message.
// `;


//                 // 8. Generate AI response
//                 const response =
//                     await generateContent([
//                         {
//                             role: "user",
//                             parts: [
//                                 {
//                                     text: promptText
//                                 }
//                             ]
//                         }
//                     ]);


//                 console.log(
//                     "AI RESPONSE:",
//                     response
//                 );


//                 // 9. Save AI response in MongoDB
//                 const responseMsg =
//                     await MsgModel.create({

//                         chat: chatId,

//                         user: msgPayload.user,

//                         content: response,

//                         role: "model"

//                     });


//                 // 10. Generate AI response vector
//                 const responseVectors =
//                     await generateVector(
//                         response
//                     );


//                 // 11. Save AI response in Pinecone
//                 await CreateMemory({

//                     messageId:
//                         responseMsg._id.toString(),

//                     vectors:
//                         responseVectors,

//                     metadata: {

//                         chat: chatId,

//                         user: userId,

//                         text: response

//                     }

//                 });


//                 // 12. Send response to frontend
//                 socket.emit("ai-response", {

//                     content: response,

//                     chat: chatId

//                 });


//             } catch (error) {

//                 console.log(
//                     "AI MSG ERROR:",
//                     error
//                 );

//                 socket.emit("ai-error", {

//                     message:
//                         "Something went wrong"

//                 });

//             }

//         });


//         socket.on("disconnect", () => {

//             console.log(
//                 "User disconnected:",
//                 socket.id
//             );

//         });

//     });


//     return io;
// }


// module.exports = initSocketServer;








// const { Server } = require('socket.io');
// const UserModel = require('../model/user.model');
// const cookie = require('cookie');
// const jwt = require('jsonwebtoken');
// const { generateContent, generateVector } = require("../service/ai.service");
// const MsgModel = require("../model/msg.models");

// const {
//     CreateMemory,
//     queryMemory
// } = require("../service/vector.service");

// async function initSocketServer(httpserver) {

//     const io = new Server(httpserver, {});

//     // socket io middleware
//     io.use(async (socket, next) => {

//         try {

//             const cookies = cookie.parse(
//                 socket.handshake.headers?.cookie || ""
//             );

//             if (!cookies.token) {
//                 return next(new Error("Unauthorized"));
//             }

//             const decoded = jwt.verify(
//                 cookies.token,
//                 process.env.JWT_SECRET
//             );

//             const user = await UserModel.findById(decoded.id);

//             if (!user) {
//                 return next(new Error("User not found"));
//             }

//             socket.user = user;

//             next();

//         } catch (error) {

//             console.log("Socket Error:", error.message);

//             next(new Error("Invalid token"));
//         }

//     });


//     io.on('connection', (socket) => {

//         // Client se message receive
//         socket.on('ai-msg', async (msgPayload) => {

//             try {

//                 console.log(msgPayload);

//                 const message = await MsgModel.create({
//                     chat: msgPayload.chat,
//                     user: socket.user._id,
//                     content: msgPayload.content,
//                     role: "user"
//                 });


//                 const vectors = await generateVector(msgPayload.content);

//                 console.log("VECTOR LENGTH:", vectors?.length);


//                 await CreateMemory({
//                     messageId: message._id,
//                     vectors,
//                     metadata: {
//                         chat: msgPayload.chat,
//                         user: socket.user._id,
//                         text: msgPayload.content
//                     }
//                 });


//                 const memory = await queryMemory({
//                     queryVector: vectors,
//                     limit: 3,
//                     metadata: {
//                         chat: msgPayload.chat
//                     }
//                 });

//                 console.log("MEMORY:", memory);


//                 const chatHistory = await MsgModel.find({
//                     chat: msgPayload.chat
//                 })
//                     .sort({ createdAt: -1 })
//                     .limit(4)
//                     .lean();

//                 chatHistory.reverse();


//                 const memoryText = memory
//                     .map(item => item.metadata?.text)
//                     .filter(Boolean)
//                     .join("\n");


//                 const response = await generateContent([
//                     {
//                         role: "user",
//                         parts: [{
//                             text: `Relevant memory:
// ${memoryText}

// Recent conversation:
// ${chatHistory.map(item => item.content).join("\n")}`
//                         }]
//                     }
//                 ]);


//                 const responseMsg = await MsgModel.create({
//                     chat: msgPayload.chat,
//                     user: socket.user._id,
//                     content: response,
//                     role: "model"
//                 });


//                 const responseVectors = await generateVector(response);

//                 await CreateMemory({
//                     messageId: responseMsg._id,
//                     vectors: responseVectors,
//                     metadata: {
//                         chat: msgPayload.chat,
//                         user: socket.user._id,
//                         text: response
//                     }
//                 });


//                 socket.emit('ai-response', {
//                     content: response,
//                     chat: msgPayload.chat
//                 });

//             } catch (error) {

//                 console.log("AI Message Error:", error.message);

//                 socket.emit('ai-response', {
//                     content: "AI service temporarily unavailable.",
//                     chat: msgPayload.chat
//                 });

//             }

//         });

//     });


//     return io;
// }

// module.exports = initSocketServer;













const { Server } = require('socket.io');
const UserModel = require('../model/user.model');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');

const {
    generateContent,
    generateVector
} = require('../service/ai.service');

const MsgModel = require('../model/msg.models');
const ChatModel = require('../model/chat.model');

const {
    CreateMemory,
    queryMemory,
    DeleteMemory
} = require('../service/vector.service');

const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const MAX_ATTACHMENT_COUNT = 5;
const MAX_DOCUMENT_TEXT_LENGTH = 16000;

async function prepareAttachments(attachments = []) {
    if (!Array.isArray(attachments) || attachments.length > MAX_ATTACHMENT_COUNT) {
        throw new Error('Upload up to 5 files per message.');
    }

    let totalBytes = 0;
    const prepared = [];

    for (const attachment of attachments) {
        const name = typeof attachment?.name === 'string' ? attachment.name : '';
        const extension = name.split('.').pop()?.toLowerCase();
        const acceptedTypes = {
            pdf: 'application/pdf',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            txt: 'text/plain'
        };
        const mimeType = acceptedTypes[extension] || (attachment?.mimeType || '').toLowerCase();
        const isImage = /^image\/(png|jpeg|webp|gif)$/.test(mimeType);
        const isDocument = Object.values(acceptedTypes).includes(mimeType);

        if (!name || (!isImage && !isDocument) || typeof attachment?.data !== 'string') {
            throw new Error('Only PDF, DOCX, TXT, PNG, JPG, WEBP, and GIF files are supported.');
        }

        const buffer = Buffer.from(attachment.data, 'base64');
        totalBytes += buffer.length;
        if (!buffer.length || totalBytes > MAX_ATTACHMENT_BYTES) {
            throw new Error('Attachments must total 8 MB or less.');
        }

        let extractedText = '';
        if (extension === 'pdf') {
            extractedText = (await pdfParse(buffer)).text;
        } else if (extension === 'docx') {
            extractedText = (await mammoth.extractRawText({ buffer })).value;
        } else if (extension === 'txt') {
            extractedText = buffer.toString('utf8');
        }

        prepared.push({
            name: name.slice(0, 180),
            mimeType,
            extractedText: extractedText.slice(0, MAX_DOCUMENT_TEXT_LENGTH),
            imageData: isImage ? attachment.data : null
        });
    }

    return prepared;
}


async function initSocketServer(httpserver) {

    const io = new Server(httpserver, {
        maxHttpBufferSize: 12 * 1024 * 1024,
        cors: {
            origin: process.env.FRONTEND_URL || 'origin: "https://chatgpt-prjct-1-cohrat-1.onrender.com"',
            credentials: true
        }
    });


    // Socket.IO Middleware
    io.use(async (socket, next) => {

        try {

            const cookies = cookie.parse(
                socket.handshake.headers?.cookie || ""
            );

            if (!cookies.token) {
                return next(new Error("Unauthorized"));
            }

            const decoded = jwt.verify(
                cookies.token,
                process.env.JWT_SECRET
            );

            const user = await UserModel.findById(decoded.id);

            if (!user) {
                return next(new Error("User not found"));
            }

            socket.user = user;

            next();

        } catch (error) {

            console.log("Socket Error:", error.message);

            next(new Error("Invalid token"));

        }

    });


    // Socket Connection
    io.on('connection', (socket) => {

        console.log("User connected:", socket.id);


        socket.on('chat-operation', async (payload = {}) => {
            try {
                const chat = await ChatModel.findOne({
                    _id: payload.chat,
                    user: socket.user._id
                });
                if (!chat) throw new Error('Conversation not found. Start a new chat and try again.');

                const operation = payload.operation || 'send';
                const attachments = await prepareAttachments(payload.attachments || []);
                const userText = typeof payload.content === 'string' ? payload.content.trim() : '';
                const extractedText = attachments
                    .map((file) => file.extractedText && `\n\nFile: ${file.name}\n${file.extractedText}`)
                    .filter(Boolean)
                    .join('')
                    .slice(0, MAX_DOCUMENT_TEXT_LENGTH);
                if (operation !== 'regenerate' && !userText && !attachments.length) {
                    throw new Error('Add a message or attach a file first.');
                }
                if (userText.length > 8000) throw new Error('Messages must be 8000 characters or fewer.');

                let userMessage;
                if (operation === 'edit') {
                    userMessage = await MsgModel.findOne({
                        _id: payload.messageId,
                        chat: chat._id,
                        user: socket.user._id,
                        role: 'user'
                    });
                    if (!userMessage) throw new Error('That message could not be found.');

                    const removed = await MsgModel.find({
                        chat: chat._id,
                        createdAt: { $gt: userMessage.createdAt }
                    }).select('_id').lean();
                    await MsgModel.deleteMany({ _id: { $in: removed.map((item) => item._id) } });
                    await DeleteMemory(removed.map((item) => item._id.toString()));
                    userMessage.content = userText;
                    userMessage.attachments = attachments.map(({ name, mimeType }) => ({ name, mimeType }));
                    userMessage.extractedText = extractedText;
                    await userMessage.save();
                } else if (operation === 'regenerate') {
                    const targetReply = await MsgModel.findOne({
                        _id: payload.messageId,
                        chat: chat._id,
                        user: socket.user._id,
                        role: 'model'
                    });
                    if (!targetReply) throw new Error('That response could not be found.');

                    userMessage = await MsgModel.findOne({
                        chat: chat._id,
                        user: socket.user._id,
                        role: 'user',
                        createdAt: { $lt: targetReply.createdAt }
                    }).sort({ createdAt: -1 });
                    if (!userMessage) throw new Error('The question for this response could not be found.');

                    const removed = await MsgModel.find({
                        chat: chat._id,
                        createdAt: { $gte: targetReply.createdAt }
                    }).select('_id').lean();
                    await MsgModel.deleteMany({ _id: { $in: removed.map((item) => item._id) } });
                    await DeleteMemory(removed.map((item) => item._id.toString()));
                } else {
                    userMessage = await MsgModel.create({
                        chat: chat._id,
                        user: socket.user._id,
                        content: userText || 'Please review the attached file(s).',
                        attachments: attachments.map(({ name, mimeType }) => ({ name, mimeType })),
                        extractedText,
                        role: 'user'
                    });
                }

                const [messages, queryVector] = await Promise.all([
                    MsgModel.find({ chat: chat._id }).sort({ createdAt: 1 }).lean(),
                    generateVector(`${userMessage.content}\n${userMessage.extractedText || ''}`)
                ]);
                await CreateMemory({
                    messageId: userMessage._id.toString(),
                    vectors: queryVector,
                    metadata: {
                        chat: chat._id.toString(),
                        user: socket.user._id.toString(),
                        text: `${userMessage.content}\n${userMessage.extractedText || ''}`
                    }
                });

                const memory = await queryMemory({
                    queryVector,
                    limit: 3,
                    metadata: { chat: chat._id.toString() }
                });
                const history = messages.map((message) => {
                    const parts = [{
                        text: `${message.content}${message.extractedText ? `\n${message.extractedText}` : ''}`
                    }];
                    if (message._id.toString() === userMessage._id.toString()) {
                        for (const file of attachments) {
                            if (file.imageData) {
                                parts.push({ inlineData: { mimeType: file.mimeType, data: file.imageData } });
                            }
                        }
                    }
                    return { role: message.role, parts };
                });
                if (memory.length) {
                    history.unshift({
                        role: 'user',
                        parts: [{ text: `Relevant conversation memories:\n${memory.map((item) => item.metadata?.text || '').filter(Boolean).join('\n')}` }]
                    });
                }

                const response = await generateContent(history);
                const [responseMessage, responseVectors] = await Promise.all([
                    MsgModel.create({
                        chat: chat._id,
                        user: socket.user._id,
                        content: response,
                        role: 'model'
                    }),
                    generateVector(response)
                ]);
                await CreateMemory({
                    messageId: responseMessage._id.toString(),
                    vectors: responseVectors,
                    metadata: {
                        chat: chat._id.toString(),
                        user: socket.user._id.toString(),
                        text: response,
                        role: 'model'
                    }
                });

                chat.lastActivity = new Date();
                await chat.save();
                socket.emit('ai-response', {
                    id: responseMessage._id.toString(),
                    userMessageId: userMessage._id.toString(),
                    content: response,
                    chat: chat._id.toString()
                });
            } catch (error) {
                console.error('Chat operation error:', error.message);
                socket.emit('ai-error', { message: error.message || 'The assistant could not respond. Please try again.' });
            }
        });


        // Receive AI Message
        socket.on('ai-msg', async (msgPayload) => {

            try {

                const content = typeof msgPayload?.content === 'string'
                    ? msgPayload.content.trim()
                    : '';
                if (!content || content.length > 8000 || !msgPayload.chat) {
                    socket.emit('ai-error', {
                        message: 'Enter a message of up to 8000 characters.'
                    });
                    return;
                }

                const chat = await ChatModel.findOne({
                    _id: msgPayload.chat,
                    user: socket.user._id
                });
                if (!chat) {
                    socket.emit('ai-error', {
                        message: 'Conversation not found. Start a new chat and try again.'
                    });
                    return;
                }

                console.log("Message Payload:", msgPayload);


                // // 1. Save User Message
                // const message = await MsgModel.create({

                //     chat: msgPayload.chat,

                //     user: socket.user._id,

                //     content: msgPayload.content,

                //     role: "user"

                // });


                // // 2. Generate Vector
                // const vectors = await generateVector(
                //     msgPayload.content
                // );

                // console.log(
                //     "VECTOR LENGTH:",
                //     vectors?.length
                // );


            //     const [message,vectors]=await Promise.all([
            //         await MsgModel.create({

            //         chat: msgPayload.chat,

            //         user: socket.user._id,

            //         content: msgPayload.content,

            //         role: "user"

            //      }),
            //     generateVector(msgPayload.content ),
            // ]),
            //    await  CreateMemory({

            //         messageId: message._id,

            //         vectors,

            //         metadata: {

            //             chat: msgPayload.chat,

            //             user: socket.user._id,

            //             text: msgPayload.content

            //         }

            //     })

                
const [message, vectors] = await Promise.all([
    MsgModel.create({

        chat: msgPayload.chat,

        user: socket.user._id,

        content,

        role: "user"

    }),

    generateVector(content)
]);

await CreateMemory({

    messageId: message._id,

    vectors,

    metadata: {

        chat: msgPayload.chat,

        user: socket.user._id,

        text: msgPayload.content

    }

});

                const [memory,chatHistory]=await Promise.all([
                     queryMemory({

                    queryVector: vectors,

                    limit: 3,

                    metadata: {

                        chat: msgPayload.chat

                    }

                }),
                 MsgModel.find({

                    chat: msgPayload.chat

                })
                .sort({ createdAt: -1 })
        .limit(4)
        .lean()
]);

chatHistory.reverse();


                

            

                // 3. Save User Message in Long-Term Memory
                // await CreateMemory({

                //     messageId: message._id,

                //     vectors,

                //     metadata: {

                //         chat: msgPayload.chat,

                //         user: socket.user._id,

                //         text: msgPayload.content

                //     }

                // });


                // 4. Query Long-Term Memory
                // const memory = await queryMemory({

                //     queryVector: vectors,

                //     limit: 3,

                //     metadata: {

                //         chat: msgPayload.chat

                //     }

                // });

                // console.log("MEMORY:", memory);


                // // 5. Get Short-Term Memory
                // const chatHistory = await MsgModel.find({

                //     chat: msgPayload.chat

                // })
                //     .sort({ createdAt: -1 })
                //     .limit(4)
                //     .lean();


                // chatHistory.reverse();


                // 6. Convert STM to Gemini Format
                const stm = chatHistory.map(item => {

                    return {

                        role: item.role,

                        parts: [

                            {

                                text: item.content

                            }

                        ]

                    };

                });


                // 7. Convert LTM to Gemini Format
                const ltm = (memory || []).map(item => {

                    return {

                        role: "user",

                        parts: [

                            {

                                text: item.text ||
                                    item.metadata?.text ||
                                    ""

                            }

                        ]

                    };

                });


                // 8. Combine STM + LTM
                const history = [

                    ...ltm,

                    ...stm

                ];

                console.log("HISTORY:", history);


                // 9. Generate AI Response
                const response = await generateContent(
                    history
                );


                // 10. Save AI Response
                // const responseMsg = await MsgModel.create({

                //     chat: msgPayload.chat,

                //     user: socket.user._id,

                //     content: response,

                //     role: "model"

                // });


                // // 11. Generate AI Response Vector
                // const responseVectors = await generateVector(
                //     response
                // );


                    const [responseMsg,responseVectors]=await Promise.all([
 MsgModel.create({

                    chat: msgPayload.chat,

                    user: socket.user._id,

                    content: response,

                    role: "model"

                }),
                generateVector(
                    response
                )
                
                ])




                // 12. Save AI Response in Long-Term Memory
                await CreateMemory({

                    messageId: responseMsg._id,

                    vectors: responseVectors,

                    metadata: {

                        chat: msgPayload.chat,

                        user: socket.user._id,

                        text: response,
                           role: "model"


                    }

                });


                // 13. Send Response to Client
                socket.emit('ai-response', {

                    content: response,

                    chat: msgPayload.chat

                });


            } catch (error) {

                console.log(
                    "AI Message Error:",
                    error.message
                );

                socket.emit('ai-error', {

                    message: "Something went wrong"

                });

            }

        });


        // User Disconnect
        socket.on('disconnect', () => {

            console.log(
                "User disconnected:",
                socket.id
            );

        });

    });


    return io;

}


module.exports = initSocketServer;