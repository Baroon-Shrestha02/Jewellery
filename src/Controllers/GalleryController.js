import AppError from "../Middlewares/AppError.js";
import AsyncErrorHandler from "../Middlewares/AsyncErrorHandler.js";
import Gallery from "../Models/GalleryModel.js";
import { uploadImages } from "../Utils/ImageUploader.js";

export const addImage = AsyncErrorHandler(async (req, res, next) => {
  const alt = req.body?.alt || "image";
  const category = req.body?.category || "all";

  const files = req.files?.image;

  if (!files) {
    return next(new AppError("Please upload at least one image", 400));
  }

  const fileArray = Array.isArray(files) ? files : [files];

  const galleryDocs = await Promise.all(
    fileArray.map(async (file) => {
      const uploaded = await uploadImages(file);
      return Gallery.create({
        alt,
        category,
        image: uploaded,
      });
    }),
  );

  res.status(201).json({
    status: "success",
    message: `${galleryDocs.length} image(s) added successfully`,
    data: {
      images: galleryDocs,
    },
  });
});

export const getImages = AsyncErrorHandler(async (req, res) => {
  const { category } = req.query;

  // If category is provided, filter by it; otherwise return all
  const filter = category ? { category } : {};

  const images = await Gallery.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: images.length,
    data: {
      images,
    },
  });
});

export const getCategories = AsyncErrorHandler(async (req, res) => {
  const categories = await Gallery.distinct("category");

  res.status(200).json({
    status: "success",
    data: {
      categories,
    },
  });
});

export const deleteImage = AsyncErrorHandler(async (req, res, next) => {
  const { id } = req.params;

  const image = await Gallery.findByIdAndDelete(id);

  if (!image) {
    return next(new AppError("Image not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Image deleted successfully",
  });
});
