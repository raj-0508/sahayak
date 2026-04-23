"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Gamepad2, 
  Brain, 
  HelpCircle, 
  Loader2, 
  Sparkles, 
  Trophy,
  CheckCircle,
  XCircle,
  RotateCcw,
  Lightbulb
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createInteractiveLearningGames } from "@/ai/flows/create-interactive-learning-games";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface MemoryCard {
  id: number;
  content: string;
  matched: boolean;
  flipped: boolean;
}

interface GameResult {
  score: number;
  total: number;
  timeTaken?: number;
}

export default function GamesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("quiz");
  const [loading, setLoading] = useState(false);
  const [gameData, setGameData] = useState<any>(null);
  
  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>([]);
  
  // Memory game state
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  
  // Form state
  const [formData, setFormData] = useState({
    topic: '',
    subject: '',
    gradeLevel: '',
    difficulty: 'medium',
    language: 'English',
  });

  const generateQuiz = async () => {
    if (!formData.topic || !formData.subject || !formData.gradeLevel) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await createInteractiveLearningGames({
        topic: formData.topic,
        subject: formData.subject,
        gradeLevel: formData.gradeLevel,
        gameType: 'quiz',
        difficultyLevel: formData.difficulty,
        language: formData.language,
      });

      // Parse the generated game content
      const gameContent = JSON.parse(result.gameContent);
      setQuizQuestions(gameContent.questions || []);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setQuizScore(0);
      setAnsweredQuestions([]);
      setGameData(result);

      toast({
        title: "Quiz Generated!",
        description: `Created ${gameContent.questions?.length || 0} questions on ${formData.topic}`,
      });
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMemoryGame = async () => {
    if (!formData.topic || !formData.subject || !formData.gradeLevel) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await createInteractiveLearningGames({
        topic: formData.topic,
        subject: formData.subject,
        gradeLevel: formData.gradeLevel,
        gameType: 'memory',
        difficultyLevel: formData.difficulty,
        language: formData.language,
      });

      const gameContent = JSON.parse(result.gameContent);
      const pairs = gameContent.pairs || [];
      
      // Create cards from pairs
      const cards: MemoryCard[] = [];
      pairs.forEach((pair: { term: string; definition: string }, index: number) => {
        cards.push({ id: index * 2, content: pair.term, matched: false, flipped: false });
        cards.push({ id: index * 2 + 1, content: pair.definition, matched: false, flipped: false });
      });
      
      // Shuffle cards
      setMemoryCards(cards.sort(() => Math.random() - 0.5));
      setFlippedCards([]);
      setMatchedPairs(0);
      setMoves(0);
      setGameData(result);

      toast({
        title: "Memory Game Generated!",
        description: `Created ${pairs.length} pairs on ${formData.topic}`,
      });
    } catch (error) {
      console.error('Failed to generate memory game:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate memory game. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (answeredQuestions[currentQuestion]) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === quizQuestions[currentQuestion].correctAnswer;
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
    }

    const newAnswered = [...answeredQuestions];
    newAnswered[currentQuestion] = true;
    setAnsweredQuestions(newAnswered);
    setShowResult(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handleCardClick = (cardId: number) => {
    if (flippedCards.length === 2) return;
    if (memoryCards.find(c => c.id === cardId)?.matched) return;
    if (flippedCards.includes(cardId)) return;

    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(prev => prev + 1);
      const [first, second] = newFlipped;
      const firstCard = memoryCards.find(c => c.id === first);
      const secondCard = memoryCards.find(c => c.id === second);

      // Check if they're a pair (one is term, one is definition with same base index)
      const firstPairId = Math.floor(first / 2);
      const secondPairId = Math.floor(second / 2);

      if (firstPairId === secondPairId) {
        // Match found
        setTimeout(() => {
          setMemoryCards(prev => prev.map(c => 
            c.id === first || c.id === second ? { ...c, matched: true } : c
          ));
          setMatchedPairs(prev => prev + 1);
          setFlippedCards([]);
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setQuizScore(0);
    setAnsweredQuestions([]);
  };

  const resetMemory = () => {
    setMemoryCards(prev => prev.map(c => ({ ...c, matched: false, flipped: false })).sort(() => Math.random() - 0.5));
    setFlippedCards([]);
    setMatchedPairs(0);
    setMoves(0);
  };

  const quizComplete = quizQuestions.length > 0 && answeredQuestions.filter(Boolean).length === quizQuestions.length;
  const memoryComplete = memoryCards.length > 0 && matchedPairs === memoryCards.length / 2;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Learning Games</h1>
        <p className="text-muted-foreground">Engage with fun, AI-generated games to boost your learning.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quiz" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            Quiz Game
          </TabsTrigger>
          <TabsTrigger value="memory" className="gap-2">
            <Brain className="h-4 w-4" />
            Memory Game
          </TabsTrigger>
          <TabsTrigger value="word" className="gap-2">
            <Gamepad2 className="h-4 w-4" />
            Word Game
          </TabsTrigger>
        </TabsList>

        {/* Quiz Tab */}
        <TabsContent value="quiz" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Generator Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Generate Quiz
                </CardTitle>
                <CardDescription>Create an AI-powered quiz on any topic</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="quiz-topic">Topic *</Label>
                  <Input
                    id="quiz-topic"
                    placeholder="e.g., Photosynthesis"
                    value={formData.topic}
                    onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="quiz-subject">Subject *</Label>
                  <Input
                    id="quiz-subject"
                    placeholder="e.g., Science"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="quiz-grade">Grade Level *</Label>
                  <Input
                    id="quiz-grade"
                    placeholder="e.g., Grade 8"
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, gradeLevel: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <Select 
                    value={formData.difficulty} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, difficulty: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Language</Label>
                  <Select 
                    value={formData.language} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, language: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                      <SelectItem value="Tamil">Tamil</SelectItem>
                      <SelectItem value="Telugu">Telugu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={generateQuiz} disabled={loading} className="w-full gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate Quiz
                </Button>
              </CardFooter>
            </Card>

            {/* Quiz Game Area */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Quiz Game</CardTitle>
                  {quizQuestions.length > 0 && (
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">
                        Question {currentQuestion + 1} of {quizQuestions.length}
                      </Badge>
                      <Badge variant="secondary">
                        <Trophy className="h-3 w-3 mr-1" />
                        Score: {quizScore}/{answeredQuestions.filter(Boolean).length}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {quizQuestions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Generate a quiz to start playing!</p>
                  </div>
                ) : quizComplete ? (
                  <div className="text-center py-12">
                    <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
                    <h3 className="text-2xl font-bold mb-2">Quiz Complete!</h3>
                    <p className="text-lg mb-4">
                      You scored <span className="font-bold text-primary">{quizScore}</span> out of <span className="font-bold">{quizQuestions.length}</span>
                    </p>
                    <p className="text-muted-foreground mb-6">
                      {quizScore === quizQuestions.length ? "Perfect score! 🎉" : 
                       quizScore >= quizQuestions.length * 0.7 ? "Great job! 👍" : 
                       "Keep practicing! 💪"}
                    </p>
                    <Button onClick={resetQuiz} className="gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 bg-secondary rounded-lg">
                      <p className="text-lg font-medium">{quizQuestions[currentQuestion]?.question}</p>
                    </div>
                    <div className="grid gap-3">
                      {quizQuestions[currentQuestion]?.options.map((option, index) => (
                        <Button
                          key={index}
                          variant={selectedAnswer === index ? "default" : "outline"}
                          className={`justify-start h-auto py-3 px-4 text-left ${
                            showResult && index === quizQuestions[currentQuestion].correctAnswer
                              ? 'bg-green-100 border-green-500 text-green-800'
                              : showResult && selectedAnswer === index && index !== quizQuestions[currentQuestion].correctAnswer
                              ? 'bg-red-100 border-red-500 text-red-800'
                              : ''
                          }`}
                          onClick={() => handleAnswerSelect(index)}
                          disabled={showResult}
                        >
                          <span className="mr-3 font-bold">{String.fromCharCode(65 + index)}.</span>
                          {option}
                          {showResult && index === quizQuestions[currentQuestion].correctAnswer && (
                            <CheckCircle className="ml-auto h-5 w-5 text-green-600" />
                          )}
                          {showResult && selectedAnswer === index && index !== quizQuestions[currentQuestion].correctAnswer && (
                            <XCircle className="ml-auto h-5 w-5 text-red-600" />
                          )}
                        </Button>
                      ))}
                    </div>
                    {showResult && quizQuestions[currentQuestion]?.explanation && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start gap-2">
                          <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-blue-800">Explanation</p>
                            <p className="text-blue-700 text-sm">{quizQuestions[currentQuestion].explanation}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      {!showResult ? (
                        <Button onClick={handleSubmitAnswer} disabled={selectedAnswer === null}>
                          Submit Answer
                        </Button>
                      ) : (
                        <Button onClick={handleNextQuestion}>
                          {currentQuestion < quizQuestions.length - 1 ? 'Next Question' : 'See Results'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Memory Tab */}
        <TabsContent value="memory" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Generate Memory Game
                </CardTitle>
                <CardDescription>Match terms with their definitions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="memory-topic">Topic *</Label>
                  <Input
                    id="memory-topic"
                    placeholder="e.g., Solar System"
                    value={formData.topic}
                    onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="memory-subject">Subject *</Label>
                  <Input
                    id="memory-subject"
                    placeholder="e.g., Science"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="memory-grade">Grade Level *</Label>
                  <Input
                    id="memory-grade"
                    placeholder="e.g., Grade 6"
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, gradeLevel: e.target.value }))}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={generateMemoryGame} disabled={loading} className="w-full gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate Game
                </Button>
              </CardFooter>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Memory Game</CardTitle>
                  {memoryCards.length > 0 && (
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">Moves: {moves}</Badge>
                      <Badge variant="secondary">
                        Matched: {matchedPairs}/{memoryCards.length / 2}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={resetMemory}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {memoryCards.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Generate a memory game to start playing!</p>
                  </div>
                ) : memoryComplete ? (
                  <div className="text-center py-12">
                    <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
                    <h3 className="text-2xl font-bold mb-2">Congratulations!</h3>
                    <p className="text-lg mb-4">You found all pairs in <span className="font-bold text-primary">{moves}</span> moves!</p>
                    <Button onClick={resetMemory} className="gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Play Again
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    {memoryCards.map((card) => (
                      <button
                        key={card.id}
                        onClick={() => handleCardClick(card.id)}
                        className={`aspect-square p-2 rounded-lg border-2 transition-all text-sm font-medium ${
                          card.matched
                            ? 'bg-green-100 border-green-500 text-green-800'
                            : flippedCards.includes(card.id)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-secondary hover:bg-secondary/80 border-transparent'
                        }`}
                        disabled={card.matched}
                      >
                        {card.matched || flippedCards.includes(card.id) ? card.content : '?'}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Word Game Tab */}
        <TabsContent value="word" className="mt-6">
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Gamepad2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Word Games Coming Soon!</h3>
                <p>Word scramble, crossword, and fill-in-the-blank games are being developed.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
