// ProductController.js

import AsyncErrorHandler from "../Middlewares/AsyncErrorHandler.js";
import Category from "../Models/Category.js";
import Product from "../Models/Product.js";
import { uploadImages } from "../Utils/ImageUploader.js";

export const createProduct = AsyncErrorHandler(async (req, res) => {
  const { name, description, karat, weight, category, subCategory } = req.body;

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
    description,
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
    },
  });
});

export const getProducts = AsyncErrorHandler(async (req, res) => {
  const { category, subCategory } = req.query;

  const filter = {};
  if (category) filter.category = category.toLowerCase();
  if (subCategory) filter.subCategory = subCategory.toLowerCase();

  const products = await Product.find(filter).sort({ createdAt: -1 });

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

  const categoryDoc = await Category.findOne({ name: category.toLowerCase() });

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

export const updateProduct = AsyncErrorHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, karat, weight, category, subCategory } = req.body;

  const product = await Product.findById(id);
  if (!product) {
    return res
      .status(404)
      .json({ status: "fail", message: "Product not found" });
  }

  let image = product.image;
  if (req.files?.image) {
    image = await uploadImages(req.files.image);
  }

  const hasValue = (value) =>
    value !== undefined && value !== null && value !== "";

  // Track old values before updating
  const oldCategory = product.category;
  const oldSubCategory = product.subCategory;

  if (hasValue(category) || hasValue(subCategory)) {
    await Category.findOneAndUpdate(
      { name: hasValue(category) ? category : product.category },
      {
        $setOnInsert: {
          name: hasValue(category) ? category : product.category,
        },
        $addToSet: {
          subCategories: hasValue(subCategory)
            ? subCategory
            : product.subCategory,
        },
      },
      { upsert: true, new: true, runValidators: true },
    );
  }

  const updates = {};
  if (hasValue(name)) updates.name = name;
  if (hasValue(description)) updates.description = description;
  if (hasValue(karat)) updates.karat = karat;
  if (hasValue(weight)) updates.weight = weight;
  if (hasValue(category)) updates.category = category;
  if (hasValue(subCategory)) updates.subCategory = subCategory;
  updates.image = image;

  const updated = await Product.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  // If subcategory or category changed, check if old subcategory is now empty
  const subChanged = hasValue(subCategory) && subCategory !== oldSubCategory;
  const catChanged = hasValue(category) && category !== oldCategory;

  if (subChanged || catChanged) {
    const remaining = await Product.countDocuments({
      category: oldCategory,
      subCategory: oldSubCategory,
    });

    if (remaining === 0) {
      await Category.findOneAndUpdate(
        { name: oldCategory },
        { $pull: { subCategories: oldSubCategory } },
      );
    }
  }

  res.status(200).json({
    status: "success",
    message: "Product updated successfully",
    data: { product: updated },
  });
});

export const deleteProduct = AsyncErrorHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findByIdAndDelete(id);

  if (!product) {
    return res.status(404).json({
      status: "fail",
      message: "Product not found",
    });
  }

  // Check if any other products still use this subcategory
  const remaining = await Product.countDocuments({
    category: product.category,
    subCategory: product.subCategory,
  });

  // If none remain, remove the subcategory from the category
  if (remaining === 0) {
    await Category.findOneAndUpdate(
      { name: product.category },
      { $pull: { subCategories: product.subCategory } },
    );
  }

  res.status(200).json({
    status: "success",
    message: "Product deleted successfully",
  });
});
