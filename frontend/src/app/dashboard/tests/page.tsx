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
  ClipboardList, 
  Loader2, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  Play,
  Eye,
  Calendar,
  Award,
  Timer
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Question {
  question: string;
  question_type: 'mcq' | 'short_answer' | 'long_answer' | 'true_false';
  options?: string[];
  correct_answer?: string;
  marks: number;
}

interface TestData {
  _id: string;
  title: string;
  description?: string;
  class_id: {
    _id: string;
    class_name: string;
    teacher_name?: string;
  };
  subject_id?: {
    _id: string;
    name: string;
  };
  teacher_id?: {
    _id: string;
    name: string;
  };
  questions: Question[];
  total_marks: number;
  duration_minutes: number;
  deadline: string;
  is_published: boolean;
  results_published?: boolean;
  submission?: {
    _id: string;
    status: 'in_progress' | 'submitted' | 'evaluating' | 'evaluated';
    total_marks_obtained: number | null;
    percentage: number | null;
    submitted_at?: string;
    evaluated_at?: string | null;
    results_pending?: boolean;
  } | null;
}

interface ResultData {
  test: {
    title: string;
    description?: string;
    total_marks: number;
    class_name?: string;
    subject_name?: string;
  };
  submission: {
    status: string;
    total_marks_obtained: number;
    percentage: number;
    submitted_at?: string;
    evaluated_at?: string;
    teacher_remarks?: string;
  };
  questions?: {
    question: string;
    question_type: string;
    options?: string[];
    correct_answer?: string;
    marks: number;
    student_answer: string;
    marks_obtained: number;
    feedback?: string;
  }[];
  message?: string;
}

export default function TestsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<TestData[]>([]);
  const [selectedTest, setSelectedTest] = useState<TestData | null>(null);
  const [takingTest, setTakingTest] = useState(false);
  const [currentAnswers, setCurrentAnswers] = useState<{ answer: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [viewingResults, setViewingResults] = useState(false);
  const [resultsData, setResultsData] = useState<ResultData | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (user?.user_type === 'student') {
      fetchTests();
    }
  }, [user]);

  // Timer effect
  useEffect(() => {
    if (takingTest && timeLeft !== null && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev && prev <= 1) {
            handleSubmitTest('submit');
            return 0;
          }
          return prev ? prev - 1 : 0;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [takingTest, timeLeft]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tests');
      const data = await response.json();
      setTests(data.tests || []);
    } catch (error) {
      console.error('Failed to fetch tests:', error);
      toast({
        title: "Error",
        description: "Failed to load tests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startTest = async (test: TestData) => {
    try {
      const response = await fetch(`/api/tests/${test._id}`);
      const data = await response.json();
      
      if (data.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }
      
      setSelectedTest({ ...test, questions: data.test.questions });
      setCurrentAnswers(data.test.questions.map(() => ({ answer: '' })));
      
      let timeRemaining = test.duration_minutes * 60;
      
      // If there's an existing in-progress submission, load those answers and correct the timer
      if (data.submission) {
        if (data.submission.started_at) {
          const startedTime = new Date(data.submission.started_at).getTime();
          const now = new Date().getTime();
          const elapsedSeconds = Math.floor((now - startedTime) / 1000);
          timeRemaining = Math.max(0, timeRemaining - elapsedSeconds);
        }
        
        if (data.submission.answers) {
          const savedAnswers = data.test.questions.map((_: Question, idx: number) => {
            const savedAnswer = data.submission.answers.find((a: any) => a.question_index === idx);
            return { answer: savedAnswer?.answer || '' };
          });
          setCurrentAnswers(savedAnswers);
        }
      } else {
        // Start the clock on the backend silently
        fetch(`/api/tests/${test._id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: [], action: 'save' }),
        }).catch(err => console.error('Failed to start native clock:', err));
      }

      setTimeLeft(timeRemaining);
      setTakingTest(true);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load test", variant: "destructive" });
    }
  };

  const handleAnswerChange = (questionIdx: number, answer: string) => {
    setCurrentAnswers(prev => {
      const updated = [...prev];
      updated[questionIdx] = { answer };
      return updated;
    });
  };

  const handleSubmitTest = async (action: 'save' | 'submit') => {
    if (!selectedTest) return;
    
    setSubmitting(true);
    try {
      const response = await fetch(`/api/tests/${selectedTest._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: currentAnswers, action }),
      });
      
      const data = await response.json();
      
      if (data.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }
      
      if (action === 'submit') {
        toast({ title: "Success", description: "Test submitted successfully!" });
        setTakingTest(false);
        setSelectedTest(null);
        fetchTests();
      } else {
        toast({ title: "Saved", description: "Your answers have been saved." });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit test", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const viewResults = async (test: TestData) => {
    setLoadingResults(true);
    setViewingResults(true);
    try {
      const response = await fetch(`/api/tests/${test._id}/results`);
      const data = await response.json();
      
      // Check if results are pending
      if (data.results_pending) {
        toast({ 
          title: "Results Not Available", 
          description: data.message || "Results have not been published yet. Please wait for your teacher to publish the results.", 
          variant: "default" 
        });
        setViewingResults(false);
        return;
      }
      
      setResultsData(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load results", variant: "destructive" });
      setViewingResults(false);
    } finally {
      setLoadingResults(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (test: TestData) => {
    const now = new Date();
    const deadline = new Date(test.deadline);
    
    if (!test.submission) {
      if (now > deadline) {
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Missed</Badge>;
      }
      return <Badge variant="outline" className="bg-blue-50 text-blue-700"><Play className="h-3 w-3 mr-1" />Not Started</Badge>;
    }
    
    switch (test.submission.status) {
      case 'in_progress':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'submitted':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700"><Clock className="h-3 w-3 mr-1" />Under Evaluation</Badge>;
      case 'evaluating':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700"><Clock className="h-3 w-3 mr-1" />Evaluating</Badge>;
      case 'evaluated':
        // Show "Awaiting Results" if results not published yet
        if (test.submission.results_pending) {
          return <Badge variant="outline" className="bg-amber-50 text-amber-700"><Clock className="h-3 w-3 mr-1" />Awaiting Results</Badge>;
        }
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Results Available</Badge>;
      default:
        return null;
    }
  };

  const getActionButton = (test: TestData) => {
    const now = new Date();
    const deadline = new Date(test.deadline);
    
    if (!test.submission) {
      if (now > deadline) {
        return <Button disabled variant="outline">Deadline Passed</Button>;
      }
      return <Button onClick={() => startTest(test)} className="gap-2"><Play className="h-4 w-4" />Write Assessment</Button>;
    }
    
    switch (test.submission.status) {
      case 'in_progress':
        if (now > deadline) {
          return <Button disabled variant="outline">Deadline Passed</Button>;
        }
        return <Button onClick={() => startTest(test)} className="gap-2"><Play className="h-4 w-4" />Continue</Button>;
      case 'submitted':
      case 'evaluating':
        return <Button disabled variant="outline" className="gap-2"><Clock className="h-4 w-4" />Awaiting Results</Button>;
      case 'evaluated':
        return <Button onClick={() => viewResults(test)} variant="secondary" className="gap-2"><Eye className="h-4 w-4" />View Results</Button>;
      default:
        return null;
    }
  };

  // Separate tests by status
  const pendingTests = tests.filter(t => !t.submission || t.submission.status === 'in_progress');
  const submittedTests = tests.filter(t => t.submission && 
    (t.submission.status === 'submitted' || 
     t.submission.status === 'evaluating'));
  const evaluatedTests = tests.filter(t => t.submission?.status === 'evaluated');

  if (!user || user.user_type !== 'student') {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Tests & Assessments</h1>
          <p className="text-muted-foreground">Student access only.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Tests & Assessments</h1>
          <p className="text-muted-foreground">View and take your assigned tests.</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Test taking view
  if (takingTest && selectedTest) {
    const answeredCount = currentAnswers.filter(a => a.answer.trim()).length;
    const progress = (answeredCount / selectedTest.questions.length) * 100;
    
    return (
      <div className="space-y-6">
        {/* Header with timer */}
        <div className="sticky top-0 bg-background z-10 pb-4 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">{selectedTest.title}</h1>
              <p className="text-muted-foreground">{selectedTest.class_id.class_name}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Time Left</p>
                <p className={`text-2xl font-mono font-bold ${timeLeft && timeLeft < 300 ? 'text-red-500' : ''}`}>
                  <Timer className="inline h-5 w-5 mr-1" />
                  {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Progress</p>
                <p className="text-lg font-semibold">{answeredCount}/{selectedTest.questions.length}</p>
              </div>
            </div>
          </div>
          <Progress value={progress} className="mt-4" />
        </div>

        {/* Questions */}
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="space-y-6 pr-4">
            {selectedTest.questions.map((question, idx) => (
              <Card key={idx} className={currentAnswers[idx]?.answer ? 'border-green-200' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      Q{idx + 1}. {question.question}
                    </CardTitle>
                    <Badge variant="outline">{question.marks} marks</Badge>
                  </div>
                  <CardDescription>
                    {question.question_type === 'mcq' && 'Multiple Choice'}
                    {question.question_type === 'true_false' && 'True / False'}
                    {question.question_type === 'short_answer' && 'Short Answer'}
                    {question.question_type === 'long_answer' && 'Long Answer'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(question.question_type === 'mcq' || question.question_type === 'true_false') && (
                    <RadioGroup
                      value={currentAnswers[idx]?.answer || ''}
                      onValueChange={(value) => handleAnswerChange(idx, value)}
                    >
                      {question.question_type === 'true_false' ? (
                        <>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id={`q${idx}-true`} />
                            <Label htmlFor={`q${idx}-true`}>True</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id={`q${idx}-false`} />
                            <Label htmlFor={`q${idx}-false`}>False</Label>
                          </div>
                        </>
                      ) : (
                        question.options?.map((option, optIdx) => (
                          <div key={optIdx} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`q${idx}-opt${optIdx}`} />
                            <Label htmlFor={`q${idx}-opt${optIdx}`}>{option}</Label>
                          </div>
                        ))
                      )}
                    </RadioGroup>
                  )}
                  
                  {question.question_type === 'short_answer' && (
                    <Textarea
                      placeholder="Enter your answer..."
                      value={currentAnswers[idx]?.answer || ''}
                      onChange={(e) => handleAnswerChange(idx, e.target.value)}
                      rows={3}
                    />
                  )}
                  
                  {question.question_type === 'long_answer' && (
                    <Textarea
                      placeholder="Enter your detailed answer..."
                      value={currentAnswers[idx]?.answer || ''}
                      onChange={(e) => handleAnswerChange(idx, e.target.value)}
                      rows={6}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* Submit buttons */}
        <div className="sticky bottom-0 bg-background pt-4 border-t flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => handleSubmitTest('save')}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Progress
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              onClick={() => {
                setTakingTest(false);
                setSelectedTest(null);
              }}
            >
              Exit (Progress Saved)
            </Button>
            <Button 
              onClick={() => handleSubmitTest('submit')}
              disabled={submitting}
              className="gap-2"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Submit Test
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Tests & Assessments</h1>
        <p className="text-muted-foreground">View assigned tests, take assessments, and check your results.</p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Pending ({pendingTests.length})
          </TabsTrigger>
          <TabsTrigger value="submitted" className="gap-2">
            <Clock className="h-4 w-4" />
            Under Evaluation ({submittedTests.length})
          </TabsTrigger>
          <TabsTrigger value="results" className="gap-2">
            <Award className="h-4 w-4" />
            Results ({evaluatedTests.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Tests */}
        <TabsContent value="pending" className="mt-6">
          {pendingTests.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">No pending tests</h3>
              <p className="text-sm text-muted-foreground">You're all caught up! Check back later for new assignments.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pendingTests.map(test => (
                <Card key={test._id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{test.title}</CardTitle>
                      {getStatusBadge(test)}
                    </div>
                    <CardDescription>{test.class_id.class_name}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="space-y-2 text-sm">
                      {test.subject_id && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{test.subject_id.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <span>Total Marks: {test.total_marks}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <span>Duration: {test.duration_minutes} mins</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Deadline: {new Date(test.deadline).toLocaleString()}</span>
                      </div>
                    </div>
                    {test.description && (
                      <p className="mt-3 text-sm text-muted-foreground">{test.description}</p>
                    )}
                  </CardContent>
                  <CardFooter>
                    {getActionButton(test)}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Submitted Tests */}
        <TabsContent value="submitted" className="mt-6">
          {submittedTests.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">No tests under evaluation</h3>
              <p className="text-sm text-muted-foreground">Submitted tests awaiting teacher review will appear here.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {submittedTests.map(test => (
                <Card key={test._id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-orange-100">
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium">{test.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {test.class_id.class_name} • Submitted on {new Date(test.submission?.submitted_at || '').toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                      Under Evaluation
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Results */}
        <TabsContent value="results" className="mt-6">
          {evaluatedTests.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground">No results yet</h3>
              <p className="text-sm text-muted-foreground">Your evaluated test results will appear here.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {evaluatedTests.map(test => (
                <Card key={test._id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{test.title}</CardTitle>
                      <Badge 
                        variant="secondary" 
                        className={
                          (test.submission?.percentage || 0) >= 80 ? 'bg-green-100 text-green-800' :
                          (test.submission?.percentage || 0) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }
                      >
                        {(test.submission?.percentage || 0).toFixed(1)}%
                      </Badge>
                    </div>
                    <CardDescription>{test.class_id.class_name}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="text-center py-4">
                      <p className="text-3xl font-bold text-primary">
                        {test.submission?.total_marks_obtained || 0}/{test.total_marks}
                      </p>
                      <p className="text-sm text-muted-foreground">Marks Obtained</p>
                    </div>
                    <Progress 
                      value={test.submission?.percentage || 0} 
                      className={
                        (test.submission?.percentage || 0) >= 80 ? '[&>div]:bg-green-500' :
                        (test.submission?.percentage || 0) >= 50 ? '[&>div]:bg-yellow-500' :
                        '[&>div]:bg-red-500'
                      }
                    />
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => viewResults(test)} 
                      variant="secondary" 
                      className="w-full gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Detailed Results
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Results Dialog */}
      <Dialog open={viewingResults} onOpenChange={setViewingResults}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Test Results</DialogTitle>
            <DialogDescription>
              Detailed breakdown of your performance
            </DialogDescription>
          </DialogHeader>
          
          {loadingResults ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : resultsData?.message ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p>{resultsData.message}</p>
            </div>
          ) : resultsData ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-3xl font-bold text-primary">
                      {resultsData.submission.total_marks_obtained}/{resultsData.test.total_marks}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Score</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className={`text-3xl font-bold ${
                      resultsData.submission.percentage >= 80 ? 'text-green-600' :
                      resultsData.submission.percentage >= 50 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {resultsData.submission.percentage.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground">Percentage</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-lg font-semibold">
                      {resultsData.submission.evaluated_at ? new Date(resultsData.submission.evaluated_at).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground">Evaluated On</p>
                  </CardContent>
                </Card>
              </div>

              {resultsData.submission.teacher_remarks && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Teacher's Remarks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{resultsData.submission.teacher_remarks}</p>
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* Question-wise breakdown */}
              <div>
                <h3 className="font-semibold mb-4">Question-wise Analysis</h3>
                <div className="space-y-4">
                  {resultsData.questions?.map((q, idx) => (
                    <Card key={idx} className={q.marks_obtained === q.marks ? 'border-green-200' : q.marks_obtained > 0 ? 'border-yellow-200' : 'border-red-200'}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium">Q{idx + 1}. {q.question}</p>
                          <Badge variant={q.marks_obtained === q.marks ? 'default' : 'destructive'}>
                            {q.marks_obtained}/{q.marks}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-muted-foreground">Your Answer:</span> {q.student_answer}</p>
                          {q.correct_answer && (
                            <p><span className="text-muted-foreground">Correct Answer:</span> <span className="text-green-600">{q.correct_answer}</span></p>
                          )}
                          {q.feedback && (
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
                              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">Teacher Feedback:</p>
                              <p className="text-muted-foreground italic">{q.feedback}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          
          <DialogFooter>
            <Button onClick={() => setViewingResults(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
