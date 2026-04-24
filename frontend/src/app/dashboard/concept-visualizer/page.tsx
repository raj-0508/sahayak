"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Sparkles, 
  Network,
  FileText,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Lightbulb,
  Upload,
  File,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiPost } from "@/lib/api";

interface ConceptNode {
  id: string;
  label: string;
  description: string;
  level: number;
  color: string;
  x?: number;
  y?: number;
}

interface ConceptEdge {
  from: string;
  to: string;
  label: string;
  arrows?: string;
}

interface ConceptMap {
  title: string;
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

const SAMPLE_TOPICS = [
  "Photosynthesis in Plants",
  "Water Cycle",
  "Indian Independence Movement",
  "Solar System",
  "Food Chain and Food Web",
  "Human Digestive System",
];

export default function ConceptVisualizerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [topic, setTopic] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [conceptMap, setConceptMap] = useState<ConceptMap | null>(null);
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<ConceptNode | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [ragSource, setRagSource] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({ title: "Error", description: "Please upload a PDF file", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "File size must be less than 10MB", variant: "destructive" });
      return;
    }

    setUploadedFile(file);
    setExtracting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const data = await apiPost('/api/extract-pdf', formData);

      setExtractedText(data.text);
      toast({ title: "Success", description: "PDF text extracted successfully!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to extract text from PDF", variant: "destructive" });
      setUploadedFile(null);
    } finally {
      setExtracting(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setExtractedText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateConceptMap = async (topicText?: string) => {
    const inputTopic = topicText || topic;
    if (!inputTopic.trim() && !extractedText.trim()) {
      toast({ title: "Error", description: "Please enter a topic or upload a PDF file", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    setSelectedNode(null);
    setRagSource(null);
    
    try {
      const data = await apiPost('/api/concept-visualizer', {
        topic: inputTopic || undefined,
        text: extractedText.trim() || undefined,
        useRag: !!inputTopic && !extractedText.trim(),
      });
      
      if (data.warning) {
        toast({ title: "Note", description: data.warning, variant: "default" });
      }

      if (data.ragSource) {
        setRagSource(data.ragSource);
      }
      
      const positionedMap = addNodePositions(data.conceptMap);
      setConceptMap(positionedMap);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate concept map", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addNodePositions = (map: ConceptMap): ConceptMap => {
    const canvas = canvasRef.current;
    const centerX = (canvas?.width || 800) / 2;
    const centerY = (canvas?.height || 600) / 2;
    
    const levels: { [key: number]: ConceptNode[] } = {};
    map.nodes.forEach(node => {
      if (!levels[node.level]) levels[node.level] = [];
      levels[node.level].push(node);
    });
    
    const positionedNodes = map.nodes.map(node => {
      const levelNodes = levels[node.level];
      const nodeIndex = levelNodes.indexOf(node);
      const totalInLevel = levelNodes.length;
      
      if (node.level === 0) {
        return { ...node, x: centerX, y: centerY };
      }
      
      const radius = node.level * 150;
      const angleStep = (2 * Math.PI) / totalInLevel;
      const startAngle = -Math.PI / 2;
      const angle = startAngle + nodeIndex * angleStep;
      
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });
    
    return { ...map, nodes: positionedNodes };
  };

  const drawConceptMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !conceptMap) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // WHITE background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    
    // Draw edges
    ctx.lineWidth = 2;
    conceptMap.edges.forEach(edge => {
      const fromNode = conceptMap.nodes.find(n => n.id === edge.from);
      const toNode = conceptMap.nodes.find(n => n.id === edge.to);
      
      if (fromNode?.x && fromNode?.y && toNode?.x && toNode?.y) {
        ctx.beginPath();
        ctx.strokeStyle = '#94a3b8';
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
        
        const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
        const arrowX = toNode.x - 40 * Math.cos(angle);
        const arrowY = toNode.y - 40 * Math.sin(angle);
        
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - 10 * Math.cos(angle - Math.PI / 6), arrowY - 10 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(arrowX - 10 * Math.cos(angle + Math.PI / 6), arrowY - 10 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = '#94a3b8';
        ctx.fill();
        
        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2;
        ctx.font = '11px Arial';
        const labelWidth = ctx.measureText(edge.label).width + 8;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(midX - labelWidth/2, midY - 12, labelWidth, 16);
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText(edge.label, midX, midY);
      }
    });
    
    // Draw nodes
    conceptMap.nodes.forEach(node => {
      if (node.x === undefined || node.y === undefined) return;
      
      const isSelected = selectedNode?.id === node.id;
      const radius = node.level === 0 ? 50 : 35;
      
      // Shadow
      ctx.beginPath();
      ctx.arc(node.x + 2, node.y + 2, radius, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      ctx.fill();
      
      // Node
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();
      
      if (isSelected) {
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
      }
      ctx.stroke();
      
      // Label
      ctx.font = node.level === 0 ? 'bold 12px Arial' : '11px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const words = node.label.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      
      words.forEach(word => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(testLine).width > radius * 1.5) {
          if (currentLine) lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      });
      if (currentLine) lines.push(currentLine);
      
      const lineHeight = 12;
      const startY = node.y - ((lines.length - 1) * lineHeight) / 2;
      
      lines.forEach((line, i) => {
        ctx.fillText(line, node.x!, startY + i * lineHeight);
      });
    });
    
    ctx.restore();
  }, [conceptMap, zoom, pan, selectedNode]);

  useEffect(() => {
    drawConceptMap();
  }, [drawConceptMap]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const container = canvas.parentElement;
        if (container) {
          canvas.width = container.clientWidth;
          canvas.height = container.clientHeight;
          if (conceptMap) {
            setConceptMap(addNodePositions(conceptMap));
          }
        }
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    
    const clickedNode = conceptMap?.nodes.find(node => {
      if (node.x === undefined || node.y === undefined) return false;
      const radius = node.level === 0 ? 50 : 35;
      const dx = x - node.x;
      const dy = y - node.y;
      return dx * dx + dy * dy <= radius * radius;
    });
    
    if (clickedNode) {
      setSelectedNode(clickedNode);
    } else {
      setSelectedNode(null);
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(Math.max(prev * delta, 0.5), 3));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = `concept-map-${conceptMap?.title || 'diagram'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!user) return null;

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Network className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-headline">Concept Visualizer</h1>
            <p className="text-muted-foreground">Transform topics or PDFs into visual concept maps</p>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Input</CardTitle>
            <CardDescription>Enter a topic or upload a PDF file</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <Tabs defaultValue="topic" className="flex-1 flex flex-col">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="topic">Search Topic</TabsTrigger>
                <TabsTrigger value="pdf">Upload PDF</TabsTrigger>
              </TabsList>
              
              <TabsContent value="topic" className="flex-1 flex flex-col mt-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="topic">Topic Name</Label>
                    <Input
                      id="topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Photosynthesis"
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      We'll search your curriculum files first, then enhance with AI
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" />
                      Quick Topics:
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {SAMPLE_TOPICS.map((t, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                          onClick={() => {
                            setTopic(t);
                            generateConceptMap(t);
                          }}
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => generateConceptMap()} 
                  disabled={loading || !topic.trim()}
                  className="w-full mt-4 gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate from Topic
                </Button>
              </TabsContent>
              
              <TabsContent value="pdf" className="flex-1 flex flex-col mt-4">
                <div className="space-y-4 flex-1">
                  <div>
                    <Label>Upload PDF File</Label>
                    <div className="mt-2">
                      {!uploadedFile ? (
                        <div
                          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                          <p className="text-xs text-muted-foreground mt-1">PDF files up to 10MB</p>
                        </div>
                      ) : (
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <File className="h-8 w-8 text-red-500" />
                              <div>
                                <p className="font-medium text-sm truncate max-w-[150px]">{uploadedFile.name}</p>
                                <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={removeFile} disabled={extracting}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          {extracting && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Extracting text...
                            </div>
                          )}
                          {extractedText && (
                            <div className="mt-3">
                              <Badge variant="secondary" className="gap-1">
                                <FileText className="h-3 w-3" />
                                {extractedText.split(' ').length} words extracted
                              </Badge>
                            </div>
                          )}
                        </div>
                      )}
                      <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => generateConceptMap()} 
                  disabled={loading || !extractedText.trim()}
                  className="w-full mt-4 gap-2"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate from PDF
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 flex flex-col min-h-0">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">{conceptMap?.title || 'Concept Map'}</CardTitle>
              <CardDescription>
                {conceptMap ? (
                  <span>
                    {conceptMap.nodes.length} concepts, {conceptMap.edges.length} connections
                    {ragSource && <Badge variant="outline" className="ml-2 text-xs">Source: {ragSource}</Badge>}
                  </span>
                ) : 'Generate a concept map to visualize'}
              </CardDescription>
            </div>
            
            {conceptMap && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(z + 0.2, 3))}><ZoomIn className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}><ZoomOut className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" onClick={resetView}><Maximize2 className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" onClick={downloadImage}><Download className="h-4 w-4" /></Button>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="flex-1 p-0 relative min-h-0">
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-grab active:cursor-grabbing bg-white"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onWheel={handleCanvasWheel}
            />
            
            {!conceptMap && !loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <div className="text-center p-8">
                  <Network className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-muted-foreground">No Concept Map Yet</h3>
                  <p className="text-sm text-muted-foreground mt-1">Enter a topic or upload a PDF to generate a visual concept map</p>
                </div>
              </div>
            )}
            
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Generating concept map...</p>
                </div>
              </div>
            )}
            
            {selectedNode && (
              <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80">
                <Card className="shadow-lg">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedNode.color }} />
                      <CardTitle className="text-base">{selectedNode.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{selectedNode.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">Level {selectedNode.level}</Badge>
                      {selectedNode.level === 0 && <Badge>Main Concept</Badge>}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
