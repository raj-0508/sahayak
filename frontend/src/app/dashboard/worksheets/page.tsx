"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Trash2, 
  Loader2, 
  FileText,
  Clock,
  Sparkles,
  Save,
  Send,
  XCircle,
  Eye,
  Users,
  ClipboardCheck,
  BookOpen,
} from 'lucide-react';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface Question {
  question: string;
  question_type: 'mcq' | 'short_answer' | 'long_answer' | 'true_false';
  options?: string[];
  correct_answer?: string;
  marks: number;
}

interface Test {
  _id: string;
  title: string;
  description?: string;
  class_id: { _id: string; class_name: string };
  subject_id?: { _id: string; name: string };
  questions: Question[];
  total_marks: number;
  duration_minutes: number;
  deadline: string;
  is_published: boolean;
  created_at: string;
}

interface ClassOption {
  _id: string;
  class_name: string;
  subject_id?: { _id: string; name: string };
}

interface Subject {
  _id: string;
  name: string;
}

const QUESTION_TYPES = [
  { value: 'mcq', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True/False' },
  { value: 'short_answer', label: 'Short Answer' },
  { value: 'long_answer', label: 'Long Answer' },
];

export default function TestGeneratorPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [tests, setTests] = useState<Test[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [activeTab, setActiveTab] = useState('my-tests');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    class_id: '',
    subject_id: '',
    duration_minutes: 60,
    deadline: '',
    is_published: false,
  });
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    question: '',
    question_type: 'mcq',
    options: ['', '', '', ''],
    correct_answer: '',
    marks: 1,
  });
  
  // AI generation
  const [aiTopic, setAiTopic] = useState('');
  const [aiNumQuestions, setAiNumQuestions] = useState(5);
  const [aiQuestionType, setAiQuestionType] = useState('mcq');
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [aiUseRag, setAiUseRag] = useState(true);
  const [usedRagForGeneration, setUsedRagForGeneration] = useState<boolean | null>(null);

  useEffect(() => {
    if (user?.user_type === 'teacher') {
      fetchClasses();
      fetchTests();
      fetchSubjects();
    }
  }, [user]);

  const fetchSubjects = async () => {
    try {
      const data = await apiGet('/api/subjects');
      // Filter to only show subjects assigned to this teacher
      if (user?.subject_ids && data.subjects) {
        const teacherSubjects = data.subjects.filter((s: Subject) => 
          user.subject_ids?.includes(s._id)
        );
        setSubjects(teacherSubjects);
      } else {
        setSubjects(data.subjects || []);
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const data = await apiGet('/api/classes');
      setClasses(data.classes || []);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const fetchTests = async () => {
    try {
      setLoading(true);
      const data = await apiGet('/api/tests');
      setTests(data.tests || []);
    } catch (error) {
      console.error('Failed to fetch tests:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch tests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    if (!currentQuestion.question.trim()) {
      toast({
        title: 'Error',
        description: 'Question text is required',
        variant: 'destructive',
      });
      return;
    }
    
    if (currentQuestion.question_type === 'mcq' && (!currentQuestion.options || currentQuestion.options.filter(o => o.trim()).length < 2)) {
      toast({
        title: 'Error',
        description: 'MCQ requires at least 2 options',
        variant: 'destructive',
      });
      return;
    }
    
    if (['mcq', 'true_false'].includes(currentQuestion.question_type) && !currentQuestion.correct_answer) {
      toast({
        title: 'Error',
        description: 'Correct answer is required for auto-grading',
        variant: 'destructive',
      });
      return;
    }
    
    setQuestions([...questions, { ...currentQuestion }]);
    setCurrentQuestion({
      question: '',
      question_type: 'mcq',
      options: ['', '', '', ''],
      correct_answer: '',
      marks: 1,
    });
    
    toast({
      title: 'Question Added',
      description: `Question ${questions.length + 1} added successfully`,
    });
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleCreateTest = async () => {
    if (!formData.title || !formData.class_id || !formData.subject_id || questions.length === 0 || !formData.deadline) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in title, select subject and class, add questions, and set deadline',
        variant: 'destructive',
      });
      return;
    }
    
    setSaving(true);
    try {
      await apiPost('/api/tests', {
        ...formData,
        questions,
      });
      
      toast({
        title: 'Success',
        description: `Test "${formData.title}" created successfully!`,
      });
      setIsCreateDialogOpen(false);
      resetForm();
      fetchTests();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create test',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTest = async () => {
    if (!selectedTest) return;
    
    try {
      await apiDelete(`/api/tests/${selectedTest._id}`);
      
      toast({
        title: 'Success',
        description: 'Test deleted successfully',
      });
      setIsDeleteDialogOpen(false);
      setSelectedTest(null);
      fetchTests();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete test',
        variant: 'destructive',
      });
    }
  };

  const handleTogglePublish = async (test: Test) => {
    try {
      await apiPut(`/api/tests/${test._id}`, { is_published: !test.is_published });
      
      toast({
        title: 'Success',
        description: test.is_published ? 'Test unpublished' : 'Test published to students!',
      });
      fetchTests();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update test',
        variant: 'destructive',
      });
    }
  };

  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a topic for AI generation',
        variant: 'destructive',
      });
      return;
    }
    
    setGenerating(true);
    try {
      const data = await apiPost('/api/generate-questions', {
        topic: aiTopic,
        num_questions: aiNumQuestions,
        question_type: aiQuestionType,
        difficulty: aiDifficulty,
        subject_id: formData.subject_id || undefined,
        use_rag: aiUseRag && formData.subject_id,
      });
      
      if (data.questions) {
        setQuestions([...questions, ...data.questions]);
        setUsedRagForGeneration(data.used_rag || false);
        toast({
          title: 'Success',
          description: `Generated ${data.questions.length} questions${data.used_rag ? ' (using curriculum content)' : ''}!`,
        });
        setAiTopic('');
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to generate questions',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate questions',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      class_id: '',
      subject_id: '',
      duration_minutes: 60,
      deadline: '',
      is_published: false,
    });
    setQuestions([]);
    setUsedRagForGeneration(null);
    setCurrentQuestion({
      question: '',
      question_type: 'mcq',
      options: ['', '', '', ''],
      correct_answer: '',
      marks: 1,
    });
  };

  const getTotalMarks = () => questions.reduce((sum, q) => sum + q.marks, 0);

  if (!user || user.user_type !== 'teacher') {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">Teacher access required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-headline">Test Generator</h1>
          <p className="text-muted-foreground">
            Create and manage tests for your classes
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Test
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my-tests">My Tests ({tests.length})</TabsTrigger>
          <TabsTrigger value="published">Published ({tests.filter(t => t.is_published).length})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({tests.filter(t => !t.is_published).length})</TabsTrigger>
        </TabsList>

        <TabsContent value="my-tests" className="mt-6">
          <TestsTable 
            tests={tests} 
            loading={loading}
            onTogglePublish={handleTogglePublish}
            onDelete={(test) => { setSelectedTest(test); setIsDeleteDialogOpen(true); }}
            onView={(test) => { setSelectedTest(test); setIsViewDialogOpen(true); }}
          />
        </TabsContent>

        <TabsContent value="published" className="mt-6">
          <TestsTable 
            tests={tests.filter(t => t.is_published)} 
            loading={loading}
            onTogglePublish={handleTogglePublish}
            onDelete={(test) => { setSelectedTest(test); setIsDeleteDialogOpen(true); }}
            onView={(test) => { setSelectedTest(test); setIsViewDialogOpen(true); }}
          />
        </TabsContent>

        <TabsContent value="drafts" className="mt-6">
          <TestsTable 
            tests={tests.filter(t => !t.is_published)} 
            loading={loading}
            onTogglePublish={handleTogglePublish}
            onDelete={(test) => { setSelectedTest(test); setIsDeleteDialogOpen(true); }}
            onView={(test) => { setSelectedTest(test); setIsViewDialogOpen(true); }}
          />
        </TabsContent>
      </Tabs>

      {/* Create Test Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Test</DialogTitle>
            <DialogDescription>
              Create a test with multiple question types for your students.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Test Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Test Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Chapter 5 Quiz"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subject *</Label>
                    <Select 
                      value={formData.subject_id} 
                      onValueChange={(value: string) => setFormData(prev => ({ ...prev, subject_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map(sub => (
                          <SelectItem key={sub._id} value={sub._id}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Class *</Label>
                  <Select 
                    value={formData.class_id} 
                    onValueChange={(value: string) => setFormData(prev => ({ ...prev, class_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map(cls => (
                        <SelectItem key={cls._id} value={cls._id}>
                          {cls.class_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Instructions or notes for students"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min={5}
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline *</Label>
                    <Input
                      id="deadline"
                      type="datetime-local"
                      value={formData.deadline}
                      onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Publish Now?</Label>
                    <div className="flex items-center gap-2 pt-2">
                      <Switch
                        checked={formData.is_published}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                      />
                      <span className="text-sm text-muted-foreground">
                        {formData.is_published ? 'Visible to students' : 'Draft only'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Question Generator */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Question Generator
                </CardTitle>
                <CardDescription>Generate questions automatically using AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Topic</Label>
                    <Input
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="e.g., Photosynthesis, Fractions, World War II"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Number</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={aiNumQuestions}
                      onChange={(e) => setAiNumQuestions(parseInt(e.target.value) || 5)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={aiQuestionType} onValueChange={setAiQuestionType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {QUESTION_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select value={aiDifficulty} onValueChange={setAiDifficulty}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Use Curriculum Content</Label>
                    <div className="flex items-center gap-2 pt-2">
                      <Switch
                        checked={aiUseRag}
                        onCheckedChange={setAiUseRag}
                        disabled={!formData.subject_id}
                      />
                      <span className="text-xs text-muted-foreground">
                        {formData.subject_id ? (aiUseRag ? 'Using uploaded materials' : 'General knowledge') : 'Select subject first'}
                      </span>
                    </div>
                  </div>
                  <Button 
                    onClick={handleAIGenerate} 
                    disabled={generating}
                    className="mt-6 gap-2"
                  >
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Generate Questions
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Manual Question Add */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Question Manually</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Question Text *</Label>
                    <Textarea
                      value={currentQuestion.question}
                      onChange={(e) => setCurrentQuestion(prev => ({ ...prev, question: e.target.value }))}
                      placeholder="Enter your question here"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Question Type</Label>
                      <Select 
                        value={currentQuestion.question_type} 
                        onValueChange={(value: any) => setCurrentQuestion(prev => ({ 
                          ...prev, 
                          question_type: value,
                          options: value === 'mcq' ? ['', '', '', ''] : value === 'true_false' ? ['True', 'False'] : undefined,
                          correct_answer: ''
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {QUESTION_TYPES.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Marks</Label>
                      <Input
                        type="number"
                        min={1}
                        value={currentQuestion.marks}
                        onChange={(e) => setCurrentQuestion(prev => ({ ...prev, marks: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                  </div>
                </div>

                {/* MCQ Options */}
                {currentQuestion.question_type === 'mcq' && (
                  <div className="space-y-2">
                    <Label>Options (mark correct answer)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {currentQuestion.options?.map((opt, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="correct_option"
                            checked={currentQuestion.correct_answer === opt && opt.trim() !== ''}
                            onChange={() => setCurrentQuestion(prev => ({ ...prev, correct_answer: opt }))}
                            disabled={!opt.trim()}
                            className="h-4 w-4"
                          />
                          <Input
                            value={opt}
                            onChange={(e) => {
                              const newOptions = [...(currentQuestion.options || [])];
                              newOptions[idx] = e.target.value;
                              setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
                            }}
                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* True/False */}
                {currentQuestion.question_type === 'true_false' && (
                  <div className="space-y-2">
                    <Label>Correct Answer</Label>
                    <Select 
                      value={currentQuestion.correct_answer || 'select'} 
                      onValueChange={(value: string) => setCurrentQuestion(prev => ({ ...prev, correct_answer: value === 'select' ? '' : value }))}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select correct answer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="select" disabled>Select answer</SelectItem>
                        <SelectItem value="True">True</SelectItem>
                        <SelectItem value="False">False</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button onClick={addQuestion} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Question
                </Button>
              </CardContent>
            </Card>

            {/* Questions Preview */}
            {questions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Questions ({questions.length})</span>
                    <Badge>Total: {getTotalMarks()} marks</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* RAG Usage Note */}
                  {usedRagForGeneration !== null && (
                    <div className={`mb-4 p-3 rounded-lg border ${usedRagForGeneration ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'}`}>
                      <div className="flex items-start gap-2">
                        {usedRagForGeneration ? (
                          <>
                            <BookOpen className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-green-700 dark:text-green-300">Generated using Curriculum Content (RAG)</p>
                              <p className="text-sm text-green-600 dark:text-green-400">These questions were generated using your uploaded curriculum materials and PDFs. The AI used relevant content from your curriculum database to create contextually accurate questions.</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-yellow-700 dark:text-yellow-300">Generated by AI Only</p>
                              <p className="text-sm text-yellow-600 dark:text-yellow-400">These questions were generated by AI without using curriculum content. To use RAG, make sure you have uploaded curriculum PDFs for the selected subject and enabled "Use curriculum content".</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    {questions.map((q, idx) => (
                      <div key={idx} className="flex items-start justify-between p-3 bg-muted rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">Q{idx + 1}.</span>
                            <Badge variant="outline" className="text-xs">
                              {QUESTION_TYPES.find(t => t.value === q.question_type)?.label}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">{q.marks} marks</Badge>
                          </div>
                          <p className="text-sm">{q.question}</p>
                          {q.options && q.question_type === 'mcq' && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              Options: {q.options.filter(o => o.trim()).join(' | ')}
                            </div>
                          )}
                          {q.correct_answer && (
                            <div className="mt-1 text-xs text-green-600">
                              Answer: {q.correct_answer}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeQuestion(idx)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateTest} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Create Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Test Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTest?.title}</DialogTitle>
            <DialogDescription>
              {selectedTest?.class_id?.class_name} • {selectedTest?.total_marks} marks • {selectedTest?.duration_minutes} minutes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedTest?.description && (
              <p className="text-sm text-muted-foreground">{selectedTest.description}</p>
            )}
            
            <div className="space-y-3">
              {selectedTest?.questions.map((q, idx) => (
                <div key={idx} className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">Q{idx + 1}.</span>
                    <Badge variant="outline" className="text-xs">
                      {QUESTION_TYPES.find(t => t.value === q.question_type)?.label}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">{q.marks} marks</Badge>
                  </div>
                  <p className="text-sm">{q.question}</p>
                  {q.options && q.question_type === 'mcq' && (
                    <div className="mt-2 space-y-1">
                      {q.options.filter(o => o.trim()).map((opt, oidx) => (
                        <div key={oidx} className={`text-sm px-2 py-1 rounded ${opt === q.correct_answer ? 'bg-green-100 text-green-700' : ''}`}>
                          {String.fromCharCode(65 + oidx)}. {opt}
                        </div>
                      ))}
                    </div>
                  )}
                  {q.question_type === 'true_false' && q.correct_answer && (
                    <div className="mt-1 text-sm text-green-600">Answer: {q.correct_answer}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Test</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedTest?.title}"? This will also delete all student submissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTest}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Tests Table Component
function TestsTable({ 
  tests, 
  loading,
  onTogglePublish, 
  onDelete,
  onView 
}: { 
  tests: Test[]; 
  loading: boolean;
  onTogglePublish: (test: Test) => void;
  onDelete: (test: Test) => void;
  onView: (test: Test) => void;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (tests.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No tests found</p>
          <p className="text-sm">Create your first test to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Questions</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tests.map((test) => (
            <TableRow key={test._id}>
              <TableCell className="font-medium">{test.title}</TableCell>
              <TableCell>
                <Badge variant="secondary">{test.class_id?.class_name}</Badge>
              </TableCell>
              <TableCell>{test.questions.length} Qs ({test.total_marks} marks)</TableCell>
              <TableCell>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {test.duration_minutes} min
                </span>
              </TableCell>
              <TableCell>
                {new Date(test.deadline).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {test.is_published ? (
                  <Badge className="bg-green-500">Published</Badge>
                ) : (
                  <Badge variant="outline">Draft</Badge>
                )}
              </TableCell>
              <TableCell className="text-right space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onView(test)}
                  title="View Test"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onTogglePublish(test)}
                  title={test.is_published ? 'Unpublish' : 'Publish'}
                >
                  {test.is_published ? <XCircle className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(test)}
                  className="text-destructive"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
