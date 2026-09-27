const mongoose = require("mongoose");

const ConnectToDB = () => {
  mongoose
    .connect(process.env.MONGODB_URl)
    .then(() => {
      console.log("✅ Connected to Database");
    })
    .catch((error) => {
      console.log("❌ Database Error:", error);
    });
};

module.exports = ConnectToDB;
