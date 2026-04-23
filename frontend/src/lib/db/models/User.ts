import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  user_type: 'student' | 'teacher' | 'admin';
  phone?: string;
  subject_ids: mongoose.Types.ObjectId[];
  grade_level?: number; // For students: which grade they are enrolled in (1-12)
  teaching_grades?: number[]; // For teachers: which grades they can teach (array of 1-12)
  avatar?: string;
  preferred_language?: string;
  created_at: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  user_type: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    required: [true, 'User type is required'],
  },
  phone: {
    type: String,
    trim: true,
  },
  subject_ids: [{
    type: Schema.Types.ObjectId,
    ref: 'Subject',
  }],
  grade_level: {
    type: Number,
    min: 1,
    max: 12,
  },
  teaching_grades: [{
    type: Number,
    min: 1,
    max: 12,
  }],
  avatar: {
    type: String,
    default: '',
  },
  preferred_language: {
    type: String,
    default: 'English',
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Prevent model recompilation in development
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
