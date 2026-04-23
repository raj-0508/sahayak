import mongoose, { Document, Schema, Model } from 'mongoose';
export interface IJoinRequest extends Document {
  _id: mongoose.Types.ObjectId;
  student_id: mongoose.Types.ObjectId; teacher_id: mongoose.Types.ObjectId;
  subject_id: mongoose.Types.ObjectId; class_id: mongoose.Types.ObjectId;
  student_name: string; student_email: string;
  status: 'pending'|'accepted'|'rejected'; created_at: Date;
}
const JoinRequestSchema = new Schema<IJoinRequest>({
  student_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  teacher_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject_id: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
  class_id: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  student_name: { type: String, required: true, trim: true },
  student_email: { type: String, required: true, trim: true },
  status: { type: String, enum: ['pending','accepted','rejected'], default: 'pending' },
  created_at: { type: Date, default: Date.now },
});
const JoinRequest: Model<IJoinRequest> = mongoose.models.JoinRequest || mongoose.model<IJoinRequest>('JoinRequest', JoinRequestSchema);
export default JoinRequest;
