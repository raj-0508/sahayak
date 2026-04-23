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
import { generateDifferentiatedWorksheets } from "@/ai/flows/generate-differentiated-worksheets";
import { useTTS } from "@/hooks/use-tts";

export function WorksheetGenerator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const { toast } = useToast();
  const { speak, isSpeaking } = useTTS();

  const handleGeneration = async (data: any) => {
    setLoading(true);
    setResult('');
    try {
        const worksheetResult = await generateDifferentiatedWorksheets(data);
        const formattedResult = worksheetResult.worksheets.join('\n\n---\n\n');
        setResult(formattedResult);
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
        <CardTitle>Differentiated Worksheets</CardTitle>
        <CardDescription>Create tests and worksheets with multiple difficulty levels.</CardDescription>
      </CardHeader>
      <CardContent>
         <form onSubmit={handleSubmit} className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="worksheet-topic">Topic</Label>
                    <Input id="worksheet-topic" name="topic" placeholder="e.g., Fractions" required/>
                </div>
                <div>
                    <Label htmlFor="worksheet-language">Language</Label>
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
                    <Label htmlFor="worksheet-difficultyLevels">Difficulty Levels (1-3)</Label>
                    <Input id="worksheet-difficultyLevels" name="difficultyLevels" type="number" min="1" max="3" defaultValue="3" required/>
                </div>
                <div>
                    <Label htmlFor="worksheet-studentLevel">Student Level</Label>
                    <Select name="studentLevel" required>
                        <SelectTrigger><SelectValue placeholder="Select student level" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Sparkles className="h-4 w-4" />}
            Generate Worksheets
          </Button>
        </form>
         {result && (
          <div className="mt-6 p-4 border rounded-lg bg-secondary/50 relative">
            <h4 className="font-bold mb-2">Generated Worksheets</h4>
            <div className="whitespace-pre-wrap">{result}</div>
             <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => speak(result)} disabled={isSpeaking}>
                <Volume2 className="h-5 w-5"/>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
