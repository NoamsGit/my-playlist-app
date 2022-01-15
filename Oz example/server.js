const express = require("express");
var cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const key = require("./secret").MONGO_KEY;
const {songSchema} = require("./models/Song");
const app = express();
const port = 5000;
let DBConnection = {};

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

async function initConnection() {
  try {
    DBConnection = await mongoose.connect(`mongodb+srv://noam:${key}@cluster0.yb05h.mongodb.net/myPlaylistApp?retryWrites=true&w=majority`);
    console.log("Connected to the database!");
  } catch (e) {
    console.log("Cannot connect to the database!", e);
    process.exit();
  }
}

initConnection();

app.post("/songs", async (req, res) => {
  const Song = DBConnection.model("Song", songSchema);
  try {
    const {name, artist, user, link} = req.body;
    const song = new Song({name, artist, user, link});
    const savedSong = await song.save();
    console.log("New song saved successfully");
    res.json(savedSong);
  } catch (e) {
    console.log(e);
    res.status(500).json({message: "internal server error"});
  }
});

app.get("/songs", async (req, res) => {
  const Song = DBConnection.model("Song", songSchema);
  try {
    const allSongs = await Song.find();
    res.json(allSongs);
  } catch (e) {
    console.log(e);
    res.status(500).json({message: "internal server error"});
  }
});

app.all("*", (req, res) => {
  console.log("Resource not found!");
  res.status(404);
  res.send("Resource not found!");
});

app.listen(port, () => {
  console.log(`server listening at http://localhost:${port}`);
});
