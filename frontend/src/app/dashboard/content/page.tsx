"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useTTS } from '@/hooks/use-tts';
import { 
  Upload, 
  FileText, 
  Loader2, 
  Sparkles,
  Volume2,
  Share2,
  Eye,
  BookOpen,
  Lightbulb,
  GraduationCap,
  Languages,
  Send,
  Check,
} from 'lucide-react';

interface ClassOption {
  _id: string;
  class_name: string;
}

interface Subject {
  _id: string;
  name: string;
}

interface GeneratedContent {
  title: string;
  content: string;
  type: string;
  language: string;
  createdAt: Date;
}

const LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Tamil', label: 'Tamil' },
  { value: 'Telugu', label: 'Telugu' },
  { value: 'Kannada', label: 'Kannada' },
  { value: 'Malayalam', label: 'Malayalam' },
  { value: 'Bengali', label: 'Bengali' },
  { value: 'Marathi', label: 'Marathi' },
  { value: 'Gujarati', label: 'Gujarati' },
  { value: 'Punjabi', label: 'Punjabi' },
];

const CONTENT_TYPES = [
  { value: 'lesson_plan', label: 'Lesson Plan', icon: BookOpen },
  { value: 'explanation', label: 'Topic Explanation', icon: Lightbulb },
  { value: 'story', label: 'Educational Story', icon: FileText },
  { value: 'quiz', label: 'Quiz Questions', icon: GraduationCap },
  { value: 'summary', label: 'Topic Summary', icon: FileText },
];

const GRADE_LEVELS = [
  { value: '1-3', label: 'Grades 1-3 (Primary)' },
  { value: '4-5', label: 'Grades 4-5 (Upper Primary)' },
  { value: '6-8', label: 'Grades 6-8 (Middle School)' },
  { value: '9-10', label: 'Grades 9-10 (Secondary)' },
  { value: '11-12', label: 'Grades 11-12 (Higher Secondary)' },
];

export default function ContentAnalyzerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { speak, isSpeaking, cancel } = useTTS();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  
  const [activeTab, setActiveTab] = useState('generate');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [contentHistory, setContentHistory] = useState<GeneratedContent[]>([]);
  
  // Generation form
  const [formData, setFormData] = useState({
    topic: '',
    content_type: 'explanation',
    language: 'English',
    grade_level: '6-8',
    cultural_context: '',
    additional_instructions: '',
    subject_id: '',
  });
  
  // PDF Analysis
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<{
    difficulty: string;
    topics: string[];
    suggestions: string[];
    keyPoints: string[];
  } | null>(null);
  
  // Share dialog
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareClassId, setShareClassId] = useState('');
  const [shareTitle, setShareTitle] = useState('');

  useEffect(() => {
    if (user?.user_type === 'teacher') {
      fetchClasses();
      fetchSubjects();
    }
  }, [user]);

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/subjects');
      const data = await response.json();
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
      const response = await fetch('/api/classes');
      const data = await response.json();
      setClasses(data.classes || []);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    }
  };

  const handleGenerate = async () => {
    if (!formData.topic.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a topic',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok && data.content) {
        const newContent: GeneratedContent = {
          title: formData.topic,
          content: data.content,
          type: formData.content_type,
          language: formData.language,
          createdAt: new Date(),
        };
        setGeneratedContent(newContent);
        setContentHistory([newContent, ...contentHistory.slice(0, 9)]);
        setActiveTab('result');
        toast({
          title: 'Success',
          description: 'Content generated successfully!',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to generate content',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate content',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file',
        description: 'Please upload a PDF file',
        variant: 'destructive',
      });
      return;
    }
    
    setUploadedFile(file);
    setAnalyzing(true);
    setAnalysis(null);
    
    try {
      // Extract text from PDF
      const formData = new FormData();
      formData.append('file', file);
      
      const extractResponse = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });
      
      const extractData = await extractResponse.json();
      
      if (!extractResponse.ok) {
        throw new Error(extractData.error || 'Failed to extract text');
      }
      
      const text = extractData.text || '';
      setExtractedText(text);
      
      // Analyze the content
      const analyzeResponse = await fetch('/api/analyze-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.slice(0, 10000) }),
      });
      
      const analyzeData = await analyzeResponse.json();
      
      if (analyzeResponse.ok) {
        setAnalysis(analyzeData.analysis);
        toast({
          title: 'Analysis Complete',
          description: 'Content analyzed successfully!',
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze content',
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleShare = async () => {
    if (!shareClassId || !shareTitle || !generatedContent) {
      toast({
        title: 'Error',
        description: 'Please select a class and enter a title',
        variant: 'destructive',
      });
      return;
    }
    
    setSharing(true);
    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: shareTitle,
          content: generatedContent.content,
          class_id: shareClassId,
          content_type: 'note',
        }),
      });
      
      if (response.ok) {
        toast({
          title: 'Shared!',
          description: 'Content shared with your class',
        });
        setIsShareDialogOpen(false);
        setShareTitle('');
        setShareClassId('');
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to share content',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to share content',
        variant: 'destructive',
      });
    } finally {
      setSharing(false);
    }
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      cancel();
    } else if (generatedContent) {
      speak(generatedContent.content, formData.language);
    }
  };

  if (!user || user.user_type !== 'teacher') {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">Teacher access required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Content Analyzer</h1>
        <p className="text-muted-foreground">
          Generate AI-powered educational content or analyze curriculum materials
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generate">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Content
          </TabsTrigger>
          <TabsTrigger value="analyze">
            <FileText className="h-4 w-4 mr-2" />
            Analyze PDF
          </TabsTrigger>
          {generatedContent && (
            <TabsTrigger value="result">
              <Eye className="h-4 w-4 mr-2" />
              Result
            </TabsTrigger>
          )}
        </TabsList>

        {/* Generate Content Tab */}
        <TabsContent value="generate" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Content Generator
              </CardTitle>
              <CardDescription>
                Generate culturally relevant educational content in multiple languages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic *</Label>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="e.g., Photosynthesis, Fractions"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select 
                    value={formData.subject_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, subject_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General / No subject</SelectItem>
                      {subjects.map(sub => (
                        <SelectItem key={sub._id} value={sub._id}>
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <Select 
                    value={formData.content_type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select 
                    value={formData.language} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(lang => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Grade Level</Label>
                  <Select 
                    value={formData.grade_level} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, grade_level: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_LEVELS.map(grade => (
                        <SelectItem key={grade.value} value={grade.value}>
                          {grade.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cultural">Cultural Context</Label>
                  <Input
                    id="cultural"
                    value={formData.cultural_context}
                    onChange={(e) => setFormData(prev => ({ ...prev, cultural_context: e.target.value }))}
                    placeholder="e.g., Rural India, festivals"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Additional Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.additional_instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, additional_instructions: e.target.value }))}
                  placeholder="Any specific requirements or focus areas..."
                  rows={2}
                />
              </div>

              <Button onClick={handleGenerate} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Generate Content
              </Button>
            </CardContent>
          </Card>

          {/* Content History */}
          {contentHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Generations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contentHistory.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                      onClick={() => {
                        setGeneratedContent(item);
                        setActiveTab('result');
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {CONTENT_TYPES.find(t => t.value === item.type)?.label} • {item.language}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analyze PDF Tab */}
        <TabsContent value="analyze" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                PDF Content Analyzer
              </CardTitle>
              <CardDescription>
                Upload curriculum PDFs to analyze difficulty, extract key topics, and get teaching suggestions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="application/pdf"
                  className="hidden"
                />
                {analyzing ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p>Analyzing content...</p>
                  </div>
                ) : uploadedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-10 w-10 text-primary" />
                    <p className="font-medium">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">Click to upload a different file</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                    <p className="font-medium">Upload PDF for Analysis</p>
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                  </>
                )}
              </div>

              {analysis && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Difficulty Level</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Badge className={
                          analysis.difficulty === 'Easy' ? 'bg-green-500' :
                          analysis.difficulty === 'Medium' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }>
                          {analysis.difficulty}
                        </Badge>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Key Topics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1">
                          {analysis.topics.map((topic, idx) => (
                            <Badge key={idx} variant="outline">{topic}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Key Points
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {analysis.keyPoints.map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Teaching Suggestions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {analysis.suggestions.map((suggestion, idx) => (
                          <li key={idx}>{suggestion}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Button 
                    onClick={() => {
                      setFormData(prev => ({ ...prev, topic: analysis.topics[0] || '' }));
                      setActiveTab('generate');
                    }}
                    className="gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate Content for This Topic
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Result Tab */}
        {generatedContent && (
          <TabsContent value="result" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{generatedContent.title}</CardTitle>
                    <CardDescription>
                      {CONTENT_TYPES.find(t => t.value === generatedContent.type)?.label} • {generatedContent.language}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSpeak} className="gap-2">
                      <Volume2 className={`h-4 w-4 ${isSpeaking ? 'text-primary animate-pulse' : ''}`} />
                      {isSpeaking ? 'Stop' : 'Listen'}
                    </Button>
                    <Button 
                      onClick={() => {
                        setShareTitle(generatedContent.title);
                        setIsShareDialogOpen(true);
                      }}
                      className="gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      Share to Class
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="whitespace-pre-wrap bg-muted p-4 rounded-lg">
                    {generatedContent.content}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Content to Class</DialogTitle>
            <DialogDescription>
              Share this content with students in one of your classes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="share-title">Title</Label>
              <Input
                id="share-title"
                value={shareTitle}
                onChange={(e) => setShareTitle(e.target.value)}
                placeholder="Content title"
              />
            </div>
            <div className="space-y-2">
              <Label>Select Class</Label>
              <Select value={shareClassId} onValueChange={setShareClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleShare} disabled={sharing} className="gap-2">
              {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
