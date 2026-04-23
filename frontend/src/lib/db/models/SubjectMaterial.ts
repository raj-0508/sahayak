import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ISubjectMaterial extends Document {
  _id: mongoose.Types.ObjectId;
  subject_id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  file_name: string;
  file_type: string;
  file_size: number;
  extracted_text: string;
  grade_level?: string;
  uploaded_by: mongoose.Types.ObjectId;
  created_at: Date;
}

const SubjectMaterialSchema = new Schema<ISubjectMaterial>({
  subject_id: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required'],
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  file_name: {
    type: String,
    required: [true, 'File name is required'],
  },
  file_type: {
    type: String,
    required: true,
    default: 'application/pdf',
  },
  file_size: {
    type: Number,
    required: true,
  },
  extracted_text: {
    type: String,
    required: [true, 'Extracted text is required'],
  },
  grade_level: {
    type: String,
    trim: true,
  },
  uploaded_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Index for text search on extracted content
SubjectMaterialSchema.index({ extracted_text: 'text', title: 'text' });

const SubjectMaterial: Model<ISubjectMaterial> = mongoose.models.SubjectMaterial || mongoose.model<ISubjectMaterial>('SubjectMaterial', SubjectMaterialSchema);

export default SubjectMaterial;
