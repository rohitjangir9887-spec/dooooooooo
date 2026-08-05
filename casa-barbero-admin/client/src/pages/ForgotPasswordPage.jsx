import "../assets/styles/auth.css";
import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthBrand } from "../components/auth/AuthBrand.jsx";
import { AuthField } from "../components/auth/AuthField.jsx";
import { navigate } from "../services/navigation.js";
import { forgotSchema } from "../validation/schemas.js";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(forgotSchema), defaultValues: { email: "" } });

  return (
    <main className="auth-page">
      <AuthBrand />
      <motion.form className="auth-card" onSubmit={handleSubmit(() => setSent(true))} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Reset your password.</h1>
        <p>Send a secure reset link to the owner email.</p>
        {sent ? <div className="notice gold">Reset link queued for delivery. Check the owner inbox in a few minutes.</div> : null}
        <AuthField label="Email" error={errors.email?.message}>
          <input type="email" autoComplete="email" placeholder="miguel@casabarbero.ph" {...register("email")} />
        </AuthField>
        <button className="gold-button full" type="submit" disabled={isSubmitting}>Send reset link</button>
      </motion.form>
      <button className="back-link" type="button" onClick={() => navigate("/admin/login")}>← Back to login</button>
    </main>
  );
}
