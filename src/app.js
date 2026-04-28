import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import GlobalErrorHandler from "./Utils/GlobalErrorHandler.js";
import AppError from "./Middlewares/AppError.js";
import ProductRoutes from "./Routes/ProductRoutes.js";
import AuthRoutes from "./Routes/AuthRoutes.js";
import swaggerUi from "swagger-ui-express";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const swaggerPath = join(__dirname, "swagger-output.json");

if (existsSync(swaggerPath)) {
  const swaggerFile = JSON.parse(readFileSync(swaggerPath, "utf-8"));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));
} else {
  console.warn("⚠️  swagger-output.json not found. Run: npm run swagger");
}

// ─── Middlewares ──────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: "*",
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  }),
);

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Jewellery API is running",
  });
});

app.use("/api/products", ProductRoutes);
app.use("/api/auth", AuthRoutes);

app.all("/{*splat}", (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

app.use(GlobalErrorHandler);

export default app;
