"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "react-hot-toast";
import { forgotPassword, resetPassword } from "@/services/auth";
import { useRouter } from "next/navigation";

/* ================================================================
  1. VALIDATION SCHEMA (Logic Imara)
  ================================================================ */
const schema = z.object({
  username: z.string().min(3, "Username is required"),
  method: z.enum(["phone", "email"]),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address").optional(),
  otp: z.string().length(6, "OTP must be 6 digits").optional(),
  new_password: z.string().min(6, "Minimum 6 characters required").optional(),
  confirm_password: z.string().optional(),
}).refine((data) => {
  if (data.method === "email" && !data.email) return false;
  if (data.method === "phone" && !data.phone) return false;
  return true;
}, { message: "Field is required", path: ["email"] })
  .refine((data) => {
  if (data.new_password && data.confirm_password) {
    return data.new_password === data.confirm_password;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

type ForgotPasswordFormData = z.infer<typeof schema>;

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"method" | "otp" | "reset">("method");
  const [success, setSuccess] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, trigger, setValue, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(schema),
    defaultValues: { method: "phone" }
  });

  const selectedMethod = watch("method");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleBack = () => {
    if (step === "otp") { setStep("method"); setValue("otp", ""); }
    else if (step === "reset") { setStep("otp"); }
  };

  const onSubmitMethod: SubmitHandler<ForgotPasswordFormData> = async (data) => {
    const identifier = data.method === "email" ? data.email : data.phone;
    setIsLoading(true); 
    try {
      await forgotPassword({ username: data.username, email_or_phone: identifier as string });
      toast.success(`OTP has been sent to your ${data.method}`);
      setStep("otp");
      setTimer(600); 
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to send OTP.");
    } finally { 
      setIsLoading(false); 
    }
  };

  const onVerifyOTP = async () => {
    const isValid = await trigger("otp");
    if (!isValid) { toast.error("Please enter a valid 6-digit code."); return; }
    setIsLoading(true); 
    setTimeout(() => {
      setStep("reset");
      toast.success("Verified! Set your new password.");
      setIsLoading(false); 
    }, 1500);
  };

  const onSubmitReset: SubmitHandler<ForgotPasswordFormData> = async (data) => {
    setIsLoading(true); 
    try {
      await resetPassword({ otp: data.otp as string, new_password: data.new_password as string });
      toast.success("Password changed successfully!");
      setSuccess(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Invalid session.");
    } finally { 
      setIsLoading(false); 
    }
  };

  return (
    // REKEREBISHO: Position relative na overscroll-behavior kuzuia shida ya auto-scroll
    <main style={{ 
      position: "relative", 
      width: "100%", 
      minHeight: "100dvh", 
      overflowY: "auto", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      overscrollBehaviorY: "contain" 
    }}>
      
      {/* LAYER 0: Background Layer (The 100vh Background) */}
      <div style={{ 
        position: "fixed", 
        top: 0, 
        left: 0, 
        width: "100%", 
        height: "100%", 
        backgroundImage: 'url("/assets/images/welcome3.png")', 
        backgroundSize: "cover", 
        backgroundPosition: "center", 
        zIndex: -1 
      }}>
        {/* Glassmorphism Overlay */}
        <div style={{ 
          position: "absolute", 
          inset: 0, 
          backgroundColor: "rgba(15, 23, 42, 0.4)", 
          backdropFilter: "blur(10px)" 
        }} />
      </div>

      {/* LAYER 1: KILICARE FULL PAGE LOADER */}
      {isLoading && (
        <div className="full-page-loader" style={{ zIndex: 99999 }}>
          <div className="loader-wrapper">
            <div className="spinning-border"></div>
            <img 
              src="/assets/images/kilicare-logo.png" 
              alt="Logo" 
              style={{ width: "95px", borderRadius: "50%", background: "white", padding: "10px", zIndex: 10 }} 
            />
          </div>
          <p style={{ color: "#16a34a", fontWeight: 900, marginTop: "25px", letterSpacing: "3px", fontSize: "14px" }}>
            PROCESSING REQUEST...
          </p>
        </div>
      )}

      {/* LAYER 2: MAIN CONTENT CONTAINER */}
      <div 
        className="forgot-root-content-wrapper" 
        style={{ 
          filter: isLoading ? "blur(12px)" : "none", 
          transition: "filter 0.4s ease",
          width: "100%",
          padding: "20px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        <div className="forgot-glass-card animate-in">
          <div className="forgot-card-header">
            <div className="logo-container">
              <img src="/assets/images/kilicare-logo.png" alt="Logo" />
            </div>
            <h2 className="forgot-title">Reset Access</h2>
            
            <div className="step-indicator">
              <div className={`step-dot ${step === 'method' || step === 'otp' || step === 'reset' ? 'active' : ''}`} />
              <div className={`step-dot ${step === 'otp' || step === 'reset' ? 'active' : ''}`} />
              <div className={`step-dot ${step === 'reset' ? 'active' : ''}`} />
            </div>
          </div>

          {success ? (
            <div className="success-state" style={{ textAlign: 'center' }}>
              <div className="success-icon" style={{ fontSize: '50px', marginBottom: '15px' }}>✅</div>
              <h3 className="success-title" style={{ fontWeight: 800 }}>All Set!</h3>
              <p className="success-message" style={{ color: '#64748b', marginBottom: '20px' }}>Your password is now updated.</p>
              <button onClick={() => router.push("/login")} className="btn-action">Return to Login</button>
            </div>
          ) : (
            <form 
              onSubmit={handleSubmit(step === "method" ? onSubmitMethod : (step === "otp" ? onVerifyOTP : onSubmitReset))} 
              className="forgot-form-element"
            >
              
              {/* STEP 1: METHOD SELECTION */}
              {step === "method" && (
                <div className="step-content">
                  <p className="step-instruction">Receive a secure 6-digit code via:</p>
                  <div className="input-wrapper" style={{ marginBottom: "15px" }}>
                    <input {...register("username")} placeholder="Username" className="modern-input" disabled={isLoading} />
                    {errors.username && <span className="error-msg">{errors.username.message}</span>}
                  </div>
                  
                  <div className="method-grid">
                    <div className={`method-card ${selectedMethod === "phone" ? "active" : ""}`} onClick={() => !isLoading && setValue("method", "phone")}>
                      <span className="method-icon">📱</span>
                      <span className="method-label">SMS</span>
                    </div>
                    <div className={`method-card ${selectedMethod === "email" ? "active" : ""}`} onClick={() => !isLoading && setValue("method", "email")}>
                      <span className="method-icon">📧</span>
                      <span className="method-label">Email</span>
                    </div>
                  </div>

                  <div className="input-wrapper" style={{ margin: "15px 0" }}>
                    <input 
                      {...register(selectedMethod === "email" ? "email" : "phone")} 
                      placeholder={selectedMethod === "email" ? "your@email.com" : "07XXXXXXXX"} 
                      className="modern-input" 
                      disabled={isLoading}
                    />
                    {errors[selectedMethod === "email" ? "email" : "phone"] && <span className="error-msg">Valid {selectedMethod} is required</span>}
                  </div>
                  
                  <button type="submit" disabled={isLoading} className="btn-action">Request OTP</button>
                  <div className="footer-links">
                    <span onClick={() => router.push("/login")} className="return-login-link">
                      Return to Login
                    </span>
                  </div>
                </div>
              )}

              {/* STEP 2: OTP VERIFICATION */}
              {step === "otp" && (
                <div className="step-content">
                  <p className="step-instruction">Verify the code sent to your <b>{selectedMethod}</b></p>
                  <div className="input-wrapper" style={{ marginBottom: "15px" }}>
                    <input {...register("otp")} className="modern-input" style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '20px' }} placeholder="000000" maxLength={6} disabled={isLoading} />
                    {errors.otp && <span className="error-msg">{errors.otp.message}</span>}
                  </div>
                  <button type="submit" disabled={isLoading} className="btn-action">Verify Code</button>
                  <div className="footer-links">
                    <span onClick={handleBack} className="back-step-link">← WRONG METHOD? GO BACK</span>
                    <p className="otp-timer" style={{ marginTop: "10px", fontSize: "12px", color: "#64748b" }}>
                      CODE EXPIRES IN: {Math.floor(timer/60)}:{(timer%60).toString().padStart(2,'0')}
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 3: PASSWORD RESET */}
              {step === "reset" && (
                <div className="step-content">
                  <p className="step-instruction">Create a new strong password</p>
                  <div className="password-fields-container" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div className="input-wrapper">
                      <input type="password" {...register("new_password")} placeholder="New Password" className="modern-input" disabled={isLoading} />
                      {errors.new_password && <span className="error-msg">{errors.new_password.message}</span>}
                    </div>
                    <div className="input-wrapper">
                      <input type="password" {...register("confirm_password")} placeholder="Confirm Password" className="modern-input" disabled={isLoading} />
                      {errors.confirm_password && <span className="error-msg">{errors.confirm_password.message}</span>}
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading} className="btn-action" style={{ marginTop: "15px" }}>Update Password</button>
                  <div className="footer-links">
                    <span onClick={handleBack} className="back-step-link">← CHANGE OTP? GO BACK</span>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </main>
  );
}