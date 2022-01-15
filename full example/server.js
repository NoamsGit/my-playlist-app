const express = require("express");
var cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const key = require("./secret").MONGO_KEY;
const TOKEN_SECRET = require("./secret").TOKEN_SECRET;
const {userSchema} = require("./models/User");
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

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1]; // remove Bearer
    jwt.verify(token, TOKEN_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

app.post("/register", async (req, res) => {
  try {
    const User = DBConnection.model("User", userSchema);
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      username: req.body.username,
      password: hashedPassword,
    });
    const savedUser = await user.save();
    console.log("New user saved successfully");
    res.json(savedUser);
  } catch (e) {
    console.log(e);
    res.status(500).json({message: "internal server error"});
  }
});

app.post("/login", async (req, res) => {
  const User = DBConnection.model("User", userSchema);
  const user = await User.findOne({username: req.body.username});
  try {
    const match = await bcrypt.compare(req.body.password, user.password);
    const accessToken = jwt.sign(JSON.stringify(user), TOKEN_SECRET);
    if (match) {
      res.json({accessToken: accessToken});
    } else {
      res.status(400).json({message: "Invalid Credentials"});
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({message: "internal server error"});
  }
});

app.get("/users", async (req, res) => {
  const User = DBConnection.model("User", songSchema);
  try {
    const allUsers = await User.find();
    res.json(allUsers);
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

app.delete("/songs/:name", authenticateJWT, async (req, res) => {
  // If the request has come this far, user has been authenticate
  // The name should be unique
  const Song = DBConnection.model("Song", songSchema);
  try {
    const {name} = req.params;
    const song = await Song.findOne({name});
    if (!song) {
      res.status(404).json({message: "Song not found!"});
      return;
    }
    if (req.user.username !== song.user) {
      res.status(403).json({message: "Not authorised to delete this song!"});
      return;
    }
    const deletedSong = await Song.findOneAndDelete({name});
    res.json({message: "song deleted", song: deletedSong});
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
