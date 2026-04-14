"use client";
import { useFetchExperiences } from "@/features/dashboard/hooks/useFetchExperiences";

export default function MyExperiencesSection() {
  const { data, refetch } = useFetchExperiences();

  return (
    <div className="space-y-4">
      {data?.map((exp: any) => (
        <div key={exp.id} className="card hover-scale">
          <h3 className="font-bold">{exp.title}</h3>
          <p>{exp.description}</p>
        </div>
      ))}
    </div>
  );
}