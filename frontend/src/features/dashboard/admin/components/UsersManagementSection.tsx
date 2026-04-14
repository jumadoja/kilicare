"use client";
import { useFetchMe } from "@/features/dashboard/hooks/useFetchMe";
import { useState } from "react";

export default function UsersManagementSection() {
  const { data, refetch } = useFetchMe();
  const [filter, setFilter] = useState("");

  const filteredUsers = data?.filter((u: any) =>
    u.username.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="glass p-4">
      <h2 className="section-title">👥 Users Management</h2>
      <input
        className="input mb-3"
        placeholder="Search users..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {filteredUsers?.map((user: any) => (
          <div
            key={user.id}
            className="flex justify-between p-2 rounded-xl hover:bg-gray-100"
          >
            <span>{user.username}</span>
            <span className="pill">{user.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}