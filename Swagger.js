// swagger.js — root of project

import swaggerJSDoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";
import { writeFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "jewellery API",
      version: "1.0.0",
      description: "API documentation for jewellery - jewellery inventory",
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your Bearer token",
        },
      },
    },
    security: [],
    tags: [
      { name: "Auth", description: "Authentication and session management" },
      { name: "Products", description: "Product management" },
    ],
  },
  apis: [path.join(__dirname, "./src/Routes/*.js")],
};

const swaggerSpec = swaggerJSDoc(options);

writeFileSync(
  path.join(__dirname, "src/swagger-output.json"),
  JSON.stringify(swaggerSpec, null, 2),
);

console.log("✅ Swagger docs generated successfully.");
