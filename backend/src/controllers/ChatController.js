const express=require('express')
const ChatModel = require('../model/chat.model')
const chatRouter=require("../routes/chat.routes")

async function CreateChat(req,res){
   const {title}=req.body;
   const user=req.user;

   const chat = await ChatModel.create({
          user:user._id,
          title

   })

   res.send({
         message:"Chat Create Successfully",
    chat:{
        id:chat._id,
        title:chat.title,
        lastActivity:chat.lastActivity,
         user:chat.user
    }
        
   })


}





module.exports={
   CreateChat
}