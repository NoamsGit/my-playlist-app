const mongoose = require("mongoose");

const songSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    artist: {
      type: String,
      required: true,
    },
    user: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      required: true,
    },
  },
  {timestamps: true}
);

const Song = mongoose.model("Song", songSchema);
module.exports = Song;
