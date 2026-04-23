"use client";

import { SubjectManagement } from "@/components/dashboard/subject-management";

export default function SubjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subject Management</h1>
        <p className="text-muted-foreground">Add, edit, and manage subjects in the system.</p>
      </div>
      <SubjectManagement />
    </div>
  );
}
