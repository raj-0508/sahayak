import { Request, Response } from 'express';
import TestSubmission from '../models/TestSubmission';
import Test from '../models/Test';
import connectDB from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

export async function getSubmissions(req: AuthRequest, res: Response) {
  try {
    await connectDB(); const u = req.user;
    const { class_id, test_id } = req.query;
    if (u.user_type === 'teacher') {
      const teacherTests = await Test.find({ teacher_id: u._id }).select('_id');
      const testIds = teacherTests.map((t: any) => t._id);
      let query: any = { test_id: { $in: testIds } };
      if (class_id) query.class_id = class_id;
      if (test_id) query.test_id = test_id;
      const submissions = await TestSubmission.find(query).populate('test_id','title total_marks deadline results_published questions').populate('student_id','name email').populate('class_id','class_name').sort({ submitted_at: -1 });
      return res.json({ submissions });
    }
    if (u.user_type === 'admin') {
      let query: any = {};
      if (class_id) query.class_id = class_id;
      if (test_id) query.test_id = test_id;
      const submissions = await TestSubmission.find(query).populate('test_id','title total_marks deadline results_published questions').populate('student_id','name email').populate('class_id','class_name').sort({ submitted_at: -1 });
      return res.json({ submissions });
    }
    return res.status(403).json({ error: 'Teacher or admin access required' });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}

export async function evaluateSubmission(req: AuthRequest, res: Response) {
  try {
    const u = req.user;
    if (u.user_type !== 'teacher' && u.user_type !== 'admin') return res.status(403).json({ error: 'Teacher access required' });
    await connectDB(); const { id } = req.params;
    const { answers, teacher_remarks } = req.body;
    const submission = await TestSubmission.findById(id).populate('test_id');
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    const test = submission.test_id as any;
    if (u.user_type === 'teacher' && test.teacher_id.toString() !== u._id.toString()) return res.status(403).json({ error: 'You can only evaluate your own tests' });
    if (answers && Array.isArray(answers)) {
      answers.forEach((update: any) => {
        const idx = submission.answers.findIndex((a: any) => a.question_index === update.question_index);
        if (idx >= 0) { submission.answers[idx].marks_obtained = update.marks_obtained; if (update.feedback) submission.answers[idx].feedback = update.feedback; }
      });
      submission.markModified('answers');
    }
    const totalMarks = submission.answers.reduce((s: number, a: any) => s + (a.marks_obtained || 0), 0);
    submission.total_marks_obtained = totalMarks;
    submission.percentage = test.total_marks > 0 ? Math.round((totalMarks / test.total_marks) * 100) : 0;
    submission.status = 'evaluated'; submission.evaluated_at = new Date(); submission.evaluated_by = u._id;
    if (teacher_remarks) submission.teacher_remarks = teacher_remarks;
    await submission.save();
    const updated = await TestSubmission.findById(id).populate('test_id','title total_marks questions').populate('student_id','name email');
    return res.json({ message: 'Submission evaluated successfully', submission: updated });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}

export async function getMyProgress(req: AuthRequest, res: Response) {
  try {
    const u = req.user;
    if (u.user_type !== 'student') return res.status(403).json({ error: 'Student access required' });
    await connectDB();
    const submissions = await TestSubmission.find({ student_id: u._id }).populate({ path: 'test_id', select: 'title total_marks deadline results_published subject_id', populate: { path: 'subject_id', select: 'name' } }).populate('class_id','class_name').sort({ submitted_at: -1 });
    const filteredSubmissions = submissions.map((sub: any) => {
      const submission = sub.toObject();
      if (submission.status === 'evaluated') return { ...submission, results_pending: false };
      return { ...submission, total_marks_obtained: null, percentage: null, answers: submission.answers.map((a: any) => ({ ...a, marks_obtained: null, feedback: null })), results_pending: true };
    });
    const evaluated = submissions.filter((s: any) => s.status === 'evaluated');
    const stats = { totalTests: submissions.length, completedTests: evaluated.length, averageScore: evaluated.length > 0 ? Math.round(evaluated.reduce((s: number, sub: any) => s + (sub.percentage || 0), 0) / evaluated.length) : 0, pendingResults: submissions.filter((s: any) => s.status === 'submitted').length };
    return res.json({ submissions: filteredSubmissions, stats });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}
