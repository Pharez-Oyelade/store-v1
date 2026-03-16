import { Router } from "express";
import { register } from "../controllers/auth.controller.js";
import { protect } from "../middleware/protect.js";
import { registerValidators, validate } from "../validators/auth.validators.js";

const authRouter = Router();

authRouter.post("/register", registerValidators, validate, register);

export default authRouter;
