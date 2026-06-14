import Notification from "../models/notificationModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { markAsRead, markAllAsRead } from "../services/notification.service.js";

/**
 * Get all notifications for the authenticated vendor
 * GET /api/notifications
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;

  const filter = { vendor: req.vendor._id };
  if (unreadOnly === "true") {
    filter.isRead = false;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ vendor: req.vendor._id, isRead: false }),
  ]);

  const totalPages = Math.ceil(total / Number(limit));

  return sendSuccess(res, {
    notifications,
    unreadCount,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
      hasNextPage: Number(page) < totalPages,
      hasPrevPage: Number(page) > 1,
    },
  });
});

/**
 * Mark a specific notification as read
 * PATCH /api/notifications/:id/read
 */
export const readNotification = asyncHandler(async (req, res) => {
  const notification = await markAsRead(req.vendor._id, req.params.id);

  if (!notification) {
    return sendError(res, "Notification not found", 404);
  }

  return sendSuccess(res, notification, "Notification marked as read");
});

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
export const readAllNotifications = asyncHandler(async (req, res) => {
  await markAllAsRead(req.vendor._id);

  return sendSuccess(res, null, "All notifications marked as read");
});
