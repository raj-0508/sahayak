"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart, Pie, PieChart, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend as RechartsLegend } from "recharts";import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Loader2, Trophy, Target, TrendingUp, Users, FileText, AlertTriangle, Download, ClipboardCheck, GraduationCap, CheckCircle, XCircle, Eye, Send, BookOpen, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiGet, apiPost, apiPut } from "@/lib/api";

interface TestSubmission {
  _id: string;
  test_id: {
    _id: string;
    title: string;
    total_marks: number;
    deadline?: string;
    results_published?: boolean;
    questions?: {
      question: string;
      question_type: string;
      correct_answer?: string;
      marks: number;
    }[];
  };
  student_id: {
    _id: string;
    name: string;
    email: string;
  };
  answers: {
    question_index: number;
    answer: string;
    marks_obtained?: number;
    feedback?: string;
  }[];
  status: 'in_progress' | 'submitted' | 'evaluating' | 'evaluated';
  total_marks_obtained: number;
  percentage: number;
  submitted_at: string;
  evaluated_at?: string;
  teacher_remarks?: string;
  results_pending?: boolean;
}

interface TestForEvaluation {
  _id: string;
  title: string;
  total_marks: number;
  deadline: string;
  results_published: boolean;
  questions: {
    question: string;
    question_type: string;
    correct_answer?: string;
    marks: number;
  }[];
  submissions: TestSubmission[];
  pendingEvaluations: number;
}

interface ClassOption {
  _id: string;
  class_name: string;
  students: string[];
}

interface StudentStats {
  _id: string;
  name: string;
  email: string;
  testsAttempted: number;
  averageScore: number;
  lastActive: string;
}

export default function ProgressPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [submissions, setSubmissions] = useState<TestSubmission[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  
  // New state for test analysis
  const [testsForEvaluation, setTestsForEvaluation] = useState<TestForEvaluation[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<TestSubmission | null>(null);
  const [evaluationDialogOpen, setEvaluationDialogOpen] = useState(false);
  const [evaluationMarks, setEvaluationMarks] = useState<{[key: number]: { marks: number; feedback: string }}>({});
  const [teacherRemarks, setTeacherRemarks] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [exportingReport, setExportingReport] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  
  // Student progress state
  const [studentProgress, setStudentProgress] = useState<{ submissions: TestSubmission[]; stats: any } | null>(null);

  const isTeacher = user?.user_type === 'teacher';
  const isStudent = user?.user_type === 'student';

  useEffect(() => {
    if (user) {
      if (isTeacher) {
        fetchClasses();
        fetchSubmissions();
      } else if (isStudent) {
        fetchStudentProgress();
      }
    }
  }, [user]);

  useEffect(() => {
    if (isTeacher && selectedClass !== 'all') {
      fetchSubmissions();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      const data = await apiGet('/api/classes');
      setClasses(data.classes || []);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const url = selectedClass && selectedClass !== 'all'
        ? `/api/test-submissions?class_id=${selectedClass}`
        : '/api/test-submissions';
      const data = await apiGet(url);
      setSubmissions(data.submissions || []);
      
      // Calculate student stats from submissions
      calculateStudentStats(data.submissions || []);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentProgress = async () => {
    try {
      setLoading(true);
      const data = await apiGet('/api/test-submissions/my-progress');
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStudentStats = (subs: TestSubmission[]) => {
    const statsMap = new Map<string, StudentStats>();
    
    subs.forEach(sub => {
      const studentId = sub.student_id._id;
      const existing = statsMap.get(studentId);
      
      if (existing) {
        existing.testsAttempted++;
        existing.averageScore = (existing.averageScore * (existing.testsAttempted - 1) + (sub.percentage || 0)) / existing.testsAttempted;
        if (new Date(sub.submitted_at) > new Date(existing.lastActive)) {
          existing.lastActive = sub.submitted_at;
        }
      } else {
        statsMap.set(studentId, {
          _id: studentId,
          name: sub.student_id.name,
          email: sub.student_id.email,
          testsAttempted: 1,
          averageScore: sub.percentage || 0,
          lastActive: sub.submitted_at,
        });
      }
    });
    
    setStudentStats(Array.from(statsMap.values()));
  };

  const exportReport = () => {
    const reportData = studentStats.map(s => ({
      Name: s.name,
      Email: s.email,
      'Tests Attempted': s.testsAttempted,
      'Average Score (%)': s.averageScore.toFixed(1),
      'Last Active': new Date(s.lastActive).toLocaleDateString(),
    }));
    
    const csv = [
      Object.keys(reportData[0] || {}).join(','),
      ...reportData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    toast({
      title: 'Report Downloaded',
      description: 'Student report has been exported as CSV',
    });
  };

  // Fetch tests with their submissions for evaluation
  const fetchTestsForEvaluation = async () => {
    try {
      const testsData = await apiGet('/api/tests');
      
      const testsWithSubs = await Promise.all(
        (testsData.tests || []).map(async (test: any) => {
          const subsData = await apiGet(`/api/test-submissions?test_id=${test._id}`);
          
          const pendingCount = (subsData.submissions || []).filter(
            (s: TestSubmission) => s.status === 'submitted' || 
            (s.status !== 'evaluated' && test.questions?.some((q: any) => q.question_type === 'long_answer' || q.question_type === 'short_answer'))
          ).length;
          
          return {
            ...test,
            submissions: subsData.submissions || [],
            pendingEvaluations: pendingCount
          };
        })
      );
      
      setTestsForEvaluation(testsWithSubs.filter(t => t.submissions.length > 0));
    } catch (error) {
      console.error('Failed to fetch tests for evaluation:', error);
    }
  };

  // Open evaluation dialog
  const openEvaluationDialog = (submission: TestSubmission) => {
    setSelectedSubmission(submission);
    
    // Initialize marks from existing data
    const initialMarks: {[key: number]: { marks: number; feedback: string }} = {};
    submission.answers?.forEach((ans) => {
      const qIdx = ans.question_index;
      // Get the corresponding question to check if it's auto-graded
      const question = submission.test_id?.questions ? submission.test_id.questions.find((_: any, idx: number) => idx === qIdx) : null;
      let defaultMarks = ans.marks_obtained || 0;
      
      // Re-evaluate auto-graded marks just in case they were lost
      if (question && (question.question_type === 'mcq' || question.question_type === 'true_false')) {
        if (ans.answer?.toLowerCase().trim() === question.correct_answer?.toLowerCase().trim()) {
          defaultMarks = question.marks;
        } else {
          defaultMarks = 0;
        }
      }

      initialMarks[qIdx] = {
        marks: defaultMarks,
        feedback: ans.feedback || ''
      };
    });
    setEvaluationMarks(initialMarks);
    setTeacherRemarks(submission.teacher_remarks || '');
    setEvaluationDialogOpen(true);
  };

  // Submit evaluation
  const handleSubmitEvaluation = async () => {
    if (!selectedSubmission) return;
    
    setEvaluating(true);
    try {
      const answers = Object.entries(evaluationMarks).map(([qIdx, data]) => ({
        question_index: parseInt(qIdx),
        marks_obtained: data.marks,
        feedback: data.feedback
      }));
      
      await apiPut(`/api/test-submissions/${selectedSubmission._id}/evaluate`, { answers, teacher_remarks: teacherRemarks });
      
      toast({
        title: 'Evaluation Saved',
        description: 'The submission has been evaluated successfully.'
      });
      setEvaluationDialogOpen(false);
      fetchSubmissions();
      fetchTestsForEvaluation();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save evaluation',
        variant: 'destructive'
      });
    } finally {
      setEvaluating(false);
    }
  };

  // Publish test results
  const handlePublishResults = async (testId: string) => {
    setPublishing(true);
    try {
      await apiPost(`/api/tests/${testId}/publish-results`, {});
      
      toast({
        title: 'Results Published',
        description: 'Students can now view their results.'
      });
      fetchTestsForEvaluation();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to publish results',
        variant: 'destructive'
      });
    } finally {
      setPublishing(false);
    }
  };

  // Export AI-generated report
  const handleExportAIReport = async () => {
    setExportingReport(true);
    try {
      const data = await apiPost('/api/reports/export', {
        class_id: selectedClass,
        format: 'pdf'
      });
      
      setAiReport(data.report);
      setReportDialogOpen(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate AI report',
        variant: 'destructive'
      });
    } finally {
      setExportingReport(false);
    }
  };

  // Download report as HTML (can be printed as PDF)
  const downloadReport = () => {
    if (!aiReport) return;
    
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Student Performance Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #1a365d; border-bottom: 2px solid #3182ce; padding-bottom: 10px; }
    h2 { color: #2c5282; margin-top: 30px; }
    h3 { color: #4a5568; }
    .summary-box { background: #ebf8ff; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .class-section { border: 1px solid #e2e8f0; padding: 20px; margin: 20px 0; border-radius: 8px; }
    .student-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .student-table th, .student-table td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
    .student-table th { background: #f7fafc; }
    .excellent { color: #22c55e; font-weight: bold; }
    .good { color: #3b82f6; }
    .average { color: #f59e0b; }
    .at-risk { color: #ef4444; font-weight: bold; }
    .insights { background: #f0fdf4; padding: 20px; border-radius: 8px; margin-top: 30px; white-space: pre-wrap; }
    .footer { margin-top: 40px; text-align: center; color: #718096; font-size: 12px; }
  </style>
</head>
<body>
  <h1>📊 Student Performance Report</h1>
  <p>Generated on: ${new Date(aiReport.generatedAt).toLocaleString()}</p>
  <p>Generated by: ${aiReport.generatedBy}</p>
  
  ${aiReport.classes.map((cls: any) => `
    <div class="class-section">
      <h2>${cls.className}</h2>
      <div class="summary-box">
        <p><strong>Total Students:</strong> ${cls.totalStudents}</p>
        <p><strong>Participation Rate:</strong> ${cls.participationRate}%</p>
        <p><strong>Average Score:</strong> ${cls.averageScore}%</p>
        <p><strong>Tests Conducted:</strong> ${cls.totalTests}</p>
      </div>
      
      <h3>Student Performance</h3>
      <table class="student-table">
        <tr>
          <th>Name</th>
          <th>Tests Attempted</th>
          <th>Average Score</th>
          <th>Status</th>
        </tr>
        ${cls.students.map((s: any) => `
          <tr>
            <td>${s.name}</td>
            <td>${s.testsAttempted}</td>
            <td>${s.averageScore}%</td>
            <td class="${s.status === 'Excellent' ? 'excellent' : s.status === 'Good' ? 'good' : s.status === 'Needs Improvement' ? 'average' : 'at-risk'}">${s.status}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  `).join('')}
  
  <div class="insights">
    <h2>🤖 AI Analysis & Recommendations</h2>
    ${aiReport.aiInsights.replace(/\n/g, '<br>')}
  </div>
  
  <div class="footer">
    <p>Generated by Sahayak Education Platform</p>
  </div>
</body>
</html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    
    toast({
      title: 'Report Downloaded',
      description: 'Open the HTML file in a browser and use Print > Save as PDF'
    });
  };

  // Effect to fetch tests when switching to test analysis tab
  useEffect(() => {
    if (activeTab === 'test-analysis' && isTeacher) {
      fetchTestsForEvaluation();
    }
  }, [activeTab, isTeacher]);

  if (!user) return null;

  // Calculate overview stats
  const totalSubmissions = submissions.length;
  const evaluatedSubmissions = submissions.filter(s => s.status === 'evaluated');
  const pendingEvaluations = submissions.filter(s => s.status === 'submitted');
  const averageScore = evaluatedSubmissions.length > 0
    ? evaluatedSubmissions.reduce((sum, s) => sum + (s.percentage || 0), 0) / evaluatedSubmissions.length
    : 0;
  const strugglingStudents = studentStats.filter(s => s.averageScore < 50);
  const topPerformers = studentStats.filter(s => s.averageScore >= 80);

  // Chart data
  const scoreDistribution = [
    { range: 'Excellent (80-100%)', count: evaluatedSubmissions.filter(s => (s.percentage || 0) >= 80).length, fill: '#22c55e' },
    { range: 'Good (60-79%)', count: evaluatedSubmissions.filter(s => { const p = s.percentage || 0; return p >= 60 && p < 80; }).length, fill: '#3b82f6' },
    { range: 'Average (40-59%)', count: evaluatedSubmissions.filter(s => { const p = s.percentage || 0; return p >= 40 && p < 60; }).length, fill: '#f59e0b' },
    { range: 'Needs Help (<40%)', count: evaluatedSubmissions.filter(s => (s.percentage || 0) < 40).length, fill: '#ef4444' },
  ].filter(d => d.count > 0);

  const recentSubmissions = [...submissions]
    .filter(s => s.submitted_at)
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
    .slice(0, 10);

  // Student view
  if (isStudent) {
    const myAverage = evaluatedSubmissions.length > 0
      ? evaluatedSubmissions.reduce((sum, s) => sum + (s.percentage || 0), 0) / evaluatedSubmissions.length
      : 0;
    
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold font-headline">My Progress</h1>
          <p className="text-muted-foreground">Track your test performance and achievements</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tests Completed</CardTitle>
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{evaluatedSubmissions.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{myAverage.toFixed(1)}%</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Best Score</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {evaluatedSubmissions.length > 0 
                      ? Math.max(...evaluatedSubmissions.map(s => s.percentage || 0)).toFixed(0) 
                      : 0}%
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Test History</CardTitle>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tests taken yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Test</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Submitted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map(sub => (
                        <TableRow key={sub._id}>
                          <TableCell className="font-medium">{sub.test_id?.title || 'Unknown Test'}</TableCell>
                          <TableCell>
                            <Badge variant={
                              sub.results_pending ? 'outline' :
                              sub.status === 'evaluated' ? 'default' :
                              sub.status === 'submitted' ? 'secondary' : 'outline'
                            }>
                              {sub.results_pending ? 'Awaiting Results' :
                               sub.status === 'evaluated' ? 'Graded' :
                               sub.status === 'submitted' ? 'Pending Evaluation' : 'In Progress'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {sub.results_pending ? (
                              <span className="text-muted-foreground">Results not published yet</span>
                            ) : sub.status === 'evaluated' && sub.total_marks_obtained !== null ? (
                              <span className={
                                (sub.percentage || 0) >= 80 ? 'text-green-600' :
                                (sub.percentage || 0) >= 60 ? 'text-blue-600' :
                                (sub.percentage || 0) >= 40 ? 'text-yellow-600' : 'text-red-600'
                              }>
                                {sub.total_marks_obtained}/{sub.test_id?.total_marks} ({(sub.percentage || 0).toFixed(0)}%)
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  }

  // Teacher view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Student Analysis</h1>
          <p className="text-muted-foreground">Track and analyze student performance across tests</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map(cls => (
                <SelectItem key={cls._id} value={cls._id}>{cls.class_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleExportAIReport} variant="outline" className="gap-2" disabled={exportingReport}>
            {exportingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            AI Report
          </Button>
          {studentStats.length > 0 && (
            <Button onClick={exportReport} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              CSV Export
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="test-analysis">Test Analysis</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students ({studentStats.length})</TabsTrigger>
            <TabsTrigger value="submissions">Submissions ({submissions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalSubmissions}</div>
                  <p className="text-xs text-muted-foreground">{evaluatedSubmissions.length} evaluated</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Evaluation</CardTitle>
                  <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingEvaluations.length}</div>
                  <p className="text-xs text-muted-foreground">awaiting grading</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{averageScore.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">across all tests</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{strugglingStudents.length}</div>
                  <p className="text-xs text-muted-foreground">students below 50%</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Score Distribution</CardTitle>
                  <CardDescription>Performance breakdown across all tests</CardDescription>
                </CardHeader>
                <CardContent>
                  {scoreDistribution.length > 0 ? (
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <RechartsTooltip formatter={(value: number) => [`${value} Students`, 'Count']} />
                          <RechartsLegend verticalAlign="bottom" height={36} />
                          <Pie 
                            data={scoreDistribution} 
                            dataKey="count" 
                            nameKey="range"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label
                          >
                            {scoreDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      No evaluated tests yet
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performers</CardTitle>
                  <CardDescription>Students with 80%+ average</CardDescription>
                </CardHeader>
                <CardContent>
                  {topPerformers.length > 0 ? (
                    <div className="space-y-3">
                      {topPerformers.slice(0, 5).map((student, idx) => (
                        <div key={student._id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                              idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-amber-600' : 'bg-primary'
                            }`}>
                              {idx + 1}
                            </div>
                            <div>
                              <p className="font-medium">{student.name}</p>
                              <p className="text-xs text-muted-foreground">{student.testsAttempted} tests</p>
                            </div>
                          </div>
                          <Badge className="bg-green-500">{student.averageScore.toFixed(0)}%</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      No top performers yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Struggling Students Alert */}
            {strugglingStudents.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-700 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Students Needing Attention
                  </CardTitle>
                  <CardDescription>These students are scoring below 50% on average</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {strugglingStudents.map(student => (
                      <div key={student._id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                        <span className="font-medium">{student.name}</span>
                        <Badge variant="destructive">{student.averageScore.toFixed(0)}%</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="students" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Performance</CardTitle>
                <CardDescription>Individual student statistics</CardDescription>
              </CardHeader>
              <CardContent>
                {studentStats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No student data available</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Tests Taken</TableHead>
                        <TableHead>Average Score</TableHead>
                        <TableHead>Performance</TableHead>
                        <TableHead>Last Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentStats
                        .sort((a, b) => b.averageScore - a.averageScore)
                        .map(student => (
                          <TableRow key={student._id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{student.name}</p>
                                <p className="text-xs text-muted-foreground">{student.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>{student.testsAttempted}</TableCell>
                            <TableCell>
                              <span className={
                                student.averageScore >= 80 ? 'text-green-600 font-medium' :
                                student.averageScore >= 60 ? 'text-blue-600' :
                                student.averageScore >= 40 ? 'text-yellow-600' : 'text-red-600 font-medium'
                              }>
                                {student.averageScore.toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                student.averageScore >= 80 ? 'default' :
                                student.averageScore >= 60 ? 'secondary' :
                                student.averageScore >= 40 ? 'outline' : 'destructive'
                              }>
                                {student.averageScore >= 80 ? 'Excellent' :
                                 student.averageScore >= 60 ? 'Good' :
                                 student.averageScore >= 40 ? 'Average' : 'Needs Help'}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(student.lastActive).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Submissions</CardTitle>
                <CardDescription>All test submissions from students</CardDescription>
              </CardHeader>
              <CardContent>
                {submissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No submissions yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Test</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Submitted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentSubmissions.map(sub => (
                        <TableRow key={sub._id}>
                          <TableCell className="font-medium">{sub.student_id?.name || 'Unknown'}</TableCell>
                          <TableCell>{sub.test_id?.title || 'Unknown Test'}</TableCell>
                          <TableCell>
                            <Badge variant={
                              sub.status === 'evaluated' ? 'default' :
                              sub.status === 'submitted' ? 'secondary' : 'outline'
                            }>
                              {sub.status === 'evaluated' ? 'Evaluated' :
                               sub.status === 'submitted' ? 'Pending' : 'In Progress'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {sub.status === 'evaluated' ? (
                              <span className={
                                (sub.percentage || 0) >= 80 ? 'text-green-600' :
                                (sub.percentage || 0) >= 60 ? 'text-blue-600' :
                                (sub.percentage || 0) >= 40 ? 'text-yellow-600' : 'text-red-600'
                              }>
                                {sub.total_marks_obtained}/{sub.test_id?.total_marks} ({(sub.percentage || 0).toFixed(0)}%)
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Analysis Tab */}
          <TabsContent value="test-analysis" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  Test Evaluation & Results Management
                </CardTitle>
                <CardDescription>
                  Evaluate long answer questions and publish results to students
                </CardDescription>
              </CardHeader>
              <CardContent>
                {testsForEvaluation.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tests with submissions yet</p>
                    <p className="text-sm">Tests will appear here once students submit them</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {testsForEvaluation.map(test => {
                      const deadlinePassed = new Date(test.deadline) < new Date();
                      const allEvaluated = test.submissions.every(s => s.status === 'evaluated');
                      const hasLongAnswers = test.questions?.some(q => q.question_type === 'long_answer' || q.question_type === 'short_answer');
                      
                      return (
                        <Card key={test._id} className="border">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg">{test.title}</CardTitle>
                                <CardDescription>
                                  {test.submissions.length} submissions • {test.total_marks} marks total
                                </CardDescription>
                              </div>
                              <div className="flex items-center gap-2">
                                {test.results_published ? (
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Results Published
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">
                                    Results Not Published
                                  </Badge>
                                )}
                                {!deadlinePassed && (
                                  <Badge variant="secondary">
                                    Deadline: {new Date(test.deadline).toLocaleDateString()}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {/* Submissions Table */}
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Student</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Score</TableHead>
                                  <TableHead>Submitted</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {test.submissions.map(sub => (
                                  <TableRow key={sub._id}>
                                    <TableCell className="font-medium">{sub.student_id?.name}</TableCell>
                                    <TableCell>
                                      <Badge variant={
                                        sub.status === 'evaluated' ? 'default' :
                                        sub.status === 'submitted' ? 'secondary' : 'outline'
                                      }>
                                        {sub.status === 'evaluated' ? 'Evaluated' :
                                         sub.status === 'submitted' ? 'Needs Evaluation' : 'In Progress'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {sub.status === 'evaluated' ? (
                                        `${sub.total_marks_obtained}/${test.total_marks} (${sub.percentage}%)`
                                      ) : '-'}
                                    </TableCell>
                                    <TableCell>
                                      {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : '-'}
                                    </TableCell>
                                    <TableCell>
                                      {(hasLongAnswers || sub.status !== 'evaluated') && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => openEvaluationDialog({...sub, test_id: {...sub.test_id, questions: test.questions}})}
                                          className="gap-1"
                                        >
                                          <Eye className="h-3 w-3" />
                                          {sub.status === 'evaluated' ? 'Review' : 'Evaluate'}
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            
                            {/* Publish Results Button */}
                            {!test.results_published && deadlinePassed && (
                              <div className="mt-4 flex items-center justify-between p-4 bg-muted rounded-lg">
                                <div>
                                  <p className="font-medium">Ready to publish results?</p>
                                  <p className="text-sm text-muted-foreground">
                                    {allEvaluated 
                                      ? 'All submissions have been evaluated. Students will see their scores once published.'
                                      : `${test.submissions.filter(s => s.status !== 'evaluated').length} submission(s) still need evaluation.`}
                                  </p>
                                </div>
                                <Button
                                  onClick={() => handlePublishResults(test._id)}
                                  disabled={publishing || !allEvaluated}
                                  className="gap-2"
                                >
                                  {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                  Publish Results
                                </Button>
                              </div>
                            )}
                            
                            {!deadlinePassed && (
                              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                  ⏰ Test deadline has not passed yet. You can publish results after {new Date(test.deadline).toLocaleDateString()}.
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Evaluation Dialog */}
      <Dialog open={evaluationDialogOpen} onOpenChange={setEvaluationDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Evaluate Submission</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.student_id?.name} - {selectedSubmission?.test_id?.title}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] pr-4">
            <div className="space-y-6">
              {selectedSubmission?.test_id?.questions?.map((question, qIdx) => {
                const answer = selectedSubmission.answers?.find(a => a.question_index === qIdx);
                const isLongAnswer = question.question_type === 'long_answer' || question.question_type === 'short_answer';
                
                return (
                  <Card key={qIdx} className="border">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">
                          Q{qIdx + 1}. {question.question}
                        </CardTitle>
                        <Badge variant="outline">
                          {question.marks} marks
                        </Badge>
                      </div>
                      <Badge variant="secondary" className="w-fit text-xs">
                        {question.question_type === 'mcq' ? 'Multiple Choice' :
                         question.question_type === 'true_false' ? 'True/False' :
                         question.question_type === 'short_answer' ? 'Short Answer' : 'Long Answer'}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Student's Answer:</Label>
                        <div className="mt-1 p-3 bg-muted rounded-md">
                          {answer?.answer || <span className="text-muted-foreground italic">No answer provided</span>}
                        </div>
                      </div>
                      
                      {question.correct_answer && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Correct Answer:</Label>
                          <div className="mt-1 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md text-green-800 dark:text-green-200">
                            {question.correct_answer}
                          </div>
                        </div>
                      )}
                      
                      {isLongAnswer && (
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                          <div>
                            <Label htmlFor={`marks-${qIdx}`}>Marks Awarded (out of {question.marks})</Label>
                            <Input
                              id={`marks-${qIdx}`}
                              type="number"
                              min={0}
                              max={question.marks}
                              value={evaluationMarks[qIdx]?.marks || 0}
                              onChange={(e) => setEvaluationMarks(prev => ({
                                ...prev,
                                [qIdx]: { ...prev[qIdx], marks: Math.min(question.marks, Math.max(0, parseInt(e.target.value) || 0)) }
                              }))}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`feedback-${qIdx}`}>Feedback (optional)</Label>
                            <Input
                              id={`feedback-${qIdx}`}
                              value={evaluationMarks[qIdx]?.feedback || ''}
                              onChange={(e) => setEvaluationMarks(prev => ({
                                ...prev,
                                [qIdx]: { ...prev[qIdx], feedback: e.target.value }
                              }))}
                              placeholder="Good answer, but..."
                              className="mt-1"
                            />
                          </div>
                        </div>
                      )}
                      
                      {!isLongAnswer && (
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <span className="text-sm">Auto-graded:</span>
                          {answer?.answer?.toLowerCase() === question.correct_answer?.toLowerCase() ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Correct ({question.marks} marks)
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              Incorrect (0 marks)
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              
              <div className="pt-4 border-t">
                <Label htmlFor="teacher-remarks">Teacher Remarks (optional)</Label>
                <Textarea
                  id="teacher-remarks"
                  value={teacherRemarks}
                  onChange={(e) => setTeacherRemarks(e.target.value)}
                  placeholder="Overall feedback for the student..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEvaluationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitEvaluation} disabled={evaluating}>
              {evaluating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Evaluation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI-Generated Performance Report
            </DialogTitle>
            <DialogDescription>
              Generated on {aiReport?.generatedAt ? new Date(aiReport.generatedAt).toLocaleString() : ''}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] pr-4">
            {aiReport && (
              <div className="space-y-6">
                {/* Class Summaries */}
                {aiReport.classes?.map((cls: any, idx: number) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle>{cls.className}</CardTitle>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Students: {cls.totalStudents}</span>
                        <span>Participation: {cls.participationRate}%</span>
                        <span>Average: {cls.averageScore}%</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-5 gap-2 text-center text-sm">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded">
                          <div className="font-bold text-green-700 dark:text-green-300">{cls.distribution?.excellent || 0}</div>
                          <div className="text-xs">Excellent</div>
                        </div>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                          <div className="font-bold text-blue-700 dark:text-blue-300">{cls.distribution?.good || 0}</div>
                          <div className="text-xs">Good</div>
                        </div>
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded">
                          <div className="font-bold text-yellow-700 dark:text-yellow-300">{cls.distribution?.needsImprovement || 0}</div>
                          <div className="text-xs">Average</div>
                        </div>
                        <div className="p-2 bg-red-100 dark:bg-red-900 rounded">
                          <div className="font-bold text-red-700 dark:text-red-300">{cls.distribution?.atRisk || 0}</div>
                          <div className="text-xs">At Risk</div>
                        </div>
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                          <div className="font-bold">{cls.distribution?.noAttempts || 0}</div>
                          <div className="text-xs">No Attempts</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* AI Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      AI Analysis & Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-sm">
                      {aiReport.aiInsights}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={downloadReport} className="gap-2">
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
