const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email_id: {
      type: String,
      required: true,
    },

    fullname: {
      firstname: {
        type: String,

        required: true,
      },
      lastname: {
        type: String,

        required: true,
      },
    },

    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const UserModel = mongoose.model("user", UserSchema);

module.exports = UserModel;
