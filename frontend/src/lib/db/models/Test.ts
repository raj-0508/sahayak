import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IQuestion {
  question: string;
  question_type: 'mcq' | 'short_answer' | 'long_answer' | 'true_false';
  options?: string[]; // For MCQ
  correct_answer?: string; // For auto-grading MCQ/true_false
  marks: number;
}

export interface ITest extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  class_id: mongoose.Types.ObjectId;
  teacher_id: mongoose.Types.ObjectId;
  subject_id?: mongoose.Types.ObjectId;
  questions: IQuestion[];
  total_marks: number;
  duration_minutes: number;
  deadline: Date;
  is_published: boolean;
  results_published: boolean;
  results_published_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  question: {
    type: String,
    required: [true, 'Question text is required'],
  },
  question_type: {
    type: String,
    enum: ['mcq', 'short_answer', 'long_answer', 'true_false'],
    required: [true, 'Question type is required'],
  },
  options: [{
    type: String,
  }],
  correct_answer: {
    type: String,
  },
  marks: {
    type: Number,
    required: [true, 'Marks is required'],
    default: 1,
  },
});

const TestSchema = new Schema<ITest>({
  title: {
    type: String,
    required: [true, 'Test title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  class_id: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class ID is required'],
  },
  teacher_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher ID is required'],
  },
  subject_id: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
  },
  questions: {
    type: [QuestionSchema],
    required: [true, 'At least one question is required'],
    validate: {
      validator: function(v: IQuestion[]) {
        return v.length > 0;
      },
      message: 'Test must have at least one question',
    },
  },
  total_marks: {
    type: Number,
    required: true,
    default: 0,
  },
  duration_minutes: {
    type: Number,
    required: [true, 'Duration is required'],
    default: 60,
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required'],
  },
  is_published: {
    type: Boolean,
    default: false,
  },
  results_published: {
    type: Boolean,
    default: false,
  },
  results_published_at: {
    type: Date,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Calculate total marks before saving
TestSchema.pre('save', function(next) {
  this.total_marks = this.questions.reduce((sum, q) => sum + q.marks, 0);
  this.updated_at = new Date();
  next();
});

const Test: Model<ITest> = mongoose.models.Test || mongoose.model<ITest>('Test', TestSchema);

export default Test;
