"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User, Mail, Phone, BookOpen, GraduationCap, Calendar, Save } from "lucide-react";
import { apiPut } from "@/lib/api";

const GRADE_LEVELS = [
  { value: '1', label: 'Grade 1' },
  { value: '2', label: 'Grade 2' },
  { value: '3', label: 'Grade 3' },
  { value: '4', label: 'Grade 4' },
  { value: '5', label: 'Grade 5' },
  { value: '6', label: 'Grade 6' },
  { value: '7', label: 'Grade 7' },
  { value: '8', label: 'Grade 8' },
  { value: '9', label: 'Grade 9' },
  { value: '10', label: 'Grade 10' },
  { value: '11', label: 'Grade 11' },
  { value: '12', label: 'Grade 12' },
];

const LANGUAGES = [
  { value: 'English', label: 'English', code: 'en' },
  { value: 'Hindi', label: 'हिंदी (Hindi)', code: 'hi' },
  { value: 'Tamil', label: 'தமிழ் (Tamil)', code: 'ta' },
  { value: 'Telugu', label: 'తెలుగు (Telugu)', code: 'te' },
  { value: 'Kannada', label: 'ಕನ್ನಡ (Kannada)', code: 'kn' },
  { value: 'Malayalam', label: 'മലയാളം (Malayalam)', code: 'ml' },
  { value: 'Marathi', label: 'मराठी (Marathi)', code: 'mr' },
  { value: 'Bengali', label: 'বাংলা (Bengali)', code: 'bn' },
  { value: 'Gujarati', label: 'ગુજરાતી (Gujarati)', code: 'gu' },
  { value: 'Punjabi', label: 'ਪੰਜਾਬੀ (Punjabi)', code: 'pa' },
  { value: 'Odia', label: 'ଓଡ଼ିଆ (Odia)', code: 'or' },
  { value: 'Urdu', label: 'اردو (Urdu)', code: 'ur' }
];

export default function ProfilePage() {
  const { user, login } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    grade_level: '',
    teaching_grades: [] as string[],
    preferred_language: 'English'
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        grade_level: user.grade_level ? String(user.grade_level) : '',
        teaching_grades: user.teaching_grades ? user.teaching_grades.map(String) : [],
        preferred_language: user.preferred_language || 'English'
      });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`;
    }
    return name ? name.substring(0, 2) : 'U';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Make sure grade_level and teaching_grades match the expected API format if needed,
      // but since formData stores them as strings here, we shouldn't fail the typechecker.
      // Wait, formData types were initialized.
      const payload = {
        name: formData.name,
        phone: formData.phone,
        grade_level: formData.grade_level ? Number(formData.grade_level) : undefined,
        teaching_grades: formData.teaching_grades.map(g => Number(g)),
        preferred_language: formData.preferred_language
      };

      await apiPut('/api/auth/me', payload);
      
      toast({
        title: "Success",
        description: "Your profile has been updated. If you changed your language, please refresh the page to apply the new language interface globally.",
      });
      
      // Refresh local user state silently or reload to bind changes to google translate
      if (user.preferred_language !== formData.preferred_language) {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">My Profile</h1>
        <p className="text-muted-foreground">Manage your account details and preferences.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
        <Card className="h-fit">
          <CardHeader className="text-center">
            <div className="mx-auto mt-4 mb-4">
              <Avatar className="h-24 w-24 mx-auto border-4 border-muted">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>{user.name}</CardTitle>
            <CardDescription className="capitalize flex items-center justify-center gap-1 mt-1">
              {user.user_type === 'teacher' ? <BookOpen className="h-4 w-4" /> : <GraduationCap className="h-4 w-4" />}
              {user.user_type} Account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            {user.created_at && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Joined On</p>
                  <p className="font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <form onSubmit={handleSave}>
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="pl-9" 
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="phone" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="pl-9" 
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              {user.user_type === 'student' && (
                <div className="space-y-2">
                  <Label htmlFor="grade_level">Grade Level</Label>
                  <Select 
                    value={formData.grade_level} 
                    onValueChange={(val: string) => setFormData({...formData, grade_level: val})}
                  >
                    <SelectTrigger id="grade_level">
                      <SelectValue placeholder="Select your grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_LEVELS.map(g => (
                        <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Select your current grade level so we can provide relevant content.</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="preferred_language">Interface Language</Label>
                <Select 
                  value={formData.preferred_language} 
                  onValueChange={(val: string) => setFormData({...formData, preferred_language: val})}
                >
                  <SelectTrigger id="preferred_language">
                    <SelectValue placeholder="Select your language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(lang => (
                      <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">This will translate the entire learning platform into your native language.</p>
              </div>

            </CardContent>
            <CardFooter className="flex justify-end border-t bg-muted/50 p-4">
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
