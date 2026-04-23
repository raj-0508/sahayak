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
import { PlusCircle, Loader2, Users, BookOpen, GraduationCap, Clock, CheckCircle, XCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { TeacherClassManagement } from "@/components/dashboard/teacher-class-management";
import Link from 'next/link';

interface ClassData {
  _id: string;
  class_name: string;
  name?: string; // alias for class_name
  description?: string;
  grade_level?: number;
  section?: string;
  teacher_name?: string;
  teacher_id?: {
    _id: string;
    name: string;
    email: string;
  };
  subject_id?: {
    _id: string;
    name: string;
    description?: string;
  };
  student_count?: number;
  students?: string[];
}

interface JoinRequest {
  _id: string;
  class_id: {
    _id: string;
    name: string;
    class_name?: string;
    grade_level?: number;
  };
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export default function ClassesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [enrolledClasses, setEnrolledClasses] = useState<ClassData[]>([]);
  const [availableClasses, setAvailableClasses] = useState<ClassData[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [joiningClass, setJoiningClass] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  useEffect(() => {
    if (user?.user_type === 'student') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('sahayak-token');
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const [enrolledRes, availableRes, requestsRes] = await Promise.all([
        fetch('/api/classes', { headers }),
        fetch('/api/classes/available', { headers }),
        fetch('/api/join-requests', { headers })
      ]);

      const enrolledData = await enrolledRes.json();
      const availableData = await availableRes.json();
      const requestsData = await requestsRes.json();

      setEnrolledClasses(enrolledData.classes || []);
      setAvailableClasses(availableData.classes || []);
      setJoinRequests(requestsData.requests || []);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      toast({
        title: "Error",
        description: "Failed to load classes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRequest = async (classData: ClassData) => {
    setJoiningClass(classData._id);
    try {
      const response = await fetch('/api/join-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: classData._id }),
      });

      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Request Sent!",
          description: "Your join request has been sent to the teacher.",
        });
        // Remove from available and add to pending
        setAvailableClasses(prev => prev.filter(c => c._id !== classData._id));
        fetchData(); // Refresh data
        setShowJoinDialog(false);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send join request",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send join request",
        variant: "destructive",
      });
    } finally {
      setJoiningClass(null);
    }
  };

  const pendingRequests = joinRequests.filter(r => r.status === 'pending');

  const filteredAvailable = availableClasses.filter(c => {
    const query = searchQuery.toLowerCase();
    const className = c.class_name || c.name || '';
    const teacherName = c.teacher_id?.name || c.teacher_name || '';
    const subjectName = c.subject_id?.name || '';
    return (
      className.toLowerCase().includes(query) ||
      teacherName.toLowerCase().includes(query) ||
      subjectName.toLowerCase().includes(query) ||
      c.description?.toLowerCase().includes(query)
    );
  });

  if (!user) return null;

  if (user.user_type !== 'student') {
    // For teachers and admin, show teacher class management
    return <TeacherClassManagement />;
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">My Classes</h1>
          <p className="text-muted-foreground">View and join classes.</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline gradient-text">My Classes</h1>
        <p className="text-muted-foreground">View your enrolled classes and discover new ones to join.</p>
      </div>

      <Tabs defaultValue="enrolled" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="enrolled" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Enrolled ({enrolledClasses.length})
          </TabsTrigger>
          <TabsTrigger value="available" className="gap-2">
            <Search className="h-4 w-4" />
            Browse Classes
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* Enrolled Classes */}
        <TabsContent value="enrolled" className="mt-6">
          {enrolledClasses.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">No enrolled classes yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Browse available classes and send join requests to teachers.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {enrolledClasses.map(classData => (
                <Card key={classData._id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{classData.class_name || classData.name}</CardTitle>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Enrolled
                      </Badge>
                    </div>
                    <CardDescription>
                      {classData.teacher_id?.name || classData.teacher_name || 'Unknown Teacher'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="flex gap-2 flex-wrap mb-3">
                      {classData.subject_id?.name && (
                        <Badge variant="outline">
                          <BookOpen className="h-3 w-3 mr-1" />
                          {classData.subject_id.name}
                        </Badge>
                      )}
                      {classData.grade_level && (
                        <Badge variant="outline">Grade {classData.grade_level}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{classData.description || 'No description'}</p>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/dashboard/classes/${classData._id}`} className="w-full">
                      <Button className="w-full" variant="outline">View Content</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Available Classes */}
        <TabsContent value="available" className="mt-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by class name, teacher, or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {filteredAvailable.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">
                {searchQuery ? 'No classes match your search' : 'No available classes'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try a different search term.' : 'All classes have been joined or requested.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredAvailable.map(classData => (
                <Card key={classData._id} className="flex flex-col hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{classData.class_name || classData.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {classData.teacher_id?.name || classData.teacher_name || 'Unknown Teacher'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="flex gap-2 flex-wrap mb-3">
                      {classData.subject_id?.name && (
                        <Badge variant="outline">
                          <BookOpen className="h-3 w-3 mr-1" />
                          {classData.subject_id.name}
                        </Badge>
                      )}
                      {classData.grade_level && (
                        <Badge variant="outline">Grade {classData.grade_level}</Badge>
                      )}
                      {classData.student_count !== undefined && (
                        <Badge variant="secondary">
                          <Users className="h-3 w-3 mr-1" />
                          {classData.student_count} students
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{classData.description || classData.subject_id?.description || 'No description'}</p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full gap-2" 
                      onClick={() => {
                        setSelectedClass(classData);
                        setShowJoinDialog(true);
                      }}
                    >
                      <PlusCircle className="h-4 w-4" />
                      Request to Join
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Pending Requests */}
        <TabsContent value="pending" className="mt-6">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">No pending requests</h3>
              <p className="text-sm text-muted-foreground">Your join requests will appear here while waiting for teacher approval.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingRequests.map(request => (
                <Card key={request._id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium">{request.class_id?.class_name || request.class_id?.name || 'Unknown Class'}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground">
                            Requested on {new Date(request.created_at).toLocaleDateString()}
                          </p>
                          {request.class_id?.grade_level && (
                            <Badge variant="outline" className="text-xs">
                              Grade {request.class_id.grade_level}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800">
                      Pending Approval
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Join Confirmation Dialog */}
      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request to Join Class</DialogTitle>
            <DialogDescription>
              Send a join request to the teacher. They will review and approve or reject your request.
            </DialogDescription>
          </DialogHeader>
          {selectedClass && (
            <div className="py-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Class</label>
                  <p className="font-medium">{selectedClass.class_name || selectedClass.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Teacher</label>
                  <p>{selectedClass.teacher_id?.name || selectedClass.teacher_name || 'Unknown Teacher'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subject</label>
                  <p>{selectedClass.subject_id?.name || 'Not specified'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJoinDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedClass && handleJoinRequest(selectedClass)}
              disabled={joiningClass !== null}
            >
              {joiningClass ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <PlusCircle className="h-4 w-4 mr-2" />
              )}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
