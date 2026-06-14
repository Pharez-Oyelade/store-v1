import Notification from "../models/notificationModel.js";

/**
 * Creates a new notification for a vendor
 * @param {string} vendorId - The vendor's ID
 * @param {Object} data - title, message, type, actionUrl
 * @returns {Promise<Object>} The created notification
 */
export const createNotification = async (vendorId, data) => {
  const { title, message, type = "system", actionUrl = "" } = data;

  const notification = await Notification.create({
    vendor: vendorId,
    title,
    message,
    type,
    actionUrl,
  });

  return notification;
};

/**
 * Marks a notification as read
 */
export const markAsRead = async (vendorId, notificationId) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, vendor: vendorId },
    { isRead: true },
    { new: true }
  );
};

/**
 * Marks all notifications as read for a vendor
 */
export const markAllAsRead = async (vendorId) => {
  return await Notification.updateMany(
    { vendor: vendorId, isRead: false },
    { isRead: true }
  );
};
