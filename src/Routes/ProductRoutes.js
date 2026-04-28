import express from "express";
import {
  createProduct,
  getCategories,
  getProducts,
  getSubCategories,
} from "../Controllers/ProductController.js";
import ValidateProduct from "../Middlewares/ValidateProduct.js";
import { restrictTo } from "../Middlewares/RestrictAccess.js";
import { protect } from "../Middlewares/VerifyUser.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductImage:
 *       type: object
 *       properties:
 *         public_id:
 *           type: string
 *           example: "jewellery/abc123xyz"
 *         url:
 *           type: string
 *           example: "https://res.cloudinary.com/demo/image/upload/abc123xyz.jpg"
 *
 *     Product:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64f1b2c3d4e5f6a7b8c9d0e1"
 *         name:
 *           type: string
 *           example: "Gold Necklace"
 *         karat:
 *           type: number
 *           example: 22
 *         weight:
 *           type: number
 *           example: 15.5
 *         category:
 *           type: string
 *           enum: [gold, silver]
 *           example: "gold"
 *         subCategory:
 *           type: string
 *           example: "Necklace"
 *         image:
 *           $ref: '#/components/schemas/ProductImage'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00.000Z"
 *
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64f1b2c3d4e5f6a7b8c9d0e2"
 *         name:
 *           type: string
 *           example: "gold"
 *         subCategories:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Necklace", "Ring", "Bracelet"]
 *
 *     CreateProductRequest:
 *       type: object
 *       required:
 *         - name
 *         - karat
 *         - weight
 *         - category
 *         - subCategory
 *         - image
 *       properties:
 *         name:
 *           type: string
 *           example: "Gold Necklace"
 *         karat:
 *           type: number
 *           minimum: 1
 *           example: 22
 *         weight:
 *           type: number
 *           minimum: 0.01
 *           example: 15.5
 *         category:
 *           type: string
 *           enum: [gold, silver]
 *           example: "gold"
 *         subCategory:
 *           type: string
 *           example: "Necklace"
 *         image:
 *           type: string
 *           format: binary
 *           description: Product image file (jpg, png, etc.)
 */

/**
 * @swagger
 * /products/:
 *   get:
 *     summary: Get all products
 *     description: Returns a list of all jewellery products, sorted by newest first.
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: List of products fetched successfully
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
 *                   example: 5
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 */
router.get("/", getProducts);

/**
 * @swagger
 * /products/add:
 *   post:
 *     summary: Create a new product
 *     description: >
 *       Creates a new jewellery product with an uploaded image. Also upserts
 *       the category and adds the subCategory if it doesn't exist.
 *       **Requires admin role.**
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CreateProductRequest'
 *     responses:
 *       201:
 *         description: Product created successfully
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
 *                   example: "Product created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       $ref: '#/components/schemas/Product'
 *                     category:
 *                       $ref: '#/components/schemas/Category'
 *       400:
 *         description: Validation error — missing or invalid fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "error"
 *               message: "Product name is required"
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
router.post(
  "/add",
  ValidateProduct,
  protect,
  restrictTo("admin"),
  createProduct,
);

/**
 * @swagger
 * /products/categories:
 *   get:
 *     summary: Get all categories
 *     description: Returns all product categories (e.g. gold, silver) with their subCategories, sorted alphabetically.
 *     tags:
 *       - Products
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
 *                         $ref: '#/components/schemas/Category'
 */
router.get("/categories", getCategories);

/**
 * @swagger
 * /products/sub/{category}:
 *   get:
 *     summary: Get subcategories by category
 *     description: Returns the list of subcategories (e.g. Ring, Necklace) for a given category name.
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [gold, silver]
 *         description: The category name to fetch subcategories for
 *         example: "gold"
 *     responses:
 *       200:
 *         description: Subcategories fetched successfully
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
 *                     subCategories:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Necklace", "Ring", "Bracelet"]
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "fail"
 *               message: "Category not found"
 */
router.get("/sub/:category", getSubCategories);

export default router;
