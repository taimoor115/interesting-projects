import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema(
  {
    short_url: {
      type: String,
      required: true,
      index: true,
    },
    ip_address: String,
    country: String,
    device: String,
    referrer: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export default mongoose.model("Analytics", analyticsSchema);
