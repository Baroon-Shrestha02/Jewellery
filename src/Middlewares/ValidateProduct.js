import AppError from "./AppError.js";

const validCategories = ["gold", "silver"];

const isNonEmptyString = (value) => {
  return typeof value === "string" && value.trim().length > 0;
};

const isPositiveNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0;
};

const ValidateProduct = (req, res, next) => {
  const { name, karat, weight, category, subCategory } = req.body;
  const errors = [];

  if (!isNonEmptyString(name)) {
    errors.push("name must be a non-empty string");
  }

  if (!isPositiveNumber(karat)) {
    errors.push("karat must be a positive number");
  }

  if (!isPositiveNumber(weight)) {
    errors.push("weight must be a positive number");
  }

  if (!isNonEmptyString(category)) {
    errors.push("category is required");
  } else if (!validCategories.includes(category.trim().toLowerCase())) {
    errors.push("category must be either gold or silver");
  }

  if (!isNonEmptyString(subCategory)) {
    errors.push("subCategory must be a non-empty string");
  }

  if (errors.length > 0) {
    return next(new AppError(errors.join(", "), 400));
  }

  req.body = {
    name: name.trim(),
    karat: Number(karat),
    weight: Number(weight),
    category: category.trim().toLowerCase(),
    subCategory: subCategory.trim().toLowerCase(),
  };

  next();
};

export default ValidateProduct;
