import express from "express";
import {
  createProduct,
  deleteProduct,
  getCategories,
  getProducts,
  getSubCategories,
  updateProduct,
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
 *       description: Cloudinary image metadata stored with each product.
 *       properties:
 *         public_id:
 *           type: string
 *           description: Unique identifier assigned by Cloudinary, used for image management and deletion.
 *           example: "jewellery/abc123xyz"
 *         url:
 *           type: string
 *           description: Publicly accessible URL of the uploaded image.
 *           example: "https://res.cloudinary.com/demo/image/upload/abc123xyz.jpg"
 *
 *     Product:
 *       type: object
 *       description: A jewellery product listing with metal details, categorisation, and an image.
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB-generated unique identifier for the product.
 *           example: "64f1b2c3d4e5f6a7b8c9d0e1"
 *         name:
 *           type: string
 *           description: Display name of the product.
 *           example: "Gold Necklace"
 *         description:
 *           type: string
 *           description: Optional detailed description of the product, such as design notes or craftsmanship details.
 *           example: "Handcrafted 22-karat gold necklace with a traditional filigree pattern."
 *         karat:
 *           type: number
 *           description: Purity of the metal expressed in karats (e.g. 18, 22, 24).
 *           example: 22
 *         weight:
 *           type: number
 *           description: Weight of the product in grams.
 *           example: 15.5
 *         category:
 *           type: string
 *           description: Top-level metal category the product belongs to.
 *           enum: [gold, silver]
 *           example: "gold"
 *         subCategory:
 *           type: string
 *           description: Specific jewellery type within the category (e.g. Necklace, Ring, Bracelet).
 *           example: "Necklace"
 *         image:
 *           $ref: '#/components/schemas/ProductImage'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the product was first created.
 *           example: "2024-01-15T10:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of the most recent update to the product.
 *           example: "2024-01-15T10:30:00.000Z"
 *
 *     Category:
 *       type: object
 *       description: A top-level product category (e.g. gold, silver) along with all subcategories that have been assigned to it.
 *       properties:
 *         _id:
 *           type: string
 *           description: MongoDB-generated unique identifier for the category.
 *           example: "64f1b2c3d4e5f6a7b8c9d0e2"
 *         name:
 *           type: string
 *           description: Name of the category, always stored in lowercase.
 *           example: "gold"
 *         subCategories:
 *           type: array
 *           description: List of all jewellery types that have been added under this category. New entries are appended automatically when a product is created or updated with a new subCategory value.
 *           items:
 *             type: string
 *           example: ["Necklace", "Ring", "Bracelet"]
 *
 *     CreateProductRequest:
 *       type: object
 *       description: Payload for creating a new product. All fields are required. The category is upserted and the subCategory is added to it if it does not already exist.
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
 *           description: Display name of the product.
 *           example: "Gold Necklace"
 *         description:
 *           type: string
 *           description: Optional description providing additional detail about the product.
 *           example: "Handcrafted 22-karat gold necklace with a traditional filigree pattern."
 *         karat:
 *           type: number
 *           minimum: 1
 *           description: Purity of the metal in karats. Must be greater than 0.
 *           example: 22
 *         weight:
 *           type: number
 *           minimum: 0.01
 *           description: Weight of the product in grams. Must be greater than 0.
 *           example: 15.5
 *         category:
 *           type: string
 *           enum: [gold, silver]
 *           description: Top-level metal category. Case-insensitive — values are normalised to lowercase before saving.
 *           example: "gold"
 *         subCategory:
 *           type: string
 *           description: Jewellery type within the category. Trimmed and normalised to lowercase before saving. Created in the category document if it does not already exist.
 *           example: "Necklace"
 *         image:
 *           type: string
 *           format: binary
 *           description: Product image file to upload. Accepted formats include JPG and PNG. Stored on Cloudinary.
 *
 *     UpdateProductRequest:
 *       type: object
 *       description: >
 *         Partial update payload for an existing product. All fields are optional —
 *         only fields explicitly included in the request will be validated and updated.
 *         Fields that are omitted or sent as empty strings will retain their current values.
 *         If a new category or subCategory is provided, the category document is upserted accordingly.
 *         The image is only replaced when a new file is uploaded; otherwise the existing image is preserved.
 *       properties:
 *         name:
 *           type: string
 *           description: New display name for the product. Omit to keep the existing value.
 *           example: "Silver Ring"
 *         description:
 *           type: string
 *           description: Updated product description. Omit to keep the existing value.
 *           example: "Sterling silver ring with an engraved floral pattern."
 *         karat:
 *           type: number
 *           minimum: 1
 *           description: Updated metal purity in karats. Must be greater than 0. Omit to keep the existing value.
 *           example: 18
 *         weight:
 *           type: number
 *           minimum: 0.01
 *           description: Updated weight in grams. Must be greater than 0. Omit to keep the existing value.
 *           example: 5.2
 *         category:
 *           type: string
 *           enum: [gold, silver]
 *           description: Updated top-level category. Case-insensitive — normalised to lowercase before saving. Omit to keep the existing value.
 *           example: "silver"
 *         subCategory:
 *           type: string
 *           description: Updated jewellery type. Trimmed and normalised to lowercase. Added to the category document if it does not already exist. Omit to keep the existing value.
 *           example: "ring"
 *         image:
 *           type: string
 *           format: binary
 *           description: Replacement image file. Only processed if a file is actually uploaded. Omit to keep the existing image.
 *
 *     ErrorResponse:
 *       type: object
 *       description: Standard error envelope returned for all 4xx and 5xx responses.
 *       properties:
 *         status:
 *           type: string
 *           description: >
 *             Indicates the error class. "fail" is used for client errors (4xx) where
 *             the request was understood but could not be completed. "error" is used for
 *             unexpected server-side failures (5xx).
 *           enum: [fail, error]
 *           example: "fail"
 *         message:
 *           type: string
 *           description: Human-readable explanation of what went wrong.
 *           example: "Product not found"
 */

/**
 * @swagger
 * /products/:
 *   get:
 *     summary: Get all products
 *     description: Returns a list of all jewellery products in the catalogue, sorted by newest first.
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: List of products fetched successfully.
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
 *                   description: Total number of products returned.
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
 *       Creates a new jewellery product and uploads the provided image to Cloudinary.
 *       The category is upserted automatically — if it does not exist it will be created,
 *       and the subCategory will be appended to it if not already present.
 *       Requires an authenticated admin user.
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
 *         description: Product created successfully. Returns the new product and the upserted category.
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
 *         description: Validation failed — one or more required fields are missing or contain invalid values.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "fail"
 *               message: "Product name is required"
 *       401:
 *         description: Unauthorized — no token was provided or the token is invalid/expired.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden — the authenticated user does not have the admin role.
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
 *     description: Returns all top-level product categories (e.g. gold, silver), each with their full list of subcategories, sorted alphabetically by name.
 *     tags:
 *       - Products
 *     responses:
 *       200:
 *         description: Categories fetched successfully.
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
 *     summary: Get subcategories for a category
 *     description: Returns the list of subcategories (e.g. Ring, Necklace, Bracelet) that have been registered under the given category name. Subcategories are added automatically whenever a product is created or updated with a new subCategory value.
 *     tags:
 *       - Products
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [gold, silver]
 *         description: The lowercase category name to look up.
 *         example: "gold"
 *     responses:
 *       200:
 *         description: Subcategories fetched successfully.
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
 *                       description: All subcategory names registered under this category.
 *                       items:
 *                         type: string
 *                       example: ["Necklace", "Ring", "Bracelet"]
 *       404:
 *         description: No category with the given name was found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "fail"
 *               message: "Category not found"
 */
router.get("/sub/:category", getSubCategories);

/**
 * @swagger
 * /products/update/{id}:
 *   patch:
 *     summary: Partially update a product
 *     description: >
 *       Updates one or more fields of an existing product identified by its ID.
 *       This is a partial update — only fields explicitly included in the request body
 *       will be changed; all other fields retain their current values.
 *       If a new image file is uploaded it replaces the existing one; omitting the image
 *       field leaves the current image untouched.
 *       If category or subCategory is provided, the category document is upserted and the
 *       subCategory is appended if not already present.
 *       Requires an authenticated admin user.
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the product to update.
 *         example: "64f1b2c3d4e5f6a7b8c9d0e1"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProductRequest'
 *     responses:
 *       200:
 *         description: Product updated successfully. Returns the full updated product document.
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
 *                   example: "Product updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     product:
 *                       $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation failed — one or more provided fields contain invalid values.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "fail"
 *               message: "Karat must be greater than 0"
 *       401:
 *         description: Unauthorized — no token was provided or the token is invalid/expired.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden — the authenticated user does not have the admin role.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "error"
 *               message: "You do not have permission to perform this action."
 *       404:
 *         description: No product with the given ID was found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "fail"
 *               message: "Product not found"
 */
router.patch(
  "/update/:id",
  ValidateProduct,
  protect,
  restrictTo("admin"),
  updateProduct,
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     description: >
 *       Permanently removes a product from the catalogue by its ID.
 *       This action is irreversible. The associated Cloudinary image is not
 *       automatically deleted and must be cleaned up separately if needed.
 *       Requires an authenticated admin user.
 *     tags:
 *       - Products
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the product to delete.
 *         example: "64f1b2c3d4e5f6a7b8c9d0e1"
 *     responses:
 *       200:
 *         description: Product deleted successfully.
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
 *                   example: "Product deleted successfully"
 *       401:
 *         description: Unauthorized — no token was provided or the token is invalid/expired.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden — the authenticated user does not have the admin role.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "error"
 *               message: "You do not have permission to perform this action."
 *       404:
 *         description: No product with the given ID was found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "fail"
 *               message: "Product not found"
 */
router.delete("/:id", protect, restrictTo("admin"), deleteProduct);

export default router;
