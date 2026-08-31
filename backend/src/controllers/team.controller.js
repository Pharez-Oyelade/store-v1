import TeamMember, { TEAM_ROLES } from "../models/teamMemberModel.js";
import { PLAN_LIMITS } from "../models/subscriptionModel.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/apiResponse.js";
import { createNotification } from "../services/notification.service.js";

/* ── GET /api/team ──────────────────────────────────────────────── */
export const getTeamSummary = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  const plan = req.vendor.subscriptionPlan || "free";
  const planConfig = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  const maxSeats = planConfig.teamSeats;

  const members = await TeamMember.find({ vendor: vendorId }).sort({ createdAt: -1 });
  const activeStaffCount = members.filter((m) => m.isActive).length;
  const totalUsedSeats = activeStaffCount + 1; // Owner occupies 1 seat
  const availableSeats =
    maxSeats === Infinity ? Infinity : Math.max(0, maxSeats - totalUsedSeats);

  return sendSuccess(res, {
    members,
    stats: {
      plan,
      maxSeats,
      totalUsedSeats,
      activeStaffCount,
      availableSeats,
      canInvite: maxSeats > 1 && (availableSeats > 0 || maxSeats === Infinity),
    },
  });
});

/* ── POST /api/team/invite ──────────────────────────────────────── */
export const inviteTeamMember = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  const { name, email, phone = "", role = "manager", password } = req.body;

  if (!name || !email) {
    return sendError(res, "Name and email are required to invite a team member.", 400);
  }

  if (!TEAM_ROLES.includes(role)) {
    return sendError(res, `Invalid role. Allowed roles are: ${TEAM_ROLES.join(", ")}`, 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if member already exists in this store workspace
  const existing = await TeamMember.findOne({ vendor: vendorId, email: normalizedEmail });
  if (existing) {
    return sendError(
      res,
      `A team member with email '${normalizedEmail}' already exists in your store.`,
      409
    );
  }

  // Use provided password or generate a random 8-character temporary password
  const memberPassword = password || `Vendra_${Math.random().toString(36).slice(-6)}!`;

  const member = await TeamMember.create({
    vendor: vendorId,
    name: name.trim(),
    email: normalizedEmail,
    phone: phone ? phone.trim() : "",
    role,
    password: memberPassword,
    isActive: true,
  });

  await createNotification(vendorId, {
    title: "Team Member Added",
    message: `${member.name} has been added to your store workspace as ${member.role.toUpperCase()}.`,
    type: "system",
    actionUrl: "/dashboard/settings?tab=team",
  });

  return sendSuccess(
    res,
    {
      member,
      temporaryPassword: password ? undefined : memberPassword,
    },
    `Team member '${member.name}' added successfully as ${member.role}.`,
    201
  );
});

/* ── PUT /api/team/:id ──────────────────────────────────────────── */
export const updateTeamMember = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  const { id } = req.params;
  const { name, phone, role, isActive, password } = req.body;

  const member = await TeamMember.findOne({ _id: id, vendor: vendorId });

  if (!member) {
    return sendError(res, "Team member not found in your store workspace.", 404);
  }

  if (name) member.name = name.trim();
  if (phone !== undefined) member.phone = phone.trim();
  if (role && TEAM_ROLES.includes(role)) member.role = role;
  if (typeof isActive === "boolean") member.isActive = isActive;
  if (password) member.password = password;

  await member.save();

  return sendSuccess(res, member, "Team member updated successfully.");
});

/* ── DELETE /api/team/:id ───────────────────────────────────────── */
export const deleteTeamMember = asyncHandler(async (req, res) => {
  const vendorId = req.vendor._id;
  const { id } = req.params;

  const member = await TeamMember.findOneAndDelete({ _id: id, vendor: vendorId });

  if (!member) {
    return sendError(res, "Team member not found.", 404);
  }

  await createNotification(vendorId, {
    title: "Team Member Removed",
    message: `${member.name} (${member.role}) has been removed from your store workspace.`,
    type: "system",
    actionUrl: "/dashboard/settings?tab=team",
  });

  return sendSuccess(res, null, "Team member removed. Seat is now available.");
});
