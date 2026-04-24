"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, School, ClipboardList, CheckCircle, Clock, BarChart, BookOpen, Target } from "lucide-react";
import type { User } from "@/lib/auth";
import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type StatsCardsProps = {
    userType: User['user_type'];
};

type Stats = {
    totalUsers: number;
    totalTeachers: number;
    totalStudents: number;
    totalClasses: number;
    pendingRequests: number;
    enrolledClasses: number;
    testsCompleted: number;
    avgScore: string;
};

const StatCard = ({ title, value, icon: Icon, color = "primary" }: { title: string, value: string | number, icon: React.ElementType, color?: string }) => (
    <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group">
        <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}/10 rounded-full blur-2xl group-hover:scale-150 transition-transform`}></div>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <div className={`h-10 w-10 rounded-xl bg-${color}/10 flex items-center justify-center`}>
                <Icon className={`h-5 w-5 text-${color}`} />
            </div>
        </CardHeader>
        <CardContent>
            <div className="text-3xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

export function StatsCards({ userType }: StatsCardsProps) {
    const [stats, setStats] = useState<Stats>({
        totalUsers: 0,
        totalTeachers: 0,
        totalStudents: 0,
        totalClasses: 0,
        pendingRequests: 0,
        enrolledClasses: 0,
        testsCompleted: 0,
        avgScore: 'N/A',
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                // Fetch classes
                const classesData = await apiGet('/api/classes');
                const classCount = classesData.classes?.length || 0;

                // Fetch join requests
                const requestsData = await apiGet('/api/join-requests');
                const pendingCount = requestsData.requests?.filter((r: any) => r.status === 'pending').length || 0;

                if (userType === 'admin') {
                    // Fetch users for admin
                    const usersData = await apiGet('/api/users');
                    const users = usersData.users || [];
                    
                    setStats({
                        ...stats,
                        totalUsers: users.length,
                        totalTeachers: users.filter((u: any) => u.user_type === 'teacher').length,
                        totalStudents: users.filter((u: any) => u.user_type === 'student').length,
                        totalClasses: classCount,
                        pendingRequests: pendingCount,
                    });
                } else if (userType === 'teacher') {
                    setStats({
                        ...stats,
                        totalClasses: classCount,
                        pendingRequests: pendingCount,
                    });
                } else {
                    setStats({
                        ...stats,
                        enrolledClasses: classCount,
                    });
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, [userType]);

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                    <Card key={i} className="border-border/50 bg-card/80">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 w-12 bg-muted animate-pulse rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (userType === 'admin') {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Users" value={stats.totalUsers} icon={Users} color="primary" />
                <StatCard title="Teachers" value={stats.totalTeachers} icon={BookOpen} color="accent" />
                <StatCard title="Students" value={stats.totalStudents} icon={Users} color="chart-3" />
                <StatCard title="Total Classes" value={stats.totalClasses} icon={School} color="chart-4" />
            </div>
        );
    }

    if (userType === 'teacher') {
        return (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Your Classes" value={stats.totalClasses} icon={School} color="primary" />
                <StatCard title="Pending Requests" value={stats.pendingRequests} icon={Clock} color="accent" />
                <StatCard title="Content Shared" value={0} icon={BookOpen} color="chart-3" />
                <StatCard title="Tests Created" value={0} icon={ClipboardList} color="chart-4" />
            </div>
        );
    }

    if (userType === 'student') {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Enrolled Classes" value={stats.enrolledClasses} icon={School} color="primary" />
                <StatCard title="Tests Available" value={0} icon={ClipboardList} color="accent" />
                <StatCard title="Completed Tests" value={0} icon={CheckCircle} color="chart-3" />
                <StatCard title="Average Score" value={stats.avgScore} icon={Target} color="chart-4" />
            </div>
        );
    }
    
    return null;
}
