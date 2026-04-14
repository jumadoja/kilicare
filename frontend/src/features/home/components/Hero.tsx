"use client";

export const Hero = () => {
  return (
    <div className="p-12 bg-gradient-to-r from-blue-600 to-purple-500 text-white rounded-2xl shadow-xl text-center hover-scale">

      <h1 className="text-4xl md:text-5xl font-extrabold drop-shadow-lg">
        Welcome to Kilicare+
      </h1>

      <p className="mt-4 text-lg md:text-xl opacity-90">
        Discover local tips, explore real moments, and plan smarter travels.
      </p>

      <button
        onClick={() => (window.location.href = "/register")}
        className="mt-6 px-6 py-3 bg-green-500 hover:bg-green-600 rounded-full font-semibold shadow-lg transition"
      >
        Get Started
      </button>

    </div>
  );
};