"use client";
import { useFetchExperiences } from "@/features/dashboard/hooks/useFetchExperiences";

export default function ActivitiesSection() {
  const { data } = useFetchExperiences();

  return (
    <div className="space-y-4">
      {data?.map((act: any) => (
        <div key={act.id} className="card hover-scale p-4">
          <h3 className="font-bold">{act.title}</h3>
          <p>{act.description}</p>
        </div>
      ))}
    </div>
  );
}