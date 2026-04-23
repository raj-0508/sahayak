import mongoose, { Document, Schema, Model } from 'mongoose';
export interface IContent extends Document {
  _id: mongoose.Types.ObjectId;
  class_id: mongoose.Types.ObjectId; teacher_id: mongoose.Types.ObjectId;
  title: string; content: string;
  content_type: 'note'|'assignment'|'ai-generated'|'worksheet'|'game'|'explainer';
  created_at: Date;
}
const ContentSchema = new Schema<IContent>({
  class_id: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  teacher_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  content_type: { type: String, enum: ['note','assignment','ai-generated','worksheet','game','explainer'], default: 'note' },
  created_at: { type: Date, default: Date.now },
});
const Content: Model<IContent> = mongoose.models.Content || mongoose.model<IContent>('Content', ContentSchema);
export default Content;
