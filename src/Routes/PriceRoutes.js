import express from "express";
import { getPrice, updatePrice } from "../Controllers/PriceController.js";
import { protect } from "../Middlewares/VerifyUser.js";
import { restrictTo } from "../Middlewares/RestrictAccess.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Price:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         gold:
 *           type: number
 *           example: 290500
 *         silver:
 *           type: number
 *           example: 5080
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     UpdatePriceRequest:
 *       type: object
 *       required:
 *         - gold
 *         - silver
 *       properties:
 *         gold:
 *           type: number
 *           example: 290500
 *         silver:
 *           type: number
 *           example: 5080
 */

/**
 * @swagger
 * /prices:
 *   get:
 *     summary: Get current gold and silver prices
 *     tags: [Prices]
 *     responses:
 *       200:
 *         description: Current prices
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     price:
 *                       $ref: '#/components/schemas/Price'
 */
router.get("/", getPrice);

/**
 * @swagger
 * /prices:
 *   patch:
 *     summary: Update gold and silver prices (admin only)
 *     tags: [Prices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePriceRequest'
 *     responses:
 *       200:
 *         description: Updated
 */
router.patch("/", protect, restrictTo("admin"), updatePrice);

export default router;
