import mongoose from "mongoose";

const GallerySchema = new mongoose.Schema(
  {
    image: {
      publicId: String,
      url: String,
    },
    category: {
      type: String,
    },
    alt: {
      type: String,
      default: "image",
    },
  },
  { timestamps: true },
);

const Gallery = mongoose.model("Gallery", GallerySchema);

export default Gallery;
