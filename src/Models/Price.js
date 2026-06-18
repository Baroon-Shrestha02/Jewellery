import mongoose from "mongoose";

const priceSchema = new mongoose.Schema(
  {
    gold: {
      type: Number,
      required: true,
      min: 0,
    },
    silver: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true },
);

const Price = mongoose.model("Price", priceSchema);

export default Price;
