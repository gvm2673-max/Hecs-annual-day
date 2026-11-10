import mongoose from 'mongoose';

export interface IEvent {
  id: string;
  slug: string;
  title: string;
  hostNames: string;
  celebrationType: string;
  date: string;
  time: string;
  venueName: string;
  venueAddress: string;
  googleMapsUrl?: string;
  invitationMessage: string;
  imageUrl?: string;
  imageSource?: 'upload' | 'url' | 'google_drive';
  googleDriveFileId?: string;
  imagePosition?: 'top' | 'center' | 'bottom';
  imageAspect?: 'auto' | 'portrait' | 'landscape' | 'square';
  imageFit?: 'cover' | 'contain' | 'natural';
  rsvpDeadline?: string;
  createdAt?: string;
  updatedAt?: string;
}

const eventSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  title: { type: String, default: '' },
  hostNames: { type: String, required: true },
  celebrationType: { type: String, default: 'Celebration' },
  date: { type: String, required: true },
  time: { type: String, default: '5:00 PM' },
  venueName: { type: String, default: '' },
  venueAddress: { type: String, default: '' },
  googleMapsUrl: { type: String, default: '' },
  invitationMessage: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  imageSource: { type: String, default: 'upload' },
  googleDriveFileId: { type: String, default: '' },
  imagePosition: { type: String, default: 'top' },
  imageAspect: { type: String, default: 'auto' },
  imageFit: { type: String, default: 'cover' },
  rsvpDeadline: { type: String, default: '' }
}, { timestamps: true });

export const EventModel = mongoose.models.Event || mongoose.model('Event', eventSchema);
