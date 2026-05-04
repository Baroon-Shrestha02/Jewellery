import express from "express";
import {
  addImage,
  deleteImage,
  getCategories,
  getImages,
} from "../Controllers/GalleryController.js";
import { protect } from "../Middlewares/VerifyUser.js";
import { restrictTo } from "../Middlewares/RestrictAccess.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     GalleryImage:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64f1b2c3d4e5f6a7b8c9d0e1"
 *         image:
 *           type: object
 *           properties:
 *             publicId:
 *               type: string
 *               example: "gallery/abc123xyz"
 *             url:
 *               type: string
 *               example: "https://res.cloudinary.com/demo/image/upload/abc123xyz.jpg"
 *         alt:
 *           type: string
 *           example: "image"
 *         category:
 *           type: string
 *           example: "all"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 */

/**
 * @swagger
 * /gallery:
 *   post:
 *     summary: Upload gallery images
 *     description: >
 *       Uploads one or more images to the gallery. Each image is stored as a
 *       separate document. Alt and category are optional — defaults to "image"
 *       and "all" respectively. **Requires admin role.**
 *     tags:
 *       - Gallery
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: One or more image files to upload
 *               alt:
 *                 type: string
 *                 description: Alt text for the images (default "image")
 *                 example: "Gold necklace showcase"
 *               category:
 *                 type: string
 *                 description: Category for the images (default "all")
 *                 example: "necklaces"
 *     responses:
 *       201:
 *         description: Images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "3 image(s) added successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     images:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/GalleryImage'
 *       400:
 *         description: No image provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "error"
 *               message: "Please upload at least one image"
 *       401:
 *         description: Unauthorized — missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden — admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "error"
 *               message: "You do not have permission to perform this action."
 */
router.post("/", protect, restrictTo("admin"), addImage);

/**
 * @swagger
 * /gallery:
 *   get:
 *     summary: Get all gallery images
 *     description: Returns all gallery images sorted by newest first. Optionally filter by category.
 *     tags:
 *       - Gallery
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter images by category
 *         example: "necklaces"
 *     responses:
 *       200:
 *         description: Images fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 results:
 *                   type: integer
 *                   example: 10
 *                 data:
 *                   type: object
 *                   properties:
 *                     images:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/GalleryImage'
 */
router.get("/", getImages);

/**
 * @swagger
 * /gallery/category:
 *   get:
 *     summary: Get distinct gallery categories
 *     description: Returns a list of unique category names from all gallery images.
 *     tags:
 *       - Gallery
 *     responses:
 *       200:
 *         description: Categories fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["all", "necklaces", "rings"]
 */
router.get("/category", getCategories);

/**
 * @swagger
 * /gallery/{id}:
 *   delete:
 *     summary: Delete a gallery image
 *     description: Permanently deletes a gallery image by ID. **Requires admin role.**
 *     tags:
 *       - Gallery
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the gallery image
 *         example: "64f1b2c3d4e5f6a7b8c9d0e1"
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Image deleted successfully"
 *       401:
 *         description: Unauthorized — missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden — admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "error"
 *               message: "You do not have permission to perform this action."
 *       404:
 *         description: Image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "error"
 *               message: "Image not found"
 */
router.delete("/:id", protect, restrictTo("admin"), deleteImage);

export default router;
