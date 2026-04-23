import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string; email: string; password: string;
  user_type: 'student' | 'teacher' | 'admin';
  phone?: string;
  subject_ids: mongoose.Types.ObjectId[];
  grade_level?: number;
  teaching_grades?: number[];
  avatar?: string;
  preferred_language?: string;
  created_at: Date;
  comparePassword(p: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  user_type: { type: String, enum: ['student','teacher','admin'], required: true },
  phone: { type: String, trim: true },
  subject_ids: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
  grade_level: { type: Number, min: 1, max: 12 },
  teaching_grades: [{ type: Number, min: 1, max: 12 }],
  avatar: { type: String, default: '' },
  preferred_language: { type: String, default: 'English' },
  created_at: { type: Date, default: Date.now },
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function(p: string): Promise<boolean> {
  return bcrypt.compare(p, this.password);
};

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
