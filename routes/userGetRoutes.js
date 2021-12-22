const express = require("express");
const mongoose = require("mongoose");

require("dotenv").config();

const router = express.Router();
const User = mongoose.model("User");

const authenticateToken = require("../middleware/authenticateToken.middleware");

router.get("/", authenticateToken, (req, res) => {
  if (req.user.id !== undefined) {
    const id = req.user.id;
    // console.log(mongoose.Types.ObjectId(id));

    User.findOne({
      _id: mongoose.Types.ObjectId(id),
    }).exec((err, data) => {
      if (err) {
        return res
          .status(400)
          .json({ status: false, message: "No Data Found." });
      }

      const cloneOfData = Object.assign({}, data)._doc;
      delete cloneOfData.password;

      return res.json({ status: true, userInfo: cloneOfData });
    });
  } else {
    return res.status(400).json({ status: false, message: "No Token." });
  }
});

module.exports = router;
