import "../assets/styles/auth.css";
import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Eye, EyeOff } from "lucide-react";
import { AuthBrand } from "../components/auth/AuthBrand.jsx";
import { AuthField } from "../components/auth/AuthField.jsx";
import { api } from "../services/api.js";
import { navigate } from "../services/navigation.js";
import { loginSchema } from "../validation/schemas.js";

export default function LoginPage({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "", remember: false } });

  async function submit(values) {
    setServerError("");
    try {
      const session = await api("/api/admin/auth/login", { method: "POST", body: JSON.stringify(values) });
      onLogin(session, values.remember);
    } catch (error) {
      setServerError(error.message);
    }
  }

  return (
    <main className="auth-page">
      <AuthBrand />
      <motion.form className="auth-card" onSubmit={handleSubmit(submit)} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Welcome back.</h1>
        <p>Sign in to manage your shop.</p>
        <AuthField label="Email" error={errors.email?.message}>
          <input type="email" autoComplete="email" {...register("email")} />
        </AuthField>
        <AuthField label="Password" error={errors.password?.message || serverError} danger={Boolean(serverError)}>
          <div className="password-input">
            <input type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" {...register("password")} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{showPassword ? "Hide" : "Show"}</span>
            </button>
          </div>
        </AuthField>
        <label className="remember">
          <input type="checkbox" {...register("remember")} />
          <span className={watch("remember") ? "checked" : ""}>{watch("remember") ? <Check size={12} /> : null}</span>
          <em>Save login info</em>
        </label>
        <button className="gold-button full" type="submit" disabled={isSubmitting}>{isSubmitting ? "Logging in..." : "Log in"}</button>
        <button className="text-link" type="button" onClick={() => navigate("/admin/forgot-password")}>Forgot password?</button>
      </motion.form>
      <p className="auth-footnote">For staff access, contact your administrator.</p>
    </main>
  );
}
