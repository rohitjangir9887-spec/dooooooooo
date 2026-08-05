import { Router } from "express";
import { supabase } from "../config/supabase.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const servicesRoutes = Router();

function transformService(s) {
  return { id: s.id, name: s.name, duration: s.duration_min, price: s.price, active: s.is_active };
}

servicesRoutes.post("/services", requireAdmin, async (req, res) => {
  const { name, durationMin, price } = req.body;
  if (!name || !price) return res.status(400).json({ error: "name and price are required" });

  const { data, error } = await supabase
    .from("services")
    .insert({ name, duration_min: Number(durationMin) || 30, price: Number(price), is_active: true })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ service: transformService(data) });
});

servicesRoutes.patch("/services/:id", requireAdmin, async (req, res) => {
  const fieldMap = { name: "name", durationMin: "duration_min", price: "price", active: "is_active" };
  const updates = {};
  for (const [key, col] of Object.entries(fieldMap)) {
    if (key in req.body) updates[col] = req.body[key];
  }
  if (!Object.keys(updates).length) return res.status(400).json({ error: "No valid fields to update" });

  const { data, error } = await supabase
    .from("services")
    .update(updates)
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json({ service: transformService(data) });
});
