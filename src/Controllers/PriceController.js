import AsyncErrorHandler from "../Middlewares/AsyncErrorHandler.js";
import AppError from "../Middlewares/AppError.js";
import Price from "../Models/Price.js";

export const getPrice = AsyncErrorHandler(async (req, res) => {
  const price = await Price.findOne().sort({ updatedAt: -1 });

  res.status(200).json({
    status: "success",
    data: {
      price: price || { gold: 0, silver: 0, updatedAt: null },
    },
  });
});

export const updatePrice = AsyncErrorHandler(async (req, res, next) => {
  const { gold, silver } = req.body;

  const parsedGold = Number(gold);
  const parsedSilver = Number(silver);

  if (!Number.isFinite(parsedGold) || parsedGold < 0) {
    return next(new AppError("Gold price must be a non-negative number", 400));
  }
  if (!Number.isFinite(parsedSilver) || parsedSilver < 0) {
    return next(new AppError("Silver price must be a non-negative number", 400));
  }

  let price = await Price.findOne();
  if (price) {
    price.gold = parsedGold;
    price.silver = parsedSilver;
    await price.save();
  } else {
    price = await Price.create({ gold: parsedGold, silver: parsedSilver });
  }

  res.status(200).json({
    status: "success",
    message: "Price updated successfully",
    data: { price },
  });
});
