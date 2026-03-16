import { Router } from "express";
import { login, register } from "../controllers/auth.controller.js";
import { protect } from "../middleware/protect.js";
import {
  loginValidators,
  registerValidators,
  validate,
} from "../validators/auth.validators.js";

const authRouter = Router();

authRouter.post("/register", registerValidators, validate, register);
authRouter.post("/login", loginValidators, validate, login);

export default authRouter;
