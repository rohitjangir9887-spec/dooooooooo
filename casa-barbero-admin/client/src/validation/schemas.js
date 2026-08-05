import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter the owner email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  remember: z.boolean().optional()
});

export const forgotSchema = z.object({ email: z.string().email("Enter a valid email address.") });

export const manualBookingSchema = z.object({
  client: z.string().min(2, "Client name is required."),
  phone: z.string().min(8, "Phone number is required."),
  serviceId: z.string().min(1),
  barberId: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  duration: z.coerce.number().min(15),
  price: z.coerce.number().min(1),
  paymentStatus: z.string().min(1)
});

export const blockSchema = z.object({
  barberId: z.string().min(1),
  date: z.string().min(1),
  range: z.boolean().optional(),
  allDay: z.boolean().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  reason: z.string().min(2, "Reason is required."),
  notes: z.string().optional()
});
