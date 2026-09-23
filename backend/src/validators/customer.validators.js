import { body } from "express-validator";

export const updateCustomerValidators = [
  body("notes")
    .optional()
    .isString()
    .isLength({ max: 2000 })
    .withMessage("Notes cannot exceed 2000 characters"),

  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array of strings"),

  body("tags.*")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Each tag cannot exceed 50 characters"),

  body("instagram")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Instagram handle cannot exceed 100 characters"),

  body("email")
    .optional({ values: "falsy" })
    .trim()
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),

  body("measurements")
    .optional()
    .isObject()
    .withMessage("Measurements must be an object of key-value pairs"),
];
