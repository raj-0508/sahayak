"use client";

import { StatsCards } from "@/components/dashboard/stats-cards";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, BookOpen, ScrollText, Download, School, FileText, Bot, Network, BarChart, ClipboardList, FolderOpen, Sparkles, FlaskConical } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-8 dashboard-overview-gradient min-h-full p-6 -m-6 rounded-lg">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 dark:from-primary/20 dark:via-accent/10 dark:to-primary/20 p-8 border border-border/50">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">Dashboard</span>
          </div>
          <h1 className="text-3xl font-bold font-headline gradient-text">Welcome back, {user.name.split(" ")[0]}!</h1>
          <p className="text-muted-foreground mt-2">Here's a summary of your activities and quick access to your tools.</p>
        </div>
      </div>

      {/* Stats */}
      <StatsCards userType={user.user_type} />

      {/* Quick Actions based on user type */}
      {user.user_type === 'admin' && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              Quick Actions
            </CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Link href="/dashboard/users">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/30 transition-all group">
                  <Users className="h-6 w-6 group-hover:scale-110 transition-transform text-primary" />
                  <span>Manage Users</span>
                </Button>
              </Link>
              <Link href="/dashboard/subjects">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-accent/5 hover:border-accent/30 transition-all group">
                  <BookOpen className="h-6 w-6 group-hover:scale-110 transition-transform text-accent" />
                  <span>Manage Subjects</span>
                </Button>
              </Link>
              <Link href="/dashboard/logs">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-chart-3/5 hover:border-chart-3/30 transition-all group">
                  <ScrollText className="h-6 w-6 group-hover:scale-110 transition-transform text-chart-3" />
                  <span>View Logs</span>
                </Button>
              </Link>
              <Link href="/dashboard/export">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-chart-4/5 hover:border-chart-4/30 transition-all group">
                  <Download className="h-6 w-6 group-hover:scale-110 transition-transform text-chart-4" />
                  <span>Export Data</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {user.user_type === 'teacher' && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              Quick Actions
            </CardTitle>
            <CardDescription>Start creating content for your students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Link href="/dashboard/classes">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/30 transition-all group">
                  <School className="h-6 w-6 group-hover:scale-110 transition-transform text-primary" />
                  <span>Manage Classes</span>
                </Button>
              </Link>
              <Link href="/dashboard/worksheets">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-accent/5 hover:border-accent/30 transition-all group">
                  <FileText className="h-6 w-6 group-hover:scale-110 transition-transform text-accent" />
                  <span>Generate Tests</span>
                </Button>
              </Link>
              <Link href="/dashboard/content">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-chart-3/5 hover:border-chart-3/30 transition-all group">
                  <FlaskConical className="h-6 w-6 group-hover:scale-110 transition-transform text-chart-3" />
                  <span>Analyze Content</span>
                </Button>
              </Link>
              <Link href="/dashboard/progress">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-chart-4/5 hover:border-chart-4/30 transition-all group">
                  <BarChart className="h-6 w-6 group-hover:scale-110 transition-transform text-chart-4" />
                  <span>View Analytics</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {user.user_type === 'student' && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              Quick Actions
            </CardTitle>
            <CardDescription>Jump into your learning activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Link href="/dashboard/classes">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/30 transition-all group">
                  <School className="h-6 w-6 group-hover:scale-110 transition-transform text-primary" />
                  <span>My Classes</span>
                </Button>
              </Link>
              <Link href="/dashboard/tests">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-accent/5 hover:border-accent/30 transition-all group">
                  <ClipboardList className="h-6 w-6 group-hover:scale-110 transition-transform text-accent" />
                  <span>Take Tests</span>
                </Button>
              </Link>
              <Link href="/dashboard/ask-ganesha">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-chart-3/5 hover:border-chart-3/30 transition-all group">
                  <Bot className="h-6 w-6 group-hover:scale-110 transition-transform text-chart-3" />
                  <span>Ask Ganesha</span>
                </Button>
              </Link>
              <Link href="/dashboard/concept-visualizer">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-chart-4/5 hover:border-chart-4/30 transition-all group">
                  <Network className="h-6 w-6 group-hover:scale-110 transition-transform text-chart-4" />
                  <span>Concept Map</span>
                </Button>
              </Link>
              <Link href="/dashboard/progress">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 hover:bg-chart-5/5 hover:border-chart-5/30 transition-all group">
                  <BarChart className="h-6 w-6 group-hover:scale-110 transition-transform text-chart-5" />
                  <span>My Progress</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

