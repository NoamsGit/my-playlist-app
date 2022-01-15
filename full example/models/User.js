const mongoose = require("mongoose");

const userchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {timestamps: true}
);

const User = mongoose.model("User", userchema);
module.exports = User;
