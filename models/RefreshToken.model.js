const mongoose = require("mongoose");
const refreshTokenSchema = new mongoose.Schema({
  refreshToken: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
});

mongoose.model("RefreshToken", refreshTokenSchema);
