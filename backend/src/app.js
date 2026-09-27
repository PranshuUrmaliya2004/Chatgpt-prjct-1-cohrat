// const mongoose=require('../src/db/db')
// const express = require('express');
// const cookieParser=require('cookie-parser')
// const authRouter=require('./routes/auth.routes');
// const chatRouter=require('./routes/chat.routes');
// const cors = require("cors");
// const path=require('path')
// const app = express();
// app.use(cors({
//     // origin: "http://localhost:5173",
//     origin: true,
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"]
// }));
// app.use(express.json())
// app.use(cookieParser())
// app.use('/api/auth',authRouter)
// app.use('/api/chat',chatRouter)
// app.use(express.static(path.join(__dirname,'../public')))
// app.get("*name",(req,res)=>{
//     res.sendFile(path.join(__dirname,'../public/index.html'))
// })
// module.exports=app















// const express = require('express');
// const UserModel = require('../model/user.model');
// const jwt=require('jsonwebtoken')

// const router = express.Router();


// // REGISTER
// router.post('/register', async (req, res) => {
//     try {
//         const { username, password } = req.body;

//    const Username = await UserModel.findOne({
//             username:username
//         });
   
//          if (Username) {
//             return res.status(401).json({
//                 message: "User Already exist"
//             });
//         }

//         const user = await UserModel.create({
//             username,
//             password
//         });


    
//     const token=jwt.sign({
//         id:user._id
//      } ,process.env.JWT_SECRET)

//      res.cookie("Check",token,{
//         expires:new Date(Date.now()+1000*60*60*24*7),//7days
//      })
//         res.status(201).json({
//             message: "user registered Successfully",
//             user,
//             token
//         });


//     } catch (error) {
//         res.status(500).json({
//             message: "Registration failed",
//             error: error.message
//         });
//     }
// });


// // LOGIN
// router.post('/login', async (req, res) => {
//     try {
//         const { username, password } = req.body;

//         const user = await UserModel.findOne({
//             username:username
//         });

//         if (!user) {
//             return res.status(401).json({
//                 message: "User account not found"
//             });
//         }
// //here i can verify the password
//         // if (user.password !== password) {
//         //     return res.status(401).json({
//         //         message: "Invalid password"
//         //     });
//         // }


//         const isPasswordValid=user.password === password
//         if(!isPasswordValid){
//              return res.status(401).json({
//                 message: "Invalid password"
//             });
        

//         }

//          const token=jwt.sign({
//         id:user._id
//      } ,process.env.JWT_SECRET)

//      res.cookie("Check",token,{
//         expires:new Date(Date.now()+1000*60*60*24*7),//7days
//      })


//         res.status(200).json({
//             message: "Login successful",
//             user
//         });

//     } catch (error) {
//         res.status(500).json({
//             message: "Login failed",
//             error: error.message
//         });
//     }
// });


// router.get('/logout',async(req,res)=>{
//     res.clearCookie("Clear")


//     res.status(200).json({
//      message:"Logout Successfully"
//     })

// })



// router.get('/user',async(req,res)=>{
//     const token=req.cookies.Check

//     if(!token){
//         return res.status(401).json({
//           message:"Unauthorized"
//         })



//     }

//     try{
//  const decoded=   jwt.verify(token,process.env.JWT_SECRET)


//   const user= await UserModel.findOne({
//     _id:decoded.id
//   }).select("-password")

//  res.status(201).json({
//     message:"user data fetched Successfully",
//     user
//  })
//     }
//     catch(err){
//      res.status(401).json({

//       message:"Invalid Token"
//      })
//     }
// })



// module.exports = router;







// const mongoose = require('../src/db/db')
// const express = require('express')
// const cookieParser = require('cookie-parser')
// const authRouter = require('./routes/auth.routes')
// const chatRouter = require('./routes/chat.routes')
// const cors = require('cors')
// const path = require('path')

// const app = express()

// app.use(cors({
//     origin: true,
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"]
// }))

// app.use(express.json())
// app.use(cookieParser())

// app.use('/api/auth', authRouter)
// app.use('/api/chat', chatRouter)

// app.use(express.static(path.join(__dirname, '../public')))

// app.get("*name", (req, res) => {
//     res.sendFile(path.join(__dirname, '../public/index.html'))
// })

// module.exports = app






const mongoose = require('../src/db/db')

const express = require('express')
const cookieParser = require('cookie-parser')

const authRouter = require('./routes/auth.routes')
const chatRouter = require('./routes/chat.routes')

const cors = require('cors')
const path = require('path')

const app = express()

app.use(cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))

app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRouter)
app.use('/api/chat', chatRouter)

// Serve frontend files
app.use(express.static(path.join(__dirname, '../public')))

// Serve index.html
app.get("*name", (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
})

module.exports = app