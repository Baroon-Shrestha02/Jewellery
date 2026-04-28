import AsyncErrorHandler from "../Middlewares/AsyncErrorHandler.js";
import Category from "../Models/Category.js";
import Product from "../Models/Product.js";
import { uploadImages } from "../Utils/ImageUploader.js";

export const createProduct = AsyncErrorHandler(async (req, res) => {
  const { name, karat, weight, category, subCategory } = req.body;

  const updatedCategory = await Category.findOneAndUpdate(
    { name: category },
    {
      $setOnInsert: { name: category },
      $addToSet: { subCategories: subCategory },
    },
    { new: true, upsert: true, runValidators: true },
  );

  const file = req.files?.image;

  const uploadedFile = await uploadImages(file);

  const product = await Product.create({
    name,
    karat,
    weight,
    category,
    subCategory,
    image: uploadedFile,
  });

  res.status(201).json({
    status: "success",
    message: "Product created successfully",
    data: {
      product,
      category: updatedCategory,
    },
  });
});

export const getProducts = AsyncErrorHandler(async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: products.length,
    data: {
      products,
    },
  });
});

export const getCategories = AsyncErrorHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });

  res.status(200).json({
    status: "success",
    data: {
      categories,
    },
  });
});

export const getSubCategories = AsyncErrorHandler(async (req, res) => {
  const { category } = req.params;

  const categoryDoc = await Category.findOne({ name: category });

  if (!categoryDoc) {
    return res.status(404).json({
      status: "fail",
      message: "Category not found",
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      subCategories: categoryDoc.subCategories,
    },
  });
});
