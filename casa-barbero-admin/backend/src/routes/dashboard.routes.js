import { Router } from "express";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { getDashboardSummary } from "../services/dashboardService.js";

export const dashboardRoutes = Router();

dashboardRoutes.get("/dashboard", requireAdmin, async (_req, res) => {
  const summary = await getDashboardSummary();
  res.json(summary);
});
