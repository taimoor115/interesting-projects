const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
  {
    original_url: {
      type: String,
      required: true,
    },
    short_code: {
      type: String,
      required: true,
      unique: true, 
      index: true,  
    },
    expiresAt: {
      type: Date,
      required: false,
      index: { expires: 0 }, 
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Url", urlSchema);
