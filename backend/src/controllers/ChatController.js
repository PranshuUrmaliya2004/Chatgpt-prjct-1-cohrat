const ChatModel = require("../model/chat.model");
const MsgModel = require("../model/msg.models");

async function CreateChat(req, res) {
  const { title } = req.body;
  const user = req.user;

  const chat = await ChatModel.create({
    user: user._id,
    title,
  });

  res.send({
    message: "Chat Create Successfully",
    chat: {
      id: chat._id,
      title: chat.title,
      lastActivity: chat.lastActivity,
      user: chat.user,
    },
  });
}

async function ListChats(req, res) {
  const chats = await ChatModel.find({ user: req.user._id })
    .sort({ lastActivity: -1 })
    .lean();

  const messages = await MsgModel.find({
    chat: { $in: chats.map((chat) => chat._id) },
    user: req.user._id,
  })
    .sort({ createdAt: 1 })
    .lean();

  const messagesByChat = new Map();
  for (const message of messages) {
    const chatId = message.chat.toString();
    const chatMessages = messagesByChat.get(chatId) || [];
    chatMessages.push({
      id: message._id.toString(),
      role: message.role,
      content: message.content,
      attachments: message.attachments || [],
    });
    messagesByChat.set(chatId, chatMessages);
  }

  res.json({
    chats: chats.map((chat) => ({
      id: chat._id.toString(),
      title: chat.title,
      updatedAt: chat.lastActivity.getTime(),
      messages: messagesByChat.get(chat._id.toString()) || [],
    })),
  });
}

async function DeleteChat(req, res) {
  const chat = await ChatModel.findOneAndDelete({
    _id: req.params.chatId,
    user: req.user._id,
  });

  if (!chat) {
    return res.status(404).json({ message: "Conversation not found." });
  }

  await MsgModel.deleteMany({ chat: chat._id, user: req.user._id });
  res.status(204).end();
}

module.exports = {
  CreateChat,
  ListChats,
  DeleteChat,
};
