"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Loader2, Users, BookOpen, GraduationCap, Clock, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface ClassData {
  _id: string;
  class_name: string;
  description?: string;
  grade_level?: number;
  teacher_name?: string;
  subject_id?: {
    _id: string;
    name: string;
    description?: string;
  };
  students?: Array<{
    _id: string;
    name: string;
    email: string;
    grade_level?: number;
  }>;
}

interface Subject {
  _id: string;
  name: string;
}

interface JoinRequest {
  _id: string;
  student_id: {
    _id: string;
    name: string;
    email: string;
    grade_level?: number;
  };
  class_id: {
    _id: string;
    class_name: string;
    grade_level?: number;
  };
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

const GRADE_LEVELS = Array.from({ length: 12 }, (_, i) => i + 1);

export function TeacherClassManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [viewingClass, setViewingClass] = useState<ClassData | null>(null);
  
  const [formData, setFormData] = useState({
    class_name: '',
    description: '',
    subject_id: '',
    grade_level: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, subjectsRes, requestsRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/subjects'),
        fetch('/api/join-requests')
      ]);

      const classesData = await classesRes.json();
      const subjectsData = await subjectsRes.json();
      const requestsData = await requestsRes.json();

      setClasses(classesData.classes || []);
      setSubjects(subjectsData.subjects || []);
      setPendingRequests(requestsData.requests?.filter((r: JoinRequest) => r.status === 'pending') || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!formData.class_name || !formData.subject_id || !formData.grade_level) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Success",
          description: "Class created successfully",
        });
        setShowCreateDialog(false);
        setFormData({ class_name: '', description: '', subject_id: '', grade_level: '' });
        fetchData();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create class",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create class",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'accept' | 'reject') => {
    setProcessingRequest(requestId);
    try {
      const response = await fetch(`/api/join-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Success",
          description: `Request ${action}ed successfully`,
        });
        fetchData();
      } else {
        toast({
          title: "Error",
          description: data.error || `Failed to ${action} request`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} request`,
        variant: "destructive",
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  // Filter subjects that teacher can teach
  const teacherSubjects = subjects.filter(s => 
    user?.subject_ids?.includes(s._id)
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-headline gradient-text">Student Manager</h1>
          <p className="text-muted-foreground">Manage your classes and student enrollments.</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold font-headline gradient-text">Student Manager</h1>
          <p className="text-muted-foreground">Manage your classes and student enrollments.</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Class
        </Button>
      </div>

      <Tabs defaultValue="classes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="classes" className="gap-2">
            <BookOpen className="h-4 w-4" />
            My Classes ({classes.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending Requests ({pendingRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* My Classes */}
        <TabsContent value="classes" className="mt-6">
          {classes.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">No classes yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Create your first class to get started.</p>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Create Class
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {classes.map(classData => (
                <Card key={classData._id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{classData.class_name}</CardTitle>
                      <Badge variant="outline">
                        Grade {classData.grade_level}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {classData.subject_id?.name || 'No Subject'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground mb-4">
                      {classData.description || 'No description'}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{classData.students?.length || 0} students enrolled</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setViewingClass(classData)}>View Students</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Pending Requests */}
        <TabsContent value="requests" className="mt-6">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">No pending requests</h3>
              <p className="text-sm text-muted-foreground">Student join requests will appear here.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingRequests.map(request => (
                <Card key={request._id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                        <GraduationCap className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium">{request.student_id?.name || 'Unknown Student'}</p>
                        <p className="text-sm text-muted-foreground">
                          wants to join <span className="font-medium">{request.class_id?.class_name || 'Unknown Class'}</span>
                        </p>
                        <div className="flex gap-2 mt-1">
                          {request.student_id?.grade_level && (
                            <Badge variant="outline" className="text-xs">
                              Student: Grade {request.student_id.grade_level}
                            </Badge>
                          )}
                          {request.class_id?.grade_level && (
                            <Badge variant="outline" className="text-xs">
                              Class: Grade {request.class_id.grade_level}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRequestAction(request._id, 'reject')}
                        disabled={processingRequest === request._id}
                        className="text-destructive hover:text-destructive"
                      >
                        {processingRequest === request._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRequestAction(request._id, 'accept')}
                        disabled={processingRequest === request._id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processingRequest === request._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Class Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Class</DialogTitle>
            <DialogDescription>
              Create a new class for students to join. Only students in the matching grade can see and request to join.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="class_name">Class Name *</Label>
              <Input
                id="class_name"
                placeholder="e.g., Grade 8 - Mathematics"
                value={formData.class_name}
                onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade_level">Grade Level *</Label>
              <Select
                value={formData.grade_level}
                onValueChange={(value) => setFormData({ ...formData, grade_level: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select grade level" />
                </SelectTrigger>
                <SelectContent>
                  {(user?.teaching_grades || GRADE_LEVELS).map((grade) => (
                    <SelectItem key={grade} value={grade.toString()}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Only students in this grade can see and join this class
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject_id">Subject *</Label>
              <Select
                value={formData.subject_id}
                onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {(teacherSubjects.length > 0 ? teacherSubjects : subjects).map((subject) => (
                    <SelectItem key={subject._id} value={subject._id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter class description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateClass} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Class
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Students Dialog */}
      <Dialog open={!!viewingClass} onOpenChange={(open) => !open && setViewingClass(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingClass?.class_name} - Enrolled Students</DialogTitle>
            <DialogDescription>
              {viewingClass?.students?.length || 0} students enrolled in this class.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            {!viewingClass?.students || viewingClass.students.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">No students enrolled</h3>
                <p className="text-sm text-muted-foreground">Students can join using the Browse Classes tab.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {viewingClass.students.map((student) => (
                  <div key={student._id} className="flex items-center justify-between p-3 border rounded-lg bg-card text-card-foreground">
                    <div className="flex gap-3 items-center">
                      <div className="h-10 w-10 shrink-0 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-primary">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{student.name}</span>
                        <span className="text-sm text-muted-foreground">{student.email}</span>
                      </div>
                    </div>
                    {student.grade_level && (
                      <Badge variant="outline">Grade {student.grade_level}</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingClass(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
