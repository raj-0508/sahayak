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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Loader2, Trash2, Edit, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type User } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface ApiUser {
  _id: string;
  name: string;
  email: string;
  user_type: 'admin' | 'teacher' | 'student';
  phone?: string;
  subject_ids?: string[];
  grade_level?: number;
  teaching_grades?: number[];
  created_at: string;
}

interface Subject {
  _id: string;
  name: string;
}

const GRADE_LEVELS = Array.from({ length: 12 }, (_, i) => i + 1);

export function UserManagement() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ApiUser | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    user_type: 'student' as 'student' | 'teacher' | 'admin',
    phone: '',
    subject_ids: [] as string[],
    grade_level: undefined as number | undefined,
    teaching_grades: [] as number[],
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch users and subjects on mount
  useEffect(() => {
    fetchUsers();
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const data = await apiGet('/api/subjects');
      setSubjects(data.subjects || []);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiGet('/api/users');
      setUsers(data.users || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (subjectId: string) => {
    setFormData(prev => ({
      ...prev,
      subject_ids: prev.subject_ids.includes(subjectId)
        ? prev.subject_ids.filter(id => id !== subjectId)
        : [...prev.subject_ids, subjectId]
    }));
  };

  const toggleTeachingGrade = (grade: number) => {
    setFormData(prev => ({
      ...prev,
      teaching_grades: prev.teaching_grades.includes(grade)
        ? prev.teaching_grades.filter(g => g !== grade)
        : [...prev.teaching_grades, grade].sort((a, b) => a - b)
    }));
  };

  const getSubjectNames = (subjectIds: string[] = []) => {
    return subjectIds
      .map(id => subjects.find(s => s._id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const getGradeDisplay = (user: ApiUser) => {
    if (user.user_type === 'student' && user.grade_level) {
      return `Grade ${user.grade_level}`;
    }
    if (user.user_type === 'teacher' && user.teaching_grades && user.teaching_grades.length > 0) {
      return `Grades: ${user.teaching_grades.join(', ')}`;
    }
    return '-';
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(filter.toLowerCase()) ||
    user.email.toLowerCase().includes(filter.toLowerCase()) ||
    user.user_type.toLowerCase().includes(filter.toLowerCase())
  );

  const handleAddUser = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast({
        title: "Validation Error",
        description: "Name, email, and password are required",
        variant: "destructive",
      });
      return;
    }

    if (formData.user_type === 'teacher' && formData.subject_ids.length === 0) {
      toast({
        title: "Validation Error",
        description: "Teachers must have at least one subject assigned",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await apiPost('/api/users', formData);

      toast({
        title: "Success",
        description: "User created successfully",
      });
      setIsAddDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    if (formData.user_type === 'teacher' && formData.subject_ids.length === 0) {
      toast({
        title: "Validation Error",
        description: "Teachers must have at least one subject assigned",
        variant: "destructive",
      });
      return;
    }

    if (formData.user_type === 'teacher' && formData.teaching_grades.length === 0) {
      toast({
        title: "Validation Error",
        description: "Teachers must have at least one teaching grade",
        variant: "destructive",
      });
      return;
    }

    if (formData.user_type === 'student' && !formData.grade_level) {
      toast({
        title: "Validation Error",
        description: "Students must have a grade level",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await apiPut(`/api/users/${selectedUser._id}`, {
        name: formData.name,
        email: formData.email,
        user_type: formData.user_type,
        phone: formData.phone,
        subject_ids: formData.subject_ids,
        grade_level: formData.grade_level,
        teaching_grades: formData.teaching_grades,
      });

      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setIsEditDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setSubmitting(true);
    try {
      await apiDelete(`/api/users/${selectedUser._id}`);
      
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      user_type: 'student',
      phone: '',
      subject_ids: [],
      grade_level: undefined,
      teaching_grades: [],
    });
    setSelectedUser(null);
  };

  const openEditDialog = (user: ApiUser) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      user_type: user.user_type,
      phone: user.phone || '',
      subject_ids: user.subject_ids || [],
      grade_level: user.grade_level,
      teaching_grades: user.teaching_grades || [],
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: ApiUser) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'teacher': return 'default';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
            <Input 
              placeholder="Filter by name, email, or role..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="max-w-sm"
            />
            <Button size="sm" className="gap-2" onClick={() => {
              resetForm();
              setIsAddDialogOpen(true);
            }}>
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Grade(s)</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.user_type)} className="capitalize">
                        {user.user_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{getGradeDisplay(user)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {user.user_type === 'teacher' 
                        ? (getSubjectNames(user.subject_ids) || <span className="text-muted-foreground">No subjects</span>)
                        : '-'}
                    </TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openEditDialog(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openDeleteDialog(user)} 
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. They will be able to log in with these credentials.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-2">
            <div className="space-y-2">
              <Label htmlFor="add-name">Name *</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-email">Email *</Label>
              <Input
                id="add-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-password">Password *</Label>
              <Input
                id="add-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-phone">Phone</Label>
              <Input
                id="add-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-role">Role *</Label>
              <Select
                value={formData.user_type}
                onValueChange={(value: 'student' | 'teacher' | 'admin') => 
                  setFormData({ ...formData, user_type: value, subject_ids: [], grade_level: undefined, teaching_grades: [] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.user_type === 'student' && (
              <div className="space-y-2">
                <Label htmlFor="add-grade">Grade Level *</Label>
                <Select
                  value={formData.grade_level?.toString() || ''}
                  onValueChange={(value: string) => setFormData({ ...formData, grade_level: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_LEVELS.map((grade) => (
                      <SelectItem key={grade} value={grade.toString()}>
                        Grade {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.user_type === 'teacher' && (
              <>
                <div className="space-y-2">
                  <Label>Assign Subjects *</Label>
                  {subjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No subjects available</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 p-3 border rounded-md max-h-32 overflow-y-auto">
                      {subjects.map((subject) => (
                        <div key={subject._id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`add-subject-${subject._id}`}
                            checked={formData.subject_ids.includes(subject._id)}
                            onCheckedChange={() => toggleSubject(subject._id)}
                          />
                          <label
                            htmlFor={`add-subject-${subject._id}`}
                            className="text-sm cursor-pointer"
                          >
                            {subject.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                  {formData.subject_ids.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {formData.subject_ids.length} subject(s) selected
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Teaching Grades *</Label>
                  <div className="grid grid-cols-6 gap-2 p-3 border rounded-md">
                    {GRADE_LEVELS.map((grade) => (
                      <div key={grade} className="flex items-center space-x-1">
                        <Checkbox
                          id={`add-grade-${grade}`}
                          checked={formData.teaching_grades.includes(grade)}
                          onCheckedChange={() => toggleTeachingGrade(grade)}
                        />
                        <label
                          htmlFor={`add-grade-${grade}`}
                          className="text-sm cursor-pointer"
                        >
                          {grade}
                        </label>
                      </div>
                    ))}
                  </div>
                  {formData.teaching_grades.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Teaching grades: {formData.teaching_grades.join(', ')}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information. Leave password blank to keep current password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto flex-1 pr-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={formData.user_type}
                onValueChange={(value: 'student' | 'teacher' | 'admin') => 
                  setFormData({ ...formData, user_type: value, subject_ids: value === 'teacher' ? formData.subject_ids : [], grade_level: value === 'student' ? formData.grade_level : undefined, teaching_grades: value === 'teacher' ? formData.teaching_grades : [] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.user_type === 'student' && (
              <div className="space-y-2">
                <Label htmlFor="edit-grade">Grade Level *</Label>
                <Select
                  value={formData.grade_level?.toString() || ''}
                  onValueChange={(value: string) => setFormData({ ...formData, grade_level: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_LEVELS.map((grade) => (
                      <SelectItem key={grade} value={grade.toString()}>
                        Grade {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.user_type === 'teacher' && (
              <>
                <div className="space-y-2">
                  <Label>Assign Subjects *</Label>
                  {subjects.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No subjects available</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 p-3 border rounded-md max-h-32 overflow-y-auto">
                      {subjects.map((subject) => (
                        <div key={subject._id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`edit-subject-${subject._id}`}
                            checked={formData.subject_ids.includes(subject._id)}
                            onCheckedChange={() => toggleSubject(subject._id)}
                          />
                          <label
                            htmlFor={`edit-subject-${subject._id}`}
                            className="text-sm cursor-pointer"
                          >
                            {subject.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                  {formData.subject_ids.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {formData.subject_ids.length} subject(s) selected
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Teaching Grades *</Label>
                  <div className="grid grid-cols-6 gap-2 p-3 border rounded-md">
                    {GRADE_LEVELS.map((grade) => (
                      <div key={grade} className="flex items-center space-x-1">
                        <Checkbox
                          id={`edit-grade-${grade}`}
                          checked={formData.teaching_grades.includes(grade)}
                          onCheckedChange={() => toggleTeachingGrade(grade)}
                        />
                        <label
                          htmlFor={`edit-grade-${grade}`}
                          className="text-sm cursor-pointer"
                        >
                          {grade}
                        </label>
                      </div>
                    ))}
                  </div>
                  {formData.teaching_grades.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Teaching grades: {formData.teaching_grades.join(', ')}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user "{selectedUser?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
