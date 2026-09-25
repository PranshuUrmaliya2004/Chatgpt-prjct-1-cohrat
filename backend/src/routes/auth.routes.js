const express=require('express')
const UserModel = require('../model/user.model')
// const jwt = require('jsonwebtoken');
// const bcrypt = require('bcryptjs');
const {registerController, loginController}=require('../controllers/auth.controller')

const router=express.Router()

router.post('/register',registerController)
router.post('/login',loginController)





module.exports=router;