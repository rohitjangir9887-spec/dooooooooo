import cors from "cors";
import express from "express";
import { supabase } from "./config/supabase.js";
import { authRoutes } from "./routes/auth.routes.js";
import { availabilityRoutes } from "./routes/availability.routes.js";
import { barbersRoutes } from "./routes/barbers.routes.js";
import { bookingsRoutes } from "./routes/bookings.routes.js";
import { dashboardRoutes } from "./routes/dashboard.routes.js";
import { keepaliveRoutes } from "./routes/keepalive.routes.js";
import { paymentsRoutes } from "./routes/payments.routes.js";
import { servicesRoutes } from "./routes/services.routes.js";
import { systemRoutes } from "./routes/system.routes.js";

export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, supabase: Boolean(supabase) });
});

app.use("/api", keepaliveRoutes);

app.use("/api/admin", authRoutes);
app.use("/api/admin", dashboardRoutes);
app.use("/api/admin", bookingsRoutes);
app.use("/api/admin", barbersRoutes);
app.use("/api/admin", availabilityRoutes);
app.use("/api/admin", paymentsRoutes);
app.use("/api/admin", servicesRoutes);
app.use("/api/admin", systemRoutes);
