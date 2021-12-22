const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const router = express.Router();
const User = mongoose.model("User");
const RefreshToken = mongoose.model("RefreshToken");

const authenticateToken = require("../middleware/authenticateToken.middleware");
const generateAccessToken = require("../middleware/generateAccessToken.middleware");

//email validation
const validateEmail = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res
      .status(422)
      .json({ status: false, message: "Incorrect Email or password" });

  if (!validateEmail(email))
    return res
      .status(422)
      .json({ status: false, message: "Incorrect Email or password" });

  const user = await User.findOne({ email });
  if (!user)
    return res
      .status(422)
      .json({ status: false, message: "Incorrect Email or password" });
  try {
    await user.comparePassword(password);

    const accessToken = generateAccessToken({ id: user._id });
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "30d",
      }
    );

    RefreshToken.findOne({ email: email }, (err, token) => {
      if (err) {
        return res
          .status(400)
          .json({ status: false, message: "Unexpected Error" });
      }
      if (token) {
        return res.status(201).json({
          accessToken: accessToken,
          refreshToken: token.refreshToken,
          status: true,
        });
      } else {
        new RefreshToken({
          refreshToken: refreshToken,
          email: email,
        }).save();

        res.status(201).json({
          accessToken: accessToken,
          refreshToken: refreshToken,
          status: true,
        });
      }
    });
  } catch (err) {
    return res
      .status(422)
      .json({ status: false, message: "Incorrect Email or password" });
  }
});

router.post("/token", (req, res) => {
  const refreshToken = req.body.token;

  if (refreshToken === null)
    return res.status(401).json({ status: false, message: "Invalid Token." });

  const savedRefreshToken = RefreshToken.findOne({ refreshToken });

  if (!savedRefreshToken)
    return res.status(403).json({ status: false, message: "Invalid Token." });

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err)
      return res
        .status(403)
        .json({ status: false, message: "Unexpected Error." });

    const accessToken = generateAccessToken({ name: user.name });
    res.json({ accessToken: accessToken });
  });
});

router.post("/signup", async (req, res) => {
  //   res.status = 200;

  const { username, email, password, confirmPassword } = req.body;
  if (!username || !email || !password || !confirmPassword)
    return res.status(422).json({ status: false, message: "Missing field." });

  if (username.length <= 3)
    return res.status(422).json({
      status: false,
      message: "Name must be at least 3 characters.",
    });

  if (!validateEmail(email))
    return res.status(422).json({ status: false, message: "Email not valid." });

  if (password === "" || confirmPassword === "")
    return res
      .status(422)
      .json({ status: false, message: "Password field is empty." });

  if (password.length < 8 || confirmPassword.length < 8)
    return res.status(422).json({
      status: false,
      message: "Password must be at least 8 characters.",
    });

  if (password !== confirmPassword)
    return res
      .status(422)
      .json({ status: false, message: "Password didn't match." });

  try {
    const userExists = User.findOne(
      { email: email },
      async (err, userExist) => {
        if (err || userExist)
          return res
            .status(400)
            .json({ status: false, message: "User Already Exists!" });

        const user = new User({
          username,
          email,
          password,
        });

        await user.save();

        const accessToken = generateAccessToken({ id: user._id });

        const refreshToken = jwt.sign(
          { id: user._id },
          process.env.REFRESH_TOKEN_SECRET,
          {
            expiresIn: "30d",
          }
        );
        RefreshToken.findOne({ email: email }, (err, token) => {
          if (err)
            return res
              .status(400)
              .json({ status: false, message: "Unexpected Error" });

          if (token) {
            res.status(201).json({
              accessToken: accessToken,
              refreshToken: token.refreshToken,
              status: true,
            });
          } else {
            new RefreshToken({
              refreshToken: refreshToken,
              email: email,
            }).save();

            return res.status(201).json({
              accessToken: accessToken,
              refreshToken: refreshToken,
              status: true,
            });
          }
        });
      }
    );
  } catch (err) {
    return res
      .status(400)
      .json({ status: false, message: "Unexpected Error." });
  }
});

router.delete("/logout", (req, res) => {
  const refreshToken = req.body.token;
  if (!refreshToken)
    return res.status(401).json({ status: false, message: "No Token." });

  RefreshToken.findOneAndRemove({ refreshToken }, (err, data) => {
    if (err || !data)
      return res.status(400).json({ status: false, message: "No Token." });

    return res.status(200).json({ status: true, message: "Removed." });
  });

  //   refreshTokens = refreshTokens.filter((token) => token !== req.body.token);
  res.status(204);
});

module.exports = router;
