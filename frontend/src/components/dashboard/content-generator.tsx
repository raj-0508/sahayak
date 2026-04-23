"use client";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Loader2, Sparkles, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateCulturallyRelevantContent } from "@/ai/flows/generate-culturally-relevant-content";
import { useTTS } from "@/hooks/use-tts";

export function ContentGenerator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const { toast } = useToast();
  const { speak, isSpeaking } = useTTS();

  const handleGeneration = async (data: any) => {
    setLoading(true);
    setResult('');
    try {
        const genResult = await generateCulturallyRelevantContent(data);
        setResult(genResult.content);
    } catch (error) {
        console.error("Generation failed:", error);
        toast({
            title: "Generation Failed",
            description: "Something went wrong. Please try again.",
            variant: "destructive"
        })
    } finally {
        setLoading(false);
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    handleGeneration(data);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Culturally Relevant Content</CardTitle>
        <CardDescription>Generate stories, quizzes, or other content with cultural context.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="culture-topic">Topic</Label>
                    <Input id="culture-topic" name="topic" placeholder="e.g., The Monsoon Season" required/>
                </div>
                <div>
                    <Label htmlFor="culture-gradeLevel">Grade Level</Label>
                    <Input id="culture-gradeLevel" name="gradeLevel" placeholder="e.g., Grade 5" required/>
                </div>
                <div>
                    <Label htmlFor="culture-language">Language</Label>
                    <Select name="language" required>
                        <SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Hindi">Hindi</SelectItem>
                            <SelectItem value="Tamil">Tamil</SelectItem>
                            <SelectItem value="Telugu">Telugu</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div>
                    <Label htmlFor="culture-culture">Cultural Context</Label>
                    <Input id="culture-culture" name="culture" placeholder="e.g., Indian Festivals" required/>
                </div>
                 <div className="col-span-1 md:col-span-2">
                    <Label htmlFor="culture-contentType">Content Type</Label>
                    <Select name="contentType" required>
                        <SelectTrigger><SelectValue placeholder="Select content type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="story">Story</SelectItem>
                            <SelectItem value="explanation">Explanation</SelectItem>
                            <SelectItem value="quiz">Quiz</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4" />}
            Generate Content
          </Button>
        </form>
         {result && (
          <div className="mt-6 p-4 border rounded-lg bg-secondary/50 relative">
            <h4 className="font-bold mb-2">Generated Content</h4>
            <p className="whitespace-pre-wrap">{result}</p>
            <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => speak(result)} disabled={isSpeaking}>
                <Volume2 className="h-5 w-5"/>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
