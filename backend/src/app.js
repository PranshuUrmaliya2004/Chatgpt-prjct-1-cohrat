const express = require("express");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth.routes");
const chatRouter = require("./routes/chat.routes");
const cors = require("cors");
const path = require("path");
const app = express();
app.use(
  cors({
    origin: [
      "https://chatgpt-prjct-1-cohrat-1.onrender.com",
      "https://chatgpt-prjct-1-cohrat-2.onrender.com",
      "http://localhost:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);
app.use(express.static(path.join(__dirname, "../public")));
app.get("*name", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});
module.exports = app;
