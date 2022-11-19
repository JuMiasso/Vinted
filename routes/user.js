const express = require("express");
const router = express.Router();
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    const searchUser = await User.find({
      account: { username: req.body.username },
    });
    // console.log(searchUser);
    if (!req.body.username) {
      res.status(400).json("Please inform a valid username");
    } else if (searchUser.length > 0) {
      // faire un searchUser !== [] ne suffit pas...
      res.status(400).json("Please inform a new username");
    } else {
      const password = req.body.password;
      const salt = uid2(16);
      const hash = SHA256(password + salt).toString(encBase64); // La méthode toString() renvoie une chaîne de caractères représentant l'élément.
      const token = uid2(16);
      const newUser = new User({
        email: req.body.email,
        account: {
          username: req.body.username,
          avatar: {},
        },
        newsletter: req.body.newsletter,
        token: token,
        hash: hash,
        salt: salt,
      });
      await newUser.save();
      res.status(200).json(newUser);
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const searchUser = await User.find({ email: req.body.email });
    // console.log(searchUser);
    const salt = await searchUser[0].salt;
    // console.log(salt);
    const hash = SHA256(req.body.password + salt).toString(encBase64);
    if (hash === searchUser[0].hash) {
      res.status(200).json("You are connected!");
    } else {
      res.status(400).json("Invalid password");
    }
  } catch (error) {
    res.status(400).json(error.message);
  }
});

module.exports = router;