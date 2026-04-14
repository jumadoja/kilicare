"use client";

import { useState, useEffect } from "react";
import ForgotPasswordForm from "@/components/forms/ForgotPasswordForm";

const images = [
  "/assets/images/welcome.png", 
  "/assets/images/welcome2.png", 
  "/assets/images/welcome6.png",
  "/assets/images/welcome3.png", 
  "/assets/images/welcome5.png", 
  "/assets/images/welcome8.png", 
  "/assets/images/welcome4.png"
];

export default function ForgotPasswordPage() {
  const [currentImage, setCurrentImage] = useState(0);

  // Logic ya kubadilisha picha kila baada ya sekunde 5
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main style={fullPageWrapper}>
      {/* BACKGROUND SLIDESHOW LAYER */}
      {images.map((img, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundImage: `url(${img})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: index === currentImage ? 1 : 0,
            transition: "opacity 1.5s ease-in-out", // Inabadilika kwa ulaini
            zIndex: 1,
          }}
        />
      ))}

      {/* OVERLAY YA GIZA KIDOGO */}
      <div style={overlayStyle} />
      
      {/* FOMU KATIKATI */}
      <div style={contentStyle}>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}

// --- STYLES ---
const fullPageWrapper: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 999,
};

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(15, 23, 42, 0.4)", // Inasaidia fomu isomeke vizuri
  zIndex: 2,
};

const contentStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 10, // Inakaa juu ya picha na overlay
  width: "100%",
  display: "flex",
  justifyContent: "center",
  padding: "20px",
};