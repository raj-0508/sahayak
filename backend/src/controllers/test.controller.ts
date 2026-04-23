import { Request, Response } from 'express';
import Test from '../models/Test';
import TestSubmission from '../models/TestSubmission';
import Class from '../models/Class';
import connectDB from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

export async function getTests(req: AuthRequest, res: Response) {
  try {
    await connectDB(); const u = req.user;
    if (u.user_type === 'student') {
      const enrolled = await Class.find({ students: u._id }).select('_id');
      const classIds = enrolled.map((c: any) => c._id);
      const tests = await Test.find({ class_id: { $in: classIds }, is_published: true }).populate('class_id','class_name teacher_name').populate('subject_id','name').populate('teacher_id','name email').sort({ deadline: 1 });
      const submissions = await TestSubmission.find({ student_id: u._id, test_id: { $in: tests.map((t: any) => t._id) } });
      const submissionMap = new Map(submissions.map((s: any) => [s.test_id.toString(), s]));
      const testsWithStatus = tests.map((test: any) => {
        const submission = submissionMap.get(test._id.toString());
        return { ...test.toObject(), submission: submission ? { _id: submission._id, status: submission.status, submitted_at: submission.submitted_at, total_marks_obtained: submission.total_marks_obtained, percentage: submission.percentage, evaluated_at: submission.evaluated_at } : null };
      });
      return res.json({ tests: testsWithStatus });
    }
    if (u.user_type === 'teacher') {
      const tests = await Test.find({ teacher_id: u._id }).populate('class_id','class_name').populate('subject_id','name').sort({ created_at: -1 });
      return res.json({ tests });
    }
    const tests = await Test.find({}).populate('class_id','class_name').populate('subject_id','name').populate('teacher_id','name').sort({ created_at: -1 });
    return res.json({ tests });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}

export async function createTest(req: AuthRequest, res: Response) {
  try {
    const u = req.user;
    if (u.user_type !== 'teacher') return res.status(403).json({ error: 'Teacher access required' });
    await connectDB();
    const { title, description, class_id, subject_id, questions, duration_minutes, deadline, is_published } = req.body;
    if (!title || !class_id || !questions || questions.length === 0 || !deadline) return res.status(400).json({ error: 'Missing required fields' });
    const classDoc = await Class.findById(class_id);
    if (!classDoc || classDoc.teacher_id.toString() !== u._id.toString()) return res.status(403).json({ error: 'You can only create tests for your own classes' });
    const test = new Test({ title, description, class_id, teacher_id: u._id, subject_id: subject_id || classDoc.subject_id, questions, duration_minutes: duration_minutes || 60, deadline: new Date(deadline), is_published: is_published || false });
    await test.save();
    return res.status(201).json({ message: 'Test created successfully', test });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}

export async function getTest(req: AuthRequest, res: Response) {
  try {
    await connectDB(); const { testId } = req.params; const u = req.user;
    const test = await Test.findById(testId).populate('class_id','class_name teacher_name students').populate('subject_id','name').populate('teacher_id','name email');
    if (!test) return res.status(404).json({ error: 'Test not found' });
    if (u.user_type === 'student') {
      const classData = test.class_id as any;
      const isEnrolled = classData.students?.some((s: any) => s.toString() === u._id.toString());
      if (!isEnrolled) return res.status(403).json({ error: 'You are not enrolled in this class' });
      const submission = await TestSubmission.findOne({ test_id: testId, student_id: u._id });
      const testData = test.toObject();
      testData.questions = testData.questions.map((q: any) => ({ ...q, correct_answer: undefined }));
      return res.json({ test: testData, submission: submission || null });
    }
    return res.json({ test });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}

export async function submitTest(req: AuthRequest, res: Response) {
  try {
    const u = req.user;
    if (u.user_type !== 'student') return res.status(403).json({ error: 'Student access required' });
    await connectDB(); const { testId } = req.params;
    const { answers, action } = req.body;
    const test = await Test.findById(testId).populate('class_id');
    if (!test) return res.status(404).json({ error: 'Test not found' });
    if (new Date() > new Date(test.deadline)) return res.status(400).json({ error: 'Test deadline has passed' });
    let submission = await TestSubmission.findOne({ test_id: testId, student_id: u._id });
    if (submission && submission.status === 'submitted') return res.status(400).json({ error: 'You have already submitted this test' });
    if (!submission) { submission = new TestSubmission({ test_id: testId, student_id: u._id, class_id: test.class_id, answers: [], status: 'in_progress', started_at: new Date() }); }
    submission.answers = answers.map((a: any, idx: number) => ({ question_index: idx, answer: a.answer || '' }));
    if (action === 'submit') {
      submission.status = 'submitted'; submission.submitted_at = new Date();
      let autoGradedMarks = 0; let needsManual = false;
      test.questions.forEach((q: any, idx: number) => {
        const sa = submission!.answers.find((a: any) => a.question_index === idx);
        if (q.question_type === 'mcq' || q.question_type === 'true_false') { if (sa && q.correct_answer && sa.answer.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()) { sa.marks_obtained = q.marks; autoGradedMarks += q.marks; } else if (sa) sa.marks_obtained = 0; }
        else needsManual = true;
      });
      submission.total_marks_obtained = autoGradedMarks;
      if (!needsManual) { submission.status = 'evaluated'; submission.evaluated_at = new Date(); submission.percentage = test.total_marks > 0 ? (autoGradedMarks / test.total_marks) * 100 : 0; }
    }
    submission.markModified('answers'); await submission.save();
    return res.json({ message: action === 'submit' ? 'Test submitted successfully' : 'Answers saved', submission });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}

export async function updateTest(req: AuthRequest, res: Response) {
  try {
    const u = req.user;
    if (u.user_type !== 'teacher') return res.status(403).json({ error: 'Teacher access required' });
    await connectDB(); const { testId } = req.params;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ error: 'Test not found' });
    if (test.teacher_id.toString() !== u._id.toString()) return res.status(403).json({ error: 'You can only update your own tests' });
    const { title, description, questions, duration_minutes, deadline, is_published } = req.body;
    if (title !== undefined) test.title = title;
    if (description !== undefined) test.description = description;
    if (questions !== undefined) { test.questions = questions; test.total_marks = questions.reduce((s: number, q: any) => s + (q.marks || 1), 0); }
    if (duration_minutes !== undefined) test.duration_minutes = duration_minutes;
    if (deadline !== undefined) test.deadline = new Date(deadline);
    if (is_published !== undefined) test.is_published = is_published;
    await test.save();
    return res.json({ message: 'Test updated successfully', test });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}

export async function deleteTest(req: AuthRequest, res: Response) {
  try {
    const u = req.user;
    if (u.user_type !== 'teacher') return res.status(403).json({ error: 'Teacher access required' });
    await connectDB(); const { testId } = req.params;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ error: 'Test not found' });
    if (test.teacher_id.toString() !== u._id.toString()) return res.status(403).json({ error: 'You can only delete your own tests' });
    await TestSubmission.deleteMany({ test_id: testId });
    await Test.findByIdAndDelete(testId);
    return res.json({ message: 'Test and all submissions deleted successfully' });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}

export async function publishResults(req: AuthRequest, res: Response) {
  try {
    const u = req.user;
    if (u.user_type !== 'teacher' && u.user_type !== 'admin') return res.status(403).json({ error: 'Teacher access required' });
    await connectDB(); const { testId } = req.params;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ error: 'Test not found' });
    if (u.user_type === 'teacher' && test.teacher_id.toString() !== u._id.toString()) return res.status(403).json({ error: 'You can only publish results for your own tests' });
    if (new Date() < test.deadline) return res.status(400).json({ error: 'Cannot publish results before deadline' });
    const submissions = await TestSubmission.find({ test_id: testId });
    const hasLongAnswer = test.questions.some((q: any) => q.question_type === 'long_answer' || q.question_type === 'short_answer');
    if (hasLongAnswer) { const unevaluated = submissions.filter((s: any) => s.status !== 'evaluated'); if (unevaluated.length > 0) return res.status(400).json({ error: 'Please evaluate all submissions before publishing results', unevaluatedCount: unevaluated.length }); }
    test.results_published = true; test.results_published_at = new Date(); await test.save();
    return res.json({ message: 'Results published successfully', test: { _id: test._id, title: test.title, results_published: true, results_published_at: test.results_published_at } });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}

export async function unpublishResults(req: AuthRequest, res: Response) {
  try {
    const u = req.user;
    if (u.user_type !== 'teacher' && u.user_type !== 'admin') return res.status(403).json({ error: 'Teacher access required' });
    await connectDB(); const { testId } = req.params;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ error: 'Test not found' });
    if (u.user_type === 'teacher' && test.teacher_id.toString() !== u._id.toString()) return res.status(403).json({ error: 'Unauthorized' });
    test.results_published = false; test.results_published_at = undefined; await test.save();
    return res.json({ message: 'Results unpublished', test: { _id: test._id, title: test.title, results_published: false } });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}

export async function getTestResults(req: AuthRequest, res: Response) {
  try {
    await connectDB(); const u = req.user; const { testId } = req.params;
    const test = await Test.findById(testId).populate('class_id','class_name').populate('subject_id','name').populate('teacher_id','name');
    if (!test) return res.status(404).json({ error: 'Test not found' });
    if (u.user_type === 'student') {
      const submission = await TestSubmission.findOne({ test_id: testId, student_id: u._id });
      if (!submission) return res.status(404).json({ error: 'No submission found' });
      if (submission.status !== 'evaluated') return res.json({ test: { title: test.title, total_marks: test.total_marks }, submission: { status: submission.status, submitted_at: submission.submitted_at }, message: 'Your test is under evaluation.' });
      const questionsWithAnswers = test.questions.map((q: any, idx: number) => {
        const sa = submission.answers.find((a: any) => a.question_index === idx);
        return { question: q.question, question_type: q.question_type, options: q.options, correct_answer: q.correct_answer, marks: q.marks, student_answer: sa?.answer || 'Not answered', marks_obtained: sa?.marks_obtained ?? 0, feedback: sa?.feedback };
      });
      return res.json({ test: { title: test.title, description: test.description, total_marks: test.total_marks, class_name: (test.class_id as any).class_name, subject_name: (test.subject_id as any)?.name }, submission: { status: submission.status, total_marks_obtained: submission.total_marks_obtained, percentage: submission.percentage, submitted_at: submission.submitted_at, evaluated_at: submission.evaluated_at, teacher_remarks: submission.teacher_remarks }, questions: questionsWithAnswers });
    }
    if (u.user_type === 'teacher') {
      if ((test.teacher_id as any).toString() !== u._id.toString()) return res.status(403).json({ error: 'Access denied' });
      const submissions = await TestSubmission.find({ test_id: testId }).populate('student_id','name email').sort({ submitted_at: -1 });
      return res.json({ test, submissions });
    }
    return res.status(403).json({ error: 'Access denied' });
  } catch { return res.status(500).json({ error: 'Internal server error' }); }
}
