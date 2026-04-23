import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISubject extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  grade_levels: string[];
  image_url?: string;
  created_at: Date;
}

const SubjectSchema = new Schema<ISubject>({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  grade_levels: [{
    type: String,
    trim: true,
  }],
  image_url: {
    type: String,
    default: '',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const Subject: Model<ISubject> = mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema);

export default Subject;
