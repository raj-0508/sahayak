import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import type { Class } from "@/lib/data";
  import type { User } from "@/lib/auth";
  import { Badge } from "../ui/badge";
  
  type ClassCardProps = {
    classData: Class;
    role: User['user_type'];
  };
  
  export function ClassCard({ classData, role }: ClassCardProps) {
    return (
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>{classData.class_name}</CardTitle>
          <CardDescription>
            {classData.teacher_name ? `Taught by ${classData.teacher_name}` : "Unknown Teacher"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <Badge variant="outline">{classData.subject_id}</Badge>
          <p className="mt-4 text-sm text-muted-foreground">{classData.description}</p>
        </CardContent>
        <CardFooter>
          <Button className="w-full">
            {role === 'teacher' ? 'Manage Class' : 'View Details'}
          </Button>
        </CardFooter>
      </Card>
    );
  }
  