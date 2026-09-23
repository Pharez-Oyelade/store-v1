import express from "express";
import {
  getTeamSummary,
  inviteTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from "../controllers/team.controller.js";
import { protect } from "../middleware/protect.js";
import { checkTeamSeatLimit, requireRole } from "../middleware/rbac.middleware.js";
import {
  inviteTeamMemberValidators,
  updateTeamMemberValidators,
} from "../validators/team.validators.js";
import { validate } from "../validators/auth.validators.js";

const router = express.Router();

// All team routes require authentication
router.use(protect);

router.get("/", requireRole("owner", "manager", "tailor"), getTeamSummary);
router.post(
  "/invite",
  requireRole("owner", "manager"),
  checkTeamSeatLimit,
  inviteTeamMemberValidators,
  validate,
  inviteTeamMember
);
router.put(
  "/:id",
  requireRole("owner", "manager"),
  updateTeamMemberValidators,
  validate,
  updateTeamMember
);
router.delete("/:id", requireRole("owner"), deleteTeamMember);

export default router;
