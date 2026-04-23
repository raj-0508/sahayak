import mongoose, { Document, Schema, Model } from 'mongoose';
export interface IAnswer {
  question_index: number; answer: string; marks_obtained?: number; feedback?: string;
}
export interface ITestSubmission extends Document {
  _id: mongoose.Types.ObjectId;
  test_id: mongoose.Types.ObjectId; student_id: mongoose.Types.ObjectId; class_id: mongoose.Types.ObjectId;
  answers: IAnswer[]; total_marks_obtained: number; percentage: number;
  status: 'in_progress'|'submitted'|'evaluating'|'evaluated';
  started_at: Date; submitted_at?: Date; evaluated_at?: Date;
  evaluated_by?: mongoose.Types.ObjectId; teacher_remarks?: string; created_at: Date;
}
const AnswerSchema = new Schema<IAnswer>({
  question_index: { type: Number, required: true },
  answer: { type: String, default: '' },
  marks_obtained: { type: Number },
  feedback: { type: String },
});
const TestSubmissionSchema = new Schema<ITestSubmission>({
  test_id: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
  student_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  class_id: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  answers: { type: [AnswerSchema], default: [] },
  total_marks_obtained: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  status: { type: String, enum: ['in_progress','submitted','evaluating','evaluated'], default: 'in_progress' },
  started_at: { type: Date, default: Date.now },
  submitted_at: { type: Date },
  evaluated_at: { type: Date },
  evaluated_by: { type: Schema.Types.ObjectId, ref: 'User' },
  teacher_remarks: { type: String },
  created_at: { type: Date, default: Date.now },
});
TestSubmissionSchema.index({ test_id: 1, student_id: 1 }, { unique: true });
TestSubmissionSchema.index({ student_id: 1, status: 1 });
const TestSubmission: Model<ITestSubmission> = mongoose.models.TestSubmission || mongoose.model<ITestSubmission>('TestSubmission', TestSubmissionSchema);
export default TestSubmission;
