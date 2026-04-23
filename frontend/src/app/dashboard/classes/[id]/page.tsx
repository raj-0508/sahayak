"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useTTS } from '@/hooks/use-tts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, ArrowLeft, FileText, Volume2, Calendar, BookOpen, Lightbulb, GraduationCap } from 'lucide-react';

interface ContentItem {
  _id: string;
  title: string;
  content: string;
  content_type: string;
  created_at: string;
  class_id: {
    _id: string;
    class_name: string;
  };
  teacher_id: {
    _id: string;
    name: string;
  };
}

const CONTENT_TYPES = [
  { value: 'lesson_plan', label: 'Lesson Plan', icon: BookOpen },
  { value: 'explanation', label: 'Topic Explanation', icon: Lightbulb },
  { value: 'story', label: 'Educational Story', icon: FileText },
  { value: 'quiz', label: 'Quiz Questions', icon: GraduationCap },
  { value: 'summary', label: 'Topic Summary', icon: FileText },
  { value: 'note', label: 'Class Note', icon: FileText },
];

export default function ClassContentPage() {
  const params = useParams();
  const classId = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const { speak, isSpeaking, cancel } = useTTS();
  
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [className, setClassName] = useState<string>('Loading Class...');
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    if (user && classId) {
      fetchClassData();
    }
  }, [user, classId]);

  const fetchClassData = async () => {
    setLoading(true);
    try {
      const [contentRes, classesRes] = await Promise.all([
        fetch(`/api/content?class_id=${classId}`),
        fetch(`/api/classes`) // to get the class name
      ]);

      if (contentRes.ok) {
        const contentData = await contentRes.json();
        setContents(contentData.content || []);
      }

      if (classesRes.ok) {
        const classesData = await classesRes.json();
        const curClass = classesData.classes?.find((c: any) => c._id === classId);
        if (curClass) {
          setClassName(curClass.class_name || curClass.name || 'Unknown Class');
        } else {
          setClassName('Class Content');
        }
      }

    } catch (error) {
      console.error('Failed to fetch class content:', error);
      toast({
        title: "Error",
        description: "Failed to load class content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      cancel();
    } else if (selectedContent) {
      speak(selectedContent.content, 'English');
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold font-headline gradient-text">{className}</h1>
          <p className="text-muted-foreground">Review materials and AI-generated concepts shared by your teacher</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : contents.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed rounded-lg bg-card/50">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-foreground">No content available</h3>
          <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
            Your teacher has not shared any content with this class yet. Check back later!
          </p>
          <Button variant="outline" className="mt-6" onClick={() => router.back()}>
            Return to Classes
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {contents.map((item) => {
            const TypeIcon = CONTENT_TYPES.find(t => t.value === item.content_type)?.icon || FileText;
            const typeLabel = CONTENT_TYPES.find(t => t.value === item.content_type)?.label || 'Material';
            
            return (
              <Card key={item._id} className="flex flex-col hover:shadow-md transition-all cursor-pointer border-t-4 border-t-primary" onClick={() => {
                setSelectedContent(item);
                setIsViewDialogOpen(true);
              }}>
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary">
                      <TypeIcon className="h-3 w-3" />
                      {typeLabel}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-2">
                    <Calendar className="h-3 w-3" />
                    {new Date(item.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {item.content}
                  </p>
                </CardContent>
                <CardFooter className="pt-2 pb-4">
                  <Button variant="ghost" className="w-full text-primary hover:text-primary hover:bg-primary/10">Read More</Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* View Content Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={(open) => !open && setIsViewDialogOpen(false)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex justify-between items-start gap-4 pr-6">
              <div>
                <DialogTitle className="text-2xl">{selectedContent?.title}</DialogTitle>
                <DialogDescription className="mt-1.5 flex flex-wrap gap-2 items-center">
                  <Badge variant="secondary">{CONTENT_TYPES.find(t => t.value === selectedContent?.content_type)?.label || 'Material'}</Badge>
                  <span className="text-xs">Shared by {selectedContent?.teacher_id?.name || 'Teacher'}</span>
                  <span className="text-xs">&bull;</span>
                  <span className="text-xs">{selectedContent ? new Date(selectedContent.created_at).toLocaleDateString() : ''}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4">
            <div className="prose prose-base dark:prose-invert max-w-none bg-card border rounded-lg p-6 shadow-sm">
              <pre className="whitespace-pre-wrap font-sans text-sm md:text-base leading-relaxed">
                {selectedContent?.content}
              </pre>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between items-center border-t pt-4">
            <Button variant="outline" onClick={handleSpeak} className="gap-2 shrink-0">
              <Volume2 className={`h-4 w-4 ${isSpeaking ? 'text-primary animate-pulse' : ''}`} />
              {isSpeaking ? 'Stop Reading' : 'Listen to Content'}
            </Button>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
