import mongoose from 'mongoose';

export interface IGuest {
  id: string;
  eventId: string;
  guestCode: string;
  name: string;
  mobileNumber?: string;
  maxGuests: number;
  status: 'pending' | 'attending' | 'declined';
  attendingCount: number;
  notes?: string;
  dietaryPreferences?: string;
  updatedAt?: string;
}

const guestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  eventId: { type: String, required: true, index: true },
  guestCode: { type: String, required: true, uppercase: true, trim: true },
  name: { type: String, required: true },
  mobileNumber: { type: String, default: '' },
  maxGuests: { type: Number, default: 2 },
  status: { type: String, enum: ['pending', 'attending', 'declined'], default: 'pending' },
  attendingCount: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  dietaryPreferences: { type: String, default: '' }
}, { timestamps: true });

guestSchema.index({ eventId: 1, guestCode: 1 }, { unique: true });

export const GuestModel = mongoose.models.Guest || mongoose.model('Guest', guestSchema);
