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
    karat,
    description,
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

export const updateProduct = AsyncErrorHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, karat, weight, category, subCategory } = req.body;

  const product = await Product.findById(id);
  if (!product) {
    return res
      .status(404)
      .json({ status: "fail", message: "Product not found" });
  }

  // Only upload new image if provided, otherwise keep existing
  let image = product.image;
  if (req.files?.image) {
    image = await uploadImages(req.files.image);
  }

  // Helper to check if a field was actually sent with a value
  const hasValue = (value) =>
    value !== undefined && value !== null && value !== "";

  // Only upsert category if category or subCategory is being changed
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

  // Build update object — only include fields that were actually sent
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

  res.status(200).json({
    status: "success",
    message: "Product deleted successfully",
  });
});
