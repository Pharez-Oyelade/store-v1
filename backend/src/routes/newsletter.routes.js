import { Router } from "express";
import { body, validationResult } from "express-validator";
import Newsletter from "../models/newsletterModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";

const newsletterRouter = Router();

newsletterRouter.post(
  "/subscribe",
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please enter a valid email address")
      .normalizeEmail(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, errors.array()[0].msg, 400);
    }

    const { email } = req.body;
    await Newsletter.findOneAndUpdate(
      { email: email.toLowerCase() },
      { isActive: true },
      { upsert: true, new: true }
    );

    return sendSuccess(res, null, "Subscribed successfully! Welcome to Vendra.");
  })
);

export default newsletterRouter;
