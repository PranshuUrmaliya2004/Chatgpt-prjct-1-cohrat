

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
// //socket io middlewear use
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

//         // console.table( socket.user);

//         // console.log('New Socket connected:', socket.id);


        

//         // Client se message receive
// //         socket.on('ai-msg', async(msgPayload) => {

// //             console.log(msgPayload);
// //       const message=    await MsgModel.create({
// //               chat:msgPayload.chat,
// //               user:msgPayload.user,
// //               content:msgPayload.content,
// //               role:"user"
// //           })

// //         const vectors= await generateVector(msgPayload.content);
           
// //         console.log("VECTOR:", vectors);
// // console.log("VECTOR LENGTH:", vectors?.length);


// //         await CreateMemory({
// //             messageId:message._id,
// //             vectors,
// //             metadata:{
// //                 chat:msgPayload.chat,
// //                 user:socket.user._id,
// //                 text:msgPayload.content
// //             }

// //         })


// //         // const memory = await queryMemory({
// //         //    queryVector: vectors,
// //         //     limit:1,
// //         //     metadata:{}
// //         // })

// //         const memory = await queryMemory({
// //     queryVector: vectors,
// //     limit: 3,
// //     metadata: {
// //         chat: msgPayload.chat
// //     }
// // });
// //         console.log(memory)
// //           const chatHistory=await MsgModel.find({
// //             chat:msgPayload.chat
// //           }).sort({ createdAt: -1 }).limit(4).lean();chatHistory.reverse();,
         
// //     const stm = chatHistory.map(item => {
// //     return {
// //         role: item.role,
// //         parts: [
// //             {
// //                 text: item.content
// //             }
// //         ]
// //     };
// // });

 
// // const ltm = [
// //     {
// //         role: "user",
// //         parts: [
// //             {
// //                 text: item
// //             }
// //         ]
// //     }
// // ];
  
    
  


// //        const response=await generateContent(chatHistory.map(item =>{
        
// //        return { role:item.role,
// //            parts:[{text:item.content}]
// //          }
// //         }))

        
// //        const responseMsg= await MsgModel.create({
// //               chat:msgPayload.chat,
// //               user:msgPayload.user,
// //               content:response,
// //               role:"model"

// //           })

// //            const responseVectors= await generateVector(response);
// //          await CreateMemory({
// //             messageId:responseMsg._id,
// //             vectors:responseVectors,
// //               metadata:{
// //                 chat:msgPayload.chat,
// //                 user:socket.user._id,
// //                 text:response
// //             }

// //         })





// socket.on('ai-msg', async (msgPayload) => {
//     try {
//         console.log(msgPayload);

//         // 1. Save user message
//         const message = await MsgModel.create({
//             chat: msgPayload.chat,
//             user: socket.user._id,
//             content: msgPayload.content,
//             role: "user"
//         });

//         // 2. Generate vector for user message
//         const vectors = await generateVector(msgPayload.content);

//         console.log("VECTOR LENGTH:", vectors?.length);

//         // 3. Save user message in long-term memory
//         await CreateMemory({
//             messageId: message._id,
//             vectors,
//             metadata: {
//                 chat: msgPayload.chat,
//                 user: socket.user._id,
//                 text: msgPayload.content
//             }
//         });

//         // 4. Query long-term memory
//         const memory = await queryMemory({
//             queryVector: vectors,
//             limit: 3,
//             metadata: {
//                 chat: msgPayload.chat
//             }
//         });

//         console.log("MEMORY:", memory);

//         // 5. Get short-term memory
//         const chatHistory = await MsgModel.find({
//             chat: msgPayload.chat
//         })
//             .sort({ createdAt: -1 })
//             .limit(4)
//             .lean();

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

const {
    CreateMemory,
    queryMemory
} = require('../service/vector.service');


async function initSocketServer(httpserver) {

    const io = new Server(httpserver, {});


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


        // Receive AI Message
        socket.on('ai-msg', async (msgPayload) => {

            try {

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

        content: msgPayload.content,

        role: "user"

    }),

    generateVector(msgPayload.content)
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