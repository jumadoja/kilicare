"use client";

import React from "react";

interface AuthLayoutProps {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
}

export default function AuthLayout({ leftContent, rightContent }: AuthLayoutProps) {
  return (
    <div className="auth-container">
      {/* LEFT SIDE: Slideshow & Branding. 
          Kumbuka: Hii itajificha yenyewe kwenye simu (max-width: 1024px) 
          kama tulivyoelekeza kwenye globals.css 
      */}
      <div className="left-image-section">
        {/* Hii overlay inatoa ile transition laini kuelekea kwenye form */}
        <div className="savannah-gradient-overlay" />
        
        {/* Content ya kushoto (Slideshow) sasa inatumia utility classes */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
           {leftContent}
        </div>
      </div>

      {/* RIGHT SIDE: Form Area.
          Imewekewa padding na scroll-fix kwa ajili ya simu.
      */}
      <div className="right-form-section">
        {/* 'animate-fade-up' inafanya form "ipae" kidogo ikifunguka.
            'glass-card-auth' inashughulikia muonekano wa Savannah Mist.
        */}
        <div className="glass-card-auth animate-fade-up">
          {rightContent}
        </div>
      </div>
    </div>
  );
}