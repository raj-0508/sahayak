import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ILog extends Document {
  _id: mongoose.Types.ObjectId;
  timestamp: Date;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  user_id?: mongoose.Types.ObjectId;
  action?: string;
}

const LogSchema = new Schema<ILog>({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  level: {
    type: String,
    enum: ['INFO', 'WARN', 'ERROR'],
    default: 'INFO',
  },
  message: {
    type: String,
    required: [true, 'Log message is required'],
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  action: {
    type: String,
    trim: true,
  },
});

const Log: Model<ILog> = mongoose.models.Log || mongoose.model<ILog>('Log', LogSchema);

export default Log;
