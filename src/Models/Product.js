import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    karat: {
      type: Number,
      required: [true, "Karat is required"],
      min: [1, "Karat must be greater than 0"],
    },
    weight: {
      type: Number,
      required: [true, "Weight is required"],
      min: [0.01, "Weight must be greater than 0"],
    },
    category: {
      type: String,
      enum: ["gold", "silver"],
      required: [true, "Category is required"],
    },
    subCategory: {
      type: String,
      required: [true, "Sub category is required"],
      trim: true,
    },
    image: {
      public_id: String,
      url: String,
    },
  },
  { timestamps: true },
);

productSchema.index({ category: 1, subCategory: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;
