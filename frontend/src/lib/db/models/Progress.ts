import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IProgress extends Document {
  _id: mongoose.Types.ObjectId;
  student_id: mongoose.Types.ObjectId;
  class_id: mongoose.Types.ObjectId;
  game_id: string;
  game_name: string;
  score: number;
  max_score: number;
  completed_at: Date;
}

const ProgressSchema = new Schema<IProgress>({
  student_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required'],
  },
  class_id: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class ID is required'],
  },
  game_id: {
    type: String,
    required: [true, 'Game ID is required'],
  },
  game_name: {
    type: String,
    required: [true, 'Game name is required'],
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: 0,
  },
  max_score: {
    type: Number,
    default: 100,
  },
  completed_at: {
    type: Date,
    default: Date.now,
  },
});

const Progress: Model<IProgress> = mongoose.models.Progress || mongoose.model<IProgress>('Progress', ProgressSchema);

export default Progress;
