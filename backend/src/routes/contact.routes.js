import { Router } from "express";
import { body, validationResult } from "express-validator";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { sendEmail } from "../services/email.service.js";

const contactRouter = Router();

contactRouter.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("message").trim().isLength({ min: 5, max: 2000 }).withMessage("Message must be between 5 and 2000 characters"),
    body("subject").optional().trim(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return sendError(res, errors.array()[0].msg, 400);
    }

    const { name, email, message, subject = "General Inquiry" } = req.body;

    console.log(`\n📬 [CONTACT FORM SUBMISSION] From: ${name} (${email})\nSubject: ${subject}\nMessage: ${message}\n`);

    // Optionally forward email to support team
    await sendEmail({
      to: process.env.SUPPORT_EMAIL || "support@vendra.ng",
      subject: `[Vendra Contact] ${subject} - from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    return sendSuccess(res, null, "Thank you for reaching out! Our team will get back to you soon.");
  })
);

export default contactRouter;
