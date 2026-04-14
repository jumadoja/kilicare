"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { login, LoginPayload, getMe } from "@/services/auth";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { toast } from "react-hot-toast";
import { useState, useEffect } from "react";
import AuthLayout from "@/components/AuthLayout";

/* --- VALIDATION SCHEMA --- */
const schema = z.object({
  username: z.string().min(3, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof schema>;

const images = [
  "/assets/images/welcome.png", "/assets/images/welcome2.png",
  "/assets/images/welcome6.png", "/assets/images/welcome3.png",
  "/assets/images/welcome5.png", "/assets/images/welcome8.png",
  "/assets/images/welcome4.png"
];

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setIsLoading(true);
    try {
      const tokens = await login(data as LoginPayload);
      const user = await getMe(tokens.access);
      setAuth({ user, accessToken: tokens.access, refreshToken: tokens.refresh });

      toast.success(`Karibu tena, ${user.username}!`);
      
      // Dynamic routing kulingana na role ya user
      const dashboardRoute = { 
        TOURIST: "/dashboard/tourist", 
        LOCAL: "/dashboard/local", 
        ADMIN: "/dashboard/admin" 
      }[user.role as "TOURIST" | "LOCAL" | "ADMIN"] || "/";
      
      router.push(dashboardRoute);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Imeshindikana kuingia. Hakiki username na password.");
    } finally {
      setIsLoading(false);
    }
  };

  /* --- LEFT CONTENT (Slideshow & Testimonial) --- */
  const leftContent = (
    <div className="copy-ui-wrapper">
      <div className="glass-card text-center">
        <div className="book-container">
          {images.map((img, index) => (
            <div 
              key={index} 
              className={`page ${index === currentImage ? "active" : "inactive"}`}
              style={{ backgroundImage: `url(${img})` }} 
            />
          ))}
        </div>
        <div style={{ marginTop: "30px" }}>
          <p style={{ fontStyle: "italic", color: "#475569", fontSize: "16px", lineHeight: "1.7", fontWeight: 500 }}>
            "I felt like I was traveling with a friend guiding me every step!"
          </p>
          <div style={{ marginTop: "15px" }}>
             <h4 style={{ color: "#16a34a", fontWeight: 800, fontSize: "18px", margin: 0 }}>Lastmateru</h4>
             <p style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>@lastmateru</p>
             <div className="smart-badge" style={{ marginTop: "8px", textTransform: "uppercase" }}>
               Kilicare Explorer
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* --- RIGHT CONTENT (Login Form) --- */
  const rightContent = (
    <div className="auth-right-container mx-auto">
      <div style={{ marginBottom: "35px" }}>
        <h1 className="responsive-h1">
          Sign in to Kilicare<span style={{ color: "#16a34a" }}>+</span>
        </h1>
        <p style={{ fontSize: "15px", color: "#64748b", fontWeight: 500 }}>
          New here?{" "}
          <span className="hover-link" onClick={() => router.push("/register")}>
            Create a free account
          </span>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="input-group">
        <div className="field-wrapper">
          <label className="label-text">Username</label>
          <input 
            {...register("username")} 
            placeholder="Enter your username" 
            className="modern-input" 
            disabled={isLoading} 
          />
          {errors.username && <p className="error-text">{errors.username.message}</p>}
        </div>

        <div className="field-wrapper" style={{ position: "relative" }}>
          <label className="label-text">Password</label>
          <input 
            type={showPassword ? "text" : "password"} 
            {...register("password")} 
            placeholder="••••••••" 
            className="modern-input" 
            disabled={isLoading} 
          />
          <span onClick={() => setShowPassword(!showPassword)} className="eye-icon">
            {showPassword ? "🙈" : "👁️"}
          </span>
          {errors.password && <p className="error-text">{errors.password.message}</p>}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-10px" }}>
          <span className="forgot-link" onClick={() => router.push("/forgot-password")}>
            Forgot Password?
          </span>
        </div>

        <button 
          type="submit" 
          disabled={isLoading} 
          className="auth-button"
          style={{ opacity: isLoading ? 0.7 : 1 }}
        >
          {isLoading ? "Authenticating..." : "Sign In"}
        </button>
      </form>
    </div>
  );

  return (
    <div className="login-root-wrapper">
      {/* FULL PAGE LOADER */}
      {isLoading && (
        <div className="full-page-loader">
          <div className="loader-wrapper">
            <div className="spinning-border"></div>
            <img 
              src="/assets/images/kilicare-logo.png" 
              alt="Logo" 
              style={{ width: "95px", borderRadius: "50%", background: "white", padding: "10px" }} 
            />
          </div>
          <p style={{ color: "#16a34a", fontWeight: 900, marginTop: "25px", letterSpacing: "3px", fontSize: "14px" }}>
            VERIFYING CREDENTIALS...
          </p>
        </div>
      )}

      {/* MAIN CONTENT LAYER */}
      <div style={{ 
        filter: isLoading ? "blur(8px)" : "none", 
        transition: "filter 0.4s ease",
        height: "100%" 
      }}>
        <AuthLayout leftContent={leftContent} rightContent={rightContent} />
      </div>
    </div>
  );
}