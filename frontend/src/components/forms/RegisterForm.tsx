"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { register as registerUser, RegisterPayload } from "@/services/auth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import AuthLayout from "@/components/AuthLayout";

/* --- VALIDATION SCHEMA --- */
const schema = z.object({
  username: z.string().min(3, "Username is required").max(150, "Username too long"),
  email: z.string().email("Invalid email"),
  // Tumeweka 8 ili iende sawa na Django default settings
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string().min(8, "Confirm password required"),
  role: z.enum(["TOURIST", "LOCAL"], { errorMap: () => ({ message: "Select a role" }) }),
}).refine(data => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type RegisterFormData = z.infer<typeof schema>;

const images = [
  "/assets/images/welcome.png", "/assets/images/welcome2.png", "/assets/images/welcome6.png",
  "/assets/images/welcome3.png", "/assets/images/welcome5.png", "/assets/images/welcome8.png", "/assets/images/welcome4.png"
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [backendErrors, setBackendErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});

  /* --- SLIDESHOW LOGIC --- */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  /* --- LOCK SCROLL ON LOADING --- */
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isLoading]);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    setBackendErrors({});
    setIsLoading(true);
    try {
      const payload: RegisterPayload = {
        username: data.username.trim(),
        email: data.email.trim(),
        password: data.password,
        confirm_password: data.confirm_password,
        role: data.role,
      };
      await registerUser(payload);
      toast.success("Welcome to KilicareGO!");
      router.push("/login");
    } catch (err: any) {
      setIsLoading(false);
      
      // Hapa tunakamata makosa ya Django (400 Bad Request)
      if (err?.response?.data) {
        const djangoErrors = err.response.data;
        const formattedErrors: any = {};

        // Django hutoa errors kama { field: ["error message"] }
        // Tunazigeuza kuwa { field: "error message" }
        Object.keys(djangoErrors).forEach((key) => {
          const value = djangoErrors[key];
          formattedErrors[key] = Array.isArray(value) ? value[0] : value;
        });

        setBackendErrors(formattedErrors);
        toast.error("Please check the fields for errors.");
      } else {
        toast.error("Registration failed. Try again.");
      }
    }
  };

  const features = [
    { title: "KilicareMoments 🎥", desc: "Watch real photos & short reels of destinations." },
    { title: "Live Messaging 💬", desc: "Instantly chat with locals and travel buddies." },
    { title: "Ask Kilicare AI 🤖", desc: "Get smart travel recommendations." },
    { title: "Today Near Me 📍", desc: "Discover live events & activities nearby." },
    { title: "Local Tips Map 🗺️", desc: "Explore hidden gems & safety tips." },
    { title: "Kilicare Passport™ 🪪", desc: "Earn badges & unlock travel rewards." }
  ];

  /* --- LEFT CONTENT (Cinematic Hero) --- */
  const leftContent = (
    <div className="cinematic-left-wrapper">
      {images.map((img, index) => (
        <div
          key={index}
          className={`breathing-image ${index === currentImage ? "active" : ""}`}
          style={{ backgroundImage: `url(${img})` }}
        />
      ))}
      <div className="overlay-gradient" />
      
      <div className="features-content">
        <span className="smart-badge">SMART TOURISM PLATFORM</span>
        <h1 style={{ fontSize: "42px", fontWeight: 900, color: "#ffffff", lineHeight: 1.1, marginBottom: "25px", letterSpacing: "-1.5px" }}>
          Discover Tanzania <br /><span style={{ color: "#22c55e" }}>Beyond the Path</span>
        </h1>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
          {features.map((item, i) => (
            <div key={i} className="feature-item">
              <span style={{ color: "#22c55e", fontWeight: 800, fontSize: "14px" }}>✓ {item.title}</span>
              <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.7)", marginLeft: "20px" }}>{item.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* --- RIGHT CONTENT (Modern Form) --- */
  const rightContent = (
    <div className="register-form-container">
      <div style={{ marginBottom: "30px" }}>
        <h2 className="responsive-h1" style={{ fontSize: "32px" }}>Start Your Journey 🌍</h2>
        <p style={{ color: "#475569", fontSize: "15px", fontWeight: 500 }}>Join KilicareGO to unlock travel gems.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Username */}
        <div className="field-wrapper">
          <label className="label-text">Explorer Name</label>
          <input {...register("username")} placeholder="e.g. juma_doja" className="modern-input" disabled={isLoading} />
          {(errors.username || backendErrors.username) && (
            <p className="error-text">{errors.username?.message || backendErrors.username}</p>
          )}
        </div>

        {/* Email */}
        <div className="field-wrapper">
          <label className="label-text">Email Address</label>
          <input type="email" {...register("email")} placeholder="your@email.com" className="modern-input" disabled={isLoading} />
          {(errors.email || backendErrors.email) && (
            <p className="error-text">{errors.email?.message || backendErrors.email}</p>
          )}
        </div>

        <div className="role-grid">
          {/* Role */}
          <div className="field-wrapper">
            <label className="label-text">Role</label>
            <select {...register("role")} className="modern-input" style={{ padding: "0 10px", appearance: "none" }} disabled={isLoading}>
              <option value="">Select Role</option>
              <option value="TOURIST">Tourist</option>
              <option value="LOCAL">Local</option>
            </select>
            {(errors.role || backendErrors.role) && (
              <p className="error-text">{errors.role?.message || (backendErrors.role as string)}</p>
            )}
          </div>
          
          {/* Password */}
          <div className="field-wrapper" style={{ position: "relative" }}>
            <label className="label-text">Password</label>
            <input 
              type={showPassword ? "text" : "password"} 
              {...register("password")} 
              placeholder="••••••" 
              className="modern-input" 
              disabled={isLoading} 
            />
            <span onClick={() => setShowPassword(!showPassword)} className="eye-icon" style={{ top: "40px" }}>
              {showPassword ? "🙈" : "👁️"}
            </span>
            {(errors.password || backendErrors.password) && (
              <p className="error-text">{errors.password?.message || backendErrors.password}</p>
            )}
          </div>
        </div>

        {/* Confirm Password */}
        <div className="field-wrapper">
          <label className="label-text">Confirm Password</label>
          <input 
            type="password" 
            {...register("confirm_password")} 
            placeholder="••••••" 
            className="modern-input" 
            disabled={isLoading} 
          />
          {errors.confirm_password && <p className="error-text">{errors.confirm_password.message}</p>}
        </div>

        <button 
          type="submit" 
          disabled={isLoading} 
          className="auth-button" 
          style={{ opacity: isLoading ? 0.7 : 1 }}
        >
          {isLoading ? "Preparing Your Passport..." : "Create Account ✈️"}
        </button>

        <div style={{ textAlign: "center", marginTop: "15px" }}>
          <p style={{ fontSize: "14px", color: "#64748b", fontWeight: 500 }}>
            Already exploring? <span className="hover-link" onClick={() => router.push("/login")}>Sign In</span>
          </p>
        </div>
      </form>
    </div>
  );

  return (
    <div className="register-root-wrapper">
      {/* FULL PAGE LOADER LAYER */}
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
            ENROLLING EXPLORER...
          </p>
        </div>
      )}

      {/* CONTENT LAYER */}
      <div style={{ 
        filter: isLoading ? "blur(10px)" : "none", 
        transition: "filter 0.4s ease", 
        pointerEvents: isLoading ? "none" : "auto", 
        height: "100%" 
      }}>
        <AuthLayout leftContent={leftContent} rightContent={rightContent} />
      </div>
    </div>
  );
}