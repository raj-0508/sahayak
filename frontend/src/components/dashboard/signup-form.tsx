"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiGet } from "@/lib/api";
import { Input } from "../ui/input";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Subject {
  _id: string;
  name: string;
}

const GRADE_LEVELS = Array.from({ length: 12 }, (_, i) => i + 1);

export function SignupForm() {
  const { signup } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState<'student' | 'teacher' | ''>('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [gradeLevel, setGradeLevel] = useState<string>(''); // For students
  const [teachingGrades, setTeachingGrades] = useState<number[]>([]); // For teachers
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch subjects when user selects teacher role
  useEffect(() => {
    if (userType === 'teacher') {
      fetchSubjects();
    }
  }, [userType]);

  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const data = await apiGet('/api/subjects');
      setSubjects(data.subjects || []);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const toggleTeachingGrade = (grade: number) => {
    setTeachingGrades(prev =>
      prev.includes(grade)
        ? prev.filter(g => g !== grade)
        : [...prev, grade].sort((a, b) => a - b)
    );
  };

  const handleSignup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!name || !email || !password || !userType) {
      toast({
        title: "All fields are required",
        description: "Please fill out all required fields to sign up.",
        variant: "destructive"
      });
      return;
    }

    if (userType === 'student' && !gradeLevel) {
      toast({
        title: "Grade level required",
        description: "Please select which grade you are enrolled in.",
        variant: "destructive"
      });
      return;
    }

    if (userType === 'teacher' && selectedSubjects.length === 0) {
      toast({
        title: "Subject required",
        description: "Please select at least one subject you will teach.",
        variant: "destructive"
      });
      return;
    }

    if (userType === 'teacher' && teachingGrades.length === 0) {
      toast({
        title: "Teaching grades required",
        description: "Please select at least one grade level you can teach.",
        variant: "destructive"
      });
      return;
    }
    
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await signup(
        name, 
        email, 
        password, 
        userType, 
        phone || undefined, 
        selectedSubjects,
        userType === 'student' ? parseInt(gradeLevel) : undefined,
        userType === 'teacher' ? teachingGrades : undefined
      );
    } catch (error) {
      // Error already handled in signup function
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Full Name *</Label>
        <Input 
          id="name" 
          placeholder="e.g. Aarav Gupta" 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email *</Label>
        <Input 
          id="email" 
          type="email" 
          placeholder="e.g. student@klu.ac.in" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input 
          id="phone" 
          type="tel" 
          placeholder="e.g. 9876543210" 
          value={phone} 
          onChange={(e) => setPhone(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password *</Label>
        <Input 
          id="password" 
          type="password" 
          placeholder="At least 6 characters"
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
      </div>
      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="role-select">I am a *</Label>
        <Select 
          onValueChange={(value: string) => {
            setUserType(value as 'student' | 'teacher');
            setSelectedSubjects([]);
            setGradeLevel('');
            setTeachingGrades([]);
          }} 
          value={userType}
          disabled={isLoading}
        >
          <SelectTrigger id="role-select">
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="student">Student</SelectItem>
            <SelectItem value="teacher">Teacher</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grade level selection for students */}
      {userType === 'student' && (
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="grade-select">Which grade are you enrolled in? *</Label>
          <Select 
            onValueChange={setGradeLevel} 
            value={gradeLevel}
            disabled={isLoading}
          >
            <SelectTrigger id="grade-select">
              <SelectValue placeholder="Select your grade" />
            </SelectTrigger>
            <SelectContent position="popper">
              {GRADE_LEVELS.map((grade) => (
                <SelectItem key={grade} value={grade.toString()}>
                  Grade {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Subject selection for teachers */}
      {userType === 'teacher' && (
        <>
          <div className="flex flex-col space-y-1.5">
            <Label>Subjects you will teach *</Label>
            {loadingSubjects ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading subjects...
              </div>
            ) : subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">
                No subjects available. Please contact admin.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-md max-h-40 overflow-y-auto">
                {subjects.map((subject) => (
                  <div key={subject._id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`subject-${subject._id}`}
                      checked={selectedSubjects.includes(subject._id)}
                      onCheckedChange={() => toggleSubject(subject._id)}
                      disabled={isLoading}
                    />
                    <label
                      htmlFor={`subject-${subject._id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {subject.name}
                    </label>
                  </div>
                ))}
              </div>
            )}
            {selectedSubjects.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedSubjects.length} subject(s) selected
              </p>
            )}
          </div>

          <div className="flex flex-col space-y-1.5">
            <Label>Grade levels you can teach *</Label>
            <div className="grid grid-cols-4 gap-2 p-3 border rounded-md">
              {GRADE_LEVELS.map((grade) => (
                <div key={grade} className="flex items-center space-x-2">
                  <Checkbox
                    id={`grade-${grade}`}
                    checked={teachingGrades.includes(grade)}
                    onCheckedChange={() => toggleTeachingGrade(grade)}
                    disabled={isLoading}
                  />
                  <label
                    htmlFor={`grade-${grade}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {grade}
                  </label>
                </div>
              ))}
            </div>
            {teachingGrades.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Teaching grades: {teachingGrades.join(', ')}
              </p>
            )}
          </div>
        </>
      )}

      <Button className="w-full" type="submit" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Sign Up'
        )}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
}
