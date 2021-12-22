const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

require("dotenv").config();

const app = express();

//import models
require("./models/User.model");
require("./models/RefreshToken.model");

//routes
const userAuthRoutes = require("./routes/userAuthRoutes");

app.use(bodyParser.json());
app.use(userAuthRoutes);

mongoose.connect(process.env.URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("connected", () => {
  console.log("connected");
});

mongoose.connection.on("error", () => {
  console.log("Server Not Found");
});

app.listen(3000);
