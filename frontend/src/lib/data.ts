// Type definitions for data used across the application
// These match the MongoDB models

export type ClassData = {
  _id: string;
  teacher_id: string;
  teacher_name: string;
  subject_id: string;
  class_name: string;
  description: string;
  students: string[];
  created_at: string;
};

export type Class = ClassData;


export type SubjectData = {
  _id: string;
  name: string;
  description: string;
  grade_levels: string[];
  image_url?: string;
};

export type JoinRequestData = {
  _id: string;
  student_id: string;
  teacher_id: string;
  subject_id: string;
  class_id: string;
  student_name: string;
  student_email: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
};

export type ContentData = {
  _id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  content: string;
  content_type: 'note' | 'assignment' | 'ai-generated' | 'worksheet' | 'game' | 'explainer';
  created_at: string;
};

export type ProgressData = {
  _id: string;
  student_id: string;
  studentId?: string; // Compatibility alias
  class_id: string;
  game_id: string;
  game_name: string;
  gameName?: string; // Compatibility alias
  score: number;
  max_score: number;
  completed_at: string;
  date?: string; // Compatibility alias
};

export const progressReports: any[] = [];


// API helper functions
const API_BASE = '/api';

export async function fetchClasses(): Promise<ClassData[]> {
  const response = await fetch(`${API_BASE}/classes`);
  const data = await response.json();
  return data.classes || [];
}

export async function fetchAvailableClasses(): Promise<ClassData[]> {
  const response = await fetch(`${API_BASE}/classes/available`);
  const data = await response.json();
  return data.classes || [];
}

export async function fetchSubjects(): Promise<SubjectData[]> {
  const response = await fetch(`${API_BASE}/subjects`);
  const data = await response.json();
  return data.subjects || [];
}

export async function fetchJoinRequests(): Promise<JoinRequestData[]> {
  const response = await fetch(`${API_BASE}/join-requests`);
  const data = await response.json();
  return data.requests || [];
}

export async function fetchContent(classId?: string): Promise<ContentData[]> {
  const url = classId 
    ? `${API_BASE}/content?class_id=${classId}` 
    : `${API_BASE}/content`;
  const response = await fetch(url);
  const data = await response.json();
  return data.content || [];
}