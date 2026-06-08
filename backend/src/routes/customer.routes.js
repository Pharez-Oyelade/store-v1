import { Router } from "express";
import {
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customer.controller.js";
import { protect } from "../middleware/protect.js";

const customerRouter = Router();

customerRouter.use(protect);

customerRouter.get("/", getCustomers);
customerRouter.get("/:id", getCustomer);
customerRouter.put("/:id", updateCustomer);
customerRouter.delete("/:id", deleteCustomer);

export default customerRouter;
