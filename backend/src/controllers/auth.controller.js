const UserModel = require("../model/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

async function registerController(req, res) {
  const {
    email_id,
    fullname: { firstname, lastname },
    password,
  } = req.body;

  const isAlreadyExist = await UserModel.findOne({
    email_id,
  });

  if (isAlreadyExist) {
    return res.status(409).json({
      message: "user already exist",
    });
  }

  // Hash password
  //  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await UserModel.create({
    fullname: {
      firstname,
      lastname,
    },
    email_id,

    password: hashedPassword,
  });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(201).json({
    message: "User Register Successfully",
    user,
  });
}

async function loginController(req, res) {
  const { email_id, password } = req.body;

  const User = await UserModel.findOne({
    email_id,
  });

  if (!User) {
    return res.status(409).json({
      message: "invalid email or password",
    });
  }

  const CheckPasswordVLd = await bcrypt.compare(password, User.password);

  if (!CheckPasswordVLd) {
    return res.status(400).json({
      message: "Invalid Password",
    });
  }

  // Hash password
  //  const salt = await bcrypt.genSalt(10);

  const token = jwt.sign({ id: User._id }, process.env.JWT_SECRET);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(201).json({
    message: "User Login Successfully",
    user: {
      id: User._id,
      email_id: User.email_id,
      fullname: User.fullname,
    },
  });
}

function logoutController(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({ message: "Logged out successfully." });
}

function currentUserController(req, res) {
  res.json({
    user: {
      id: req.user._id,
      email_id: req.user.email_id,
      fullname: req.user.fullname,
    },
  });
}

module.exports = {
  registerController,
  loginController,
  logoutController,
  currentUserController,
};
