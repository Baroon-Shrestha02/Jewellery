import AppError from "./AppError.js";

const validCategories = ["gold", "silver"];

const hasValue = (value) =>
  value !== undefined && value !== null && value !== "";

const isNonEmptyString = (value) => {
  return typeof value === "string" && value.trim().length > 0;
};

const parsePositiveNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
};

const ValidateProduct = (req, res, next) => {
  const isPatch = req.method === "PATCH";
  const { name, karat, weight, category, subCategory } = req.body;
  const normalizedBody = { ...req.body };

  if (!isPatch || hasValue(name)) {
    if (!isNonEmptyString(name)) {
      return next(new AppError("Product name is required", 400));
    }
    normalizedBody.name = name.trim();
  }

  if (!isPatch || hasValue(karat)) {
    const parsedKarat = parsePositiveNumber(karat);
    if (parsedKarat === null || parsedKarat < 1) {
      return next(new AppError("Karat must be at least 1", 400));
    }
    normalizedBody.karat = parsedKarat;
  }

  if (!isPatch || hasValue(weight)) {
    const parsedWeight = parsePositiveNumber(weight);
    if (parsedWeight === null || parsedWeight < 0.01) {
      return next(new AppError("Weight must be greater than 0", 400));
    }
    normalizedBody.weight = parsedWeight;
  }

  if (!isPatch || hasValue(category)) {
    if (!isNonEmptyString(category)) {
      return next(new AppError("Category must be gold or silver", 400));
    }
    const normalizedCategory = category.trim().toLowerCase();
    if (!validCategories.includes(normalizedCategory)) {
      return next(new AppError("Category must be gold or silver", 400));
    }
    normalizedBody.category = normalizedCategory;
  }

  if (!isPatch || hasValue(subCategory)) {
    if (!isNonEmptyString(subCategory)) {
      return next(new AppError("Sub category is required", 400));
    }
    normalizedBody.subCategory = subCategory.trim().toLowerCase();
  }

  req.body = normalizedBody;
  next();
};

export default ValidateProduct;
