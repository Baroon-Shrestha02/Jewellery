import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["gold", "silver"],
      required: true,
      unique: true,
    },
    subCategories: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true },
);

const Category = mongoose.model("Category", categorySchema);

export default Category;
