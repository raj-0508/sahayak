"use client";

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw, Info, AlertTriangle, XCircle } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

interface Log {
  _id: string;
  user_id?: {
    _id: string;
    name: string;
    email: string;
  };
  level: 'INFO' | 'WARN' | 'ERROR';
  action?: string;
  message: string;
  timestamp: string;
}

const levelColors: Record<string, string> = {
  INFO: 'bg-blue-100 text-blue-800',
  WARN: 'bg-yellow-100 text-yellow-800',
  ERROR: 'bg-red-100 text-red-800',
};

const levelIcons: Record<string, React.ElementType> = {
  INFO: Info,
  WARN: AlertTriangle,
  ERROR: XCircle,
};

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/logs');
      const data = await response.json();
      if (response.ok) {
        setLogs(data.logs || []);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch logs",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.message.toLowerCase().includes(filter.toLowerCase()) ||
      log.action?.toLowerCase().includes(filter.toLowerCase()) ||
      log.user_id?.name.toLowerCase().includes(filter.toLowerCase()) ||
      log.user_id?.email.toLowerCase().includes(filter.toLowerCase());
    
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
    
    return matchesSearch && matchesLevel;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getLevelIcon = (level: string) => {
    const Icon = levelIcons[level] || Info;
    return <Icon className="h-3 w-3 mr-1" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Logs</h1>
          <p className="text-muted-foreground">View system activity and audit logs.</p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Logs</h1>
        <p className="text-muted-foreground">View system activity and audit logs.</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Activity Logs ({filteredLogs.length})</span>
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Input 
              placeholder="Search logs..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="max-w-sm"
            />
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="INFO">INFO</SelectItem>
                <SelectItem value="WARN">WARN</SelectItem>
                <SelectItem value="ERROR">ERROR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      {log.user_id ? (
                        <div>
                          <div className="font-medium text-sm">{log.user_id.name}</div>
                          <div className="text-xs text-muted-foreground">{log.user_id.email}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">System</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={`${levelColors[log.level] || 'bg-gray-100 text-gray-800'} flex items-center w-fit`}
                      >
                        {getLevelIcon(log.level)}
                        {log.level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {log.action ? (
                        <Badge variant="outline">{log.action}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">
                      {log.message}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
