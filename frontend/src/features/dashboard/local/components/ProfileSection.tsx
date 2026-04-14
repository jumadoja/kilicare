"use client";
import { useAuthStore } from "@/store/authStore";

export default function ProfileSection() {
  const user = useAuthStore(s => s.user);

  return (
    <div className="glass text-center">
      <h2 className="text-xl font-bold">{user?.username}</h2>
      <p>{user?.email}</p>
      <span className="btn-soft mt-2 inline-block">{user?.role}</span>
    </div>
  );
}