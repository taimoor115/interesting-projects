const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema(
  {
    short_code: {
      type: String,
      required: true,
      index: true,
    },
    ip_address: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

module.exports = mongoose.model("Analytics", analyticsSchema);
