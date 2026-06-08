import { Router } from "express";
import {
  login,
  logout,
  register,
  getMe,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/protect.js";
import {
  loginValidators,
  registerValidators,
  validate,
} from "../validators/auth.validators.js";

const authRouter = Router();

authRouter.post("/register", registerValidators, validate, register);
authRouter.post("/login", loginValidators, validate, login);
authRouter.post("/logout", logout);
authRouter.get("/me", protect, getMe);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/reset-password/:token", resetPassword);

export default authRouter;
