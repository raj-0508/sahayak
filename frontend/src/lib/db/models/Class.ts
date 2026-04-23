import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IClass extends Document {
  _id: mongoose.Types.ObjectId;
  teacher_id: mongoose.Types.ObjectId;
  teacher_name: string;
  subject_id: mongoose.Types.ObjectId;
  class_name: string;
  description?: string;
  grade_level: number; // The grade level this class is for (1-12)
  students: mongoose.Types.ObjectId[];
  created_at: Date;
}

const ClassSchema = new Schema<IClass>({
  teacher_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher ID is required'],
  },
  teacher_name: {
    type: String,
    required: [true, 'Teacher name is required'],
    trim: true,
  },
  subject_id: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject ID is required'],
  },
  class_name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  grade_level: {
    type: Number,
    min: 1,
    max: 12,
    required: [true, 'Grade level is required'],
  },
  students: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const Class: Model<IClass> = mongoose.models.Class || mongoose.model<IClass>('Class', ClassSchema);

export default Class;
