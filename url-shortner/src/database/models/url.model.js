import mongoose from "mongoose";

const urlSchema = new mongoose.Schema(
  {
    original_url: {
      type: String,
      required: true,
    },
    short_url: {
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

export default mongoose.model("Url", urlSchema);
