import { body } from "express-validator";

export const inviteTeamMemberValidators = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Team member name is required")
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Enter a valid email address")
    .normalizeEmail(),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^(\+234|0)[789][01]\d{8}$/)
    .withMessage("Enter a valid Nigerian phone number (e.g. 08012345678)"),

  body("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["manager", "sales", "tailor"])
    .withMessage("Role must be manager, sales, or tailor"),

  body("password")
    .optional({ values: "falsy" })
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .withMessage("Password must contain at least one letter and one number"),
];

export const updateTeamMemberValidators = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty")
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),

  body("phone")
    .optional()
    .trim()
    .matches(/^(\+234|0)[789][01]\d{8}$/)
    .withMessage("Enter a valid Nigerian phone number (e.g. 08012345678)"),

  body("role")
    .optional()
    .trim()
    .isIn(["manager", "sales", "tailor"])
    .withMessage("Role must be manager, sales, or tailor"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];
