import mongoose, { Document, Schema, Model } from 'mongoose';
export interface IQuestion {
  question: string;
  question_type: 'mcq'|'short_answer'|'long_answer'|'true_false';
  options?: string[]; correct_answer?: string; marks: number;
}
export interface ITest extends Document {
  _id: mongoose.Types.ObjectId;
  title: string; description?: string;
  class_id: mongoose.Types.ObjectId; teacher_id: mongoose.Types.ObjectId;
  subject_id?: mongoose.Types.ObjectId; questions: IQuestion[];
  total_marks: number; duration_minutes: number; deadline: Date;
  is_published: boolean; results_published: boolean; results_published_at?: Date;
  created_at: Date; updated_at: Date;
}
const QuestionSchema = new Schema<IQuestion>({
  question: { type: String, required: true },
  question_type: { type: String, enum: ['mcq','short_answer','long_answer','true_false'], required: true },
  options: [{ type: String }],
  correct_answer: { type: String },
  marks: { type: Number, required: true, default: 1 },
});
const TestSchema = new Schema<ITest>({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  class_id: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  teacher_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject_id: { type: Schema.Types.ObjectId, ref: 'Subject' },
  questions: { type: [QuestionSchema], required: true, validate: { validator: (v: IQuestion[]) => v.length > 0, message: 'At least one question required' } },
  total_marks: { type: Number, required: true, default: 0 },
  duration_minutes: { type: Number, required: true, default: 60 },
  deadline: { type: Date, required: true },
  is_published: { type: Boolean, default: false },
  results_published: { type: Boolean, default: false },
  results_published_at: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});
TestSchema.pre('save', function(next) {
  this.total_marks = this.questions.reduce((s, q) => s + q.marks, 0);
  this.updated_at = new Date();
  next();
});
const Test: Model<ITest> = mongoose.models.Test || mongoose.model<ITest>('Test', TestSchema);
export default Test;
