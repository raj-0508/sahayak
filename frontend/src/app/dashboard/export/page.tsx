"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, Loader2, FileSpreadsheet, Users, BookOpen, GraduationCap, ScrollText, BarChart } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

interface ExportOption {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  endpoint: string;
}

const exportOptions: ExportOption[] = [
  {
    id: 'users',
    label: 'Users',
    description: 'Export all user accounts including teachers, students, and admins',
    icon: Users,
    endpoint: '/api/export/users',
  },
  {
    id: 'subjects',
    label: 'Subjects',
    description: 'Export all subjects and their details',
    icon: BookOpen,
    endpoint: '/api/export/subjects',
  },
  {
    id: 'classes',
    label: 'Classes',
    description: 'Export all classes with teacher and student information',
    icon: GraduationCap,
    endpoint: '/api/export/classes',
  },
  {
    id: 'content',
    label: 'Generated Content',
    description: 'Export all AI-generated content (worksheets, tests, explainers)',
    icon: FileSpreadsheet,
    endpoint: '/api/export/content',
  },
  {
    id: 'progress',
    label: 'Student Progress',
    description: 'Export progress tracking data for all students',
    icon: BarChart,
    endpoint: '/api/export/progress',
  },
  {
    id: 'logs',
    label: 'System Logs',
    description: 'Export system activity and audit logs',
    icon: ScrollText,
    endpoint: '/api/export/logs',
  },
];

export default function ExportPage() {
  const [selectedExports, setSelectedExports] = useState<string[]>([]);
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [exporting, setExporting] = useState<string | null>(null);
  const { toast } = useToast();

  const toggleExport = (id: string) => {
    setSelectedExports(prev => 
      prev.includes(id) 
        ? prev.filter(e => e !== id)
        : [...prev, id]
    );
  };

  const downloadFile = (data: any, filename: string, type: string) => {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (option: ExportOption) => {
    setExporting(option.id);
    try {
      const response = await fetch(`${option.endpoint}?format=${format}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Export failed');
      }

      const contentType = response.headers.get('content-type');
      const timestamp = new Date().toISOString().split('T')[0];
      
      if (format === 'csv') {
        const text = await response.text();
        downloadFile(text, `${option.id}_${timestamp}.csv`, 'text/csv');
      } else {
        const data = await response.json();
        downloadFile(JSON.stringify(data, null, 2), `${option.id}_${timestamp}.json`, 'application/json');
      }

      toast({
        title: "Export Successful",
        description: `${option.label} exported as ${format.toUpperCase()}`,
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export data",
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  const handleExportSelected = async () => {
    for (const id of selectedExports) {
      const option = exportOptions.find(o => o.id === id);
      if (option) {
        await handleExport(option);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Export</h1>
        <p className="text-muted-foreground">Export data from the system in CSV or JSON format.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Settings</CardTitle>
          <CardDescription>Choose your preferred export format</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label>Format:</Label>
            <Select value={format} onValueChange={(value: 'csv' | 'json') => setFormat(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                <SelectItem value="json">JSON (Data)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {exportOptions.map((option) => (
          <Card key={option.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <option.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{option.label}</CardTitle>
                    <CardDescription className="text-sm mt-1">{option.description}</CardDescription>
                  </div>
                </div>
                <Checkbox
                  checked={selectedExports.includes(option.id)}
                  onCheckedChange={() => toggleExport(option.id)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => handleExport(option)}
                disabled={exporting === option.id}
              >
                {exporting === option.id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export {option.label}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedExports.length > 0 && (
        <Card className="border-primary">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{selectedExports.length} items selected</p>
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedExports.map(id => 
                    exportOptions.find(o => o.id === id)?.label
                  ).join(', ')}
                </p>
              </div>
              <Button onClick={handleExportSelected} disabled={exporting !== null}>
                {exporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export Selected
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
