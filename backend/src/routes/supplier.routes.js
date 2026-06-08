import { Router } from "express";
import {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getSupplierSummary,
} from "../controllers/supplier.controller.js";
import { protect } from "../middleware/protect.js";

const supplierRouter = Router();

supplierRouter.use(protect);

supplierRouter.get("/summary", getSupplierSummary);
supplierRouter.get("/", getSuppliers);
supplierRouter.post("/", createSupplier);
supplierRouter.get("/:id", getSupplier);
supplierRouter.put("/:id", updateSupplier);
supplierRouter.delete("/:id", deleteSupplier);

export default supplierRouter;
