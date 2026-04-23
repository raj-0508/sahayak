"use client";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "../ui/textarea";
import { Loader2, Sparkles, Volume2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateVisualAid } from "@/ai/flows/generate-visual-aids";
import { generateCulturallyRelevantContent } from "@/ai/flows/generate-culturally-relevant-content";
import { useTTS } from "@/hooks/use-tts";

type LoadingState = {
    [key: string]: boolean;
}

export function ExplainerGenerator() {
  const [loading, setLoading] = useState<LoadingState>({});
  const [textResult, setTextResult] = useState('');
  const [visualResult, setVisualResult] = useState('');
  const { toast } = useToast();
  const { speak, isSpeaking } = useTTS();

  const handleTextGeneration = async (data: any) => {
    setLoading(prev => ({...prev, text: true}));
    setTextResult('');
    try {
        const result = await generateCulturallyRelevantContent({
            ...data,
            contentType: 'explanation',
            culture: 'general', // Explanations are general
        });
        setTextResult(result.content);
    } catch (error) {
        console.error("Generation failed:", error);
        toast({ title: "Generation Failed", variant: "destructive" })
    } finally {
        setLoading(prev => ({...prev, text: false}));
    }
  }

  const handleVisualGeneration = async (data: any) => {
    setLoading(prev => ({...prev, visual: true}));
    setVisualResult('');
    try {
        const result = await generateVisualAid(data);
        setVisualResult(result.visualAidDataUri);
    } catch (error) {
        console.error("Generation failed:", error);
        toast({ title: "Generation Failed", variant: "destructive" })
    } finally {
        setLoading(prev => ({...prev, visual: false}));
    }
  }

  const handleTextSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    handleTextGeneration(data);
  }

  const handleVisualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    handleVisualGeneration(data);
  }

  return (
    <Tabs defaultValue="text" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="text">Text Explainer</TabsTrigger>
        <TabsTrigger value="visual">Visual Explainer</TabsTrigger>
      </TabsList>
      <TabsContent value="text">
        <Card>
          <CardHeader>
            <CardTitle>Text Explainer</CardTitle>
            <CardDescription>Get a simple text-based explanation for any topic.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTextSubmit} className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="text-topic">Topic</Label>
                        <Input id="text-topic" name="topic" placeholder="e.g., Photosynthesis" required/>
                    </div>
                    <div>
                        <Label htmlFor="text-gradeLevel">Grade Level</Label>
                        <Input id="text-gradeLevel" name="gradeLevel" placeholder="e.g., Grade 7" required/>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <Label htmlFor="text-language">Language</Label>
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
                </div>
              <Button type="submit" disabled={loading['text']} className="gap-2">
                {loading['text'] ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4" />}
                Generate Explanation
              </Button>
            </form>
             {textResult && (
              <div className="mt-6 p-4 border rounded-lg bg-secondary/50 relative">
                <h4 className="font-bold mb-2">Generated Explanation</h4>
                <p className="whitespace-pre-wrap">{textResult}</p>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => speak(textResult)} disabled={isSpeaking}>
                    <Volume2 className="h-5 w-5"/>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
       <TabsContent value="visual">
        <Card>
          <CardHeader>
            <CardTitle>Visual Explainer</CardTitle>
            <CardDescription>Generate a simple drawing or chart to explain a topic.</CardDescription>
          </CardHeader>
          <CardContent>
             <form onSubmit={handleVisualSubmit} className="space-y-4">
               <div className="space-y-4">
                    <div>
                        <Label htmlFor="visual-topic">Topic</Label>
                        <Input id="visual-topic" name="topic" placeholder="e.g., Water Cycle" required/>
                    </div>
                    <div>
                        <Label htmlFor="visual-type">Visual Aid Type</Label>
                        <Select name="type" required>
                            <SelectTrigger><SelectValue placeholder="Select aid type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="line drawing">Line Drawing</SelectItem>
                                <SelectItem value="chart">Chart</SelectItem>
                                <SelectItem value="blackboard explanation">Blackboard Explanation</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="visual-details">Details</Label>
                        <Textarea id="visual-details" name="details" placeholder="e.g., A simple diagram showing evaporation, condensation, and precipitation." required/>
                    </div>
                </div>
              <Button type="submit" disabled={loading['visual']} className="gap-2">
                {loading['visual'] ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4" />}
                Generate Visual
              </Button>
            </form>
             {visualResult && (
              <div className="mt-6 p-4 border rounded-lg bg-secondary/50">
                <h4 className="font-bold mb-2">Generated Visual</h4>
                <img src={visualResult} alt="Generated visual aid" className="rounded-md border max-w-full h-auto" />
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
