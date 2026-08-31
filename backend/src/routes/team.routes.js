import express from "express";
import {
  getTeamSummary,
  inviteTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from "../controllers/team.controller.js";
import { protect } from "../middleware/protect.js";
import { checkTeamSeatLimit, requireRole } from "../middleware/rbac.middleware.js";

const router = express.Router();

// All team routes require authentication
router.use(protect);

router.get("/", requireRole("owner", "manager"), getTeamSummary);
router.post("/invite", requireRole("owner", "manager"), checkTeamSeatLimit, inviteTeamMember);
router.put("/:id", requireRole("owner", "manager"), updateTeamMember);
router.delete("/:id", requireRole("owner"), deleteTeamMember);

export default router;
