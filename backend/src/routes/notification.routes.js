import { Router } from "express";
import {
  getNotifications,
  readNotification,
  readAllNotifications,
} from "../controllers/notification.controller.js";
import { protect } from "../middleware/protect.js";

const notificationRouter = Router();

// All notification routes require authentication
notificationRouter.use(protect);

notificationRouter.get("/", getNotifications);
notificationRouter.patch("/read-all", readAllNotifications);
notificationRouter.patch("/:id/read", readNotification);

export default notificationRouter;
