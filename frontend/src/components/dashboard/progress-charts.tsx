"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Line, LineChart, Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
  } from "@/components/ui/chart";
import { progressReports as mockProgressReports } from "@/lib/data";

type ProgressChartsProps = {
  studentId: string;
};

export function ProgressCharts({ studentId }: ProgressChartsProps) {
  const studentProgress = mockProgressReports.filter(
    (r) => r.studentId === studentId
  );

  const chartData = studentProgress.map(report => ({
    name: report.gameName.split(" ")[0],
    score: report.score,
    date: new Date(report.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));

  const scoreDistributionData = [
    { range: '0-60', count: studentProgress.filter(r => r.score <= 60).length, fill: "hsl(var(--destructive))" },
    { range: '61-80', count: studentProgress.filter(r => r.score > 60 && r.score <= 80).length, fill: "hsl(var(--chart-4))" },
    { range: '81-100', count: studentProgress.filter(r => r.score > 80).length, fill: "hsl(var(--chart-2))" },
  ].filter(d => d.count > 0);

  if (studentProgress.length === 0) {
      return (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-lg font-semibold text-muted-foreground">No progress data available.</h3>
            <p className="text-sm text-muted-foreground">Complete some activities to see your progress.</p>
        </div>
      )
  }

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Performance Over Time</CardTitle>
          <CardDescription>Scores from recent activities.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[300px] w-full">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend />
              <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Score Distribution</CardTitle>
          <CardDescription>Breakdown of scores across all activities.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
        <ChartContainer config={{}} className="h-[300px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="count" />} />
              <Pie data={scoreDistributionData} dataKey="count" nameKey="range" />
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
