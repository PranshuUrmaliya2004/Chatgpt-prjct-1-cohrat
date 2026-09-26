 

 const mongoose=require('mongoose')
 
 
 const MsgSchema= new mongoose.Schema({
   
 
     chat:{
       type:mongoose.Schema.Types.ObjectId,
         ref:"chat"
     },
 
     user:{
   
         type:mongoose.Schema.Types.ObjectId,
         ref:"user"
 
     } ,  
    
 
     
 
     content:{
         type:String,
         required:true
     },
      attachments:[{
          name:{ type:String, required:true },
          mimeType:{ type:String, required:true }
      }],
      extractedText:{
          type:String,
          default:''
      },
     role:{
        type:String,
        enum:["user","model","system"]

     }
    },{
         timestamps:true
     }
     
 )
 
 
 const MsgModel= mongoose.model('message',MsgSchema)
 
 module.exports=MsgModel
 