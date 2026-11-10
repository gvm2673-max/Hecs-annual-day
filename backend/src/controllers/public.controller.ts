import { Request, Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { EventModel } from '../models/event.model.js';
import { GuestModel } from '../models/guest.model.js';

export async function getPrimaryEvent(req: Request, res: Response) {
  try {
    const event = await EventModel.findOne().sort({ createdAt: 1 });
    if (!event) {
      return res.json({ success: true, event: null });
    }
    return res.json({
      success: true,
      event: {
        id: event.id,
        slug: event.slug,
        title: event.title,
        hostNames: event.hostNames,
        celebrationType: event.celebrationType,
        date: event.date,
        time: event.time,
        venueName: event.venueName,
        venueAddress: event.venueAddress,
        googleMapsUrl: event.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venueAddress || event.venueName)}`,
        invitationMessage: event.invitationMessage,
        imageUrl: event.imageUrl,
        imageSource: (event as any).imageSource || (event.imageUrl?.startsWith('http') ? 'url' : 'upload'),
        googleDriveFileId: (event as any).googleDriveFileId || '',
        imagePosition: event.imagePosition,
        imageAspect: event.imageAspect,
        imageFit: event.imageFit,
        rsvpDeadline: event.rsvpDeadline
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'ServerError', message: 'Error fetching primary event from MongoDB' });
  }
}

export async function getPublicInviteBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({ success: false, error: 'ValidationError', message: 'Slug parameter is required' });
    }

    const cleanSlug = String(slug).trim().toLowerCase();
    let event = await EventModel.findOne({ slug: cleanSlug });
    if (!event && (cleanSlug.startsWith('evt-') || mongoose.Types.ObjectId.isValid(cleanSlug))) {
      event = await EventModel.findOne({ id: cleanSlug });
    }

    if (!event) {
      return res.status(404).json({ success: false, error: 'NotFound', message: 'Invitation not found or no longer available' });
    }

    return res.json({
      success: true,
      event: {
        id: event.id,
        slug: event.slug,
        title: event.title,
        hostNames: event.hostNames,
        celebrationType: event.celebrationType,
        date: event.date,
        time: event.time,
        venueName: event.venueName,
        venueAddress: event.venueAddress,
        googleMapsUrl: event.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venueAddress || event.venueName)}`,
        invitationMessage: event.invitationMessage,
        imageUrl: event.imageUrl,
        imageSource: (event as any).imageSource || (event.imageUrl?.startsWith('http') ? 'url' : 'upload'),
        googleDriveFileId: (event as any).googleDriveFileId || '',
        imagePosition: event.imagePosition,
        imageAspect: event.imageAspect,
        imageFit: event.imageFit,
        rsvpDeadline: event.rsvpDeadline
      },
      guest: null
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'ServerError', message: err.message || 'Error fetching event invitation from MongoDB' });
  }
}

export async function getPersonalizedInvite(req: Request, res: Response) {
  try {
    const { slug, guestCode } = req.params;
    if (!slug || !guestCode) {
      return res.status(400).json({ success: false, error: 'ValidationError', message: 'Slug and guestCode parameters are required' });
    }

    const cleanSlug = String(slug).trim().toLowerCase();
    const cleanGuestCode = String(guestCode).trim().toUpperCase();

    let event = await EventModel.findOne({ slug: cleanSlug });
    if (!event && (cleanSlug.startsWith('evt-') || mongoose.Types.ObjectId.isValid(cleanSlug))) {
      event = await EventModel.findOne({ id: cleanSlug });
    }

    if (!event) {
      return res.status(404).json({ success: false, error: 'NotFound', message: 'Invitation not found or no longer available' });
    }

    const guest = await GuestModel.findOne({
      eventId: event.id,
      guestCode: cleanGuestCode
    });

    return res.json({
      success: true,
      event: {
        id: event.id,
        slug: event.slug,
        title: event.title,
        hostNames: event.hostNames,
        celebrationType: event.celebrationType,
        date: event.date,
        time: event.time,
        venueName: event.venueName,
        venueAddress: event.venueAddress,
        googleMapsUrl: event.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venueAddress || event.venueName)}`,
        invitationMessage: event.invitationMessage,
        imageUrl: event.imageUrl,
        imageSource: (event as any).imageSource || (event.imageUrl?.startsWith('http') ? 'url' : 'upload'),
        googleDriveFileId: (event as any).googleDriveFileId || '',
        imagePosition: event.imagePosition,
        imageAspect: event.imageAspect,
        imageFit: event.imageFit,
        rsvpDeadline: event.rsvpDeadline
      },
      guest: guest
        ? {
            id: guest.id,
            guestCode: guest.guestCode,
            name: guest.name,
            mobileNumber: guest.mobileNumber,
            maxGuests: guest.maxGuests || 2,
            status: guest.status,
            attendingCount: guest.attendingCount,
            notes: guest.notes,
            dietaryPreferences: guest.dietaryPreferences
          }
        : null
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'ServerError', message: err.message || 'Error fetching guest invitation from MongoDB' });
  }
}

export async function submitRsvp(req: Request, res: Response) {
  try {
    const {
      slug,
      guestCode,
      name,
      mobileNumber,
      status,
      attendingCount,
      notes,
      dietaryPreferences
    } = req.body;

    if (!slug || !status || !['attending', 'declined'].includes(status)) {
      return res.status(400).json({ success: false, error: 'ValidationError', message: 'Valid event slug and status ("attending" or "declined") required' });
    }

    const event = await EventModel.findOne({ slug: String(slug).toLowerCase() });
    if (!event) {
      return res.status(404).json({ success: false, error: 'NotFound', message: 'Event not found' });
    }

    let matchedGuest: any = null;

    if (guestCode) {
      matchedGuest = await GuestModel.findOne({
        eventId: event.id,
        guestCode: String(guestCode).toUpperCase()
      });
    }

    const maxAllowed = matchedGuest ? (matchedGuest.maxGuests || 6) : 6;
    const count = status === 'attending' ? Math.min(maxAllowed, Math.max(1, Number(attendingCount) || 1)) : 0;

    if (matchedGuest) {
      matchedGuest.status = status;
      matchedGuest.attendingCount = count;
      if (name && name.trim()) matchedGuest.name = name.trim();
      if (mobileNumber !== undefined) matchedGuest.mobileNumber = mobileNumber.trim();
      if (notes !== undefined) matchedGuest.notes = notes.trim();
      if (dietaryPreferences !== undefined) matchedGuest.dietaryPreferences = dietaryPreferences.trim();
      await matchedGuest.save();
    } else {
      const cleanName = (name && name.trim()) || 'Attending Guest';
      let newGuestCode = `G-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      while (await GuestModel.exists({ eventId: event.id, guestCode: newGuestCode })) {
        newGuestCode = `G-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      }

      matchedGuest = await GuestModel.create({
        id: `gst-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        eventId: event.id,
        guestCode: newGuestCode,
        name: cleanName,
        mobileNumber: mobileNumber ? String(mobileNumber).trim() : '',
        maxGuests: 6,
        status: status,
        attendingCount: count,
        notes: notes ? String(notes).trim() : '',
        dietaryPreferences: dietaryPreferences ? String(dietaryPreferences).trim() : ''
      });
    }

    return res.json({
      success: true,
      message: 'RSVP submitted successfully',
      guest: {
        id: matchedGuest.id,
        guestCode: matchedGuest.guestCode,
        name: matchedGuest.name,
        mobileNumber: matchedGuest.mobileNumber,
        maxGuests: matchedGuest.maxGuests,
        status: matchedGuest.status,
        attendingCount: matchedGuest.attendingCount,
        notes: matchedGuest.notes,
        dietaryPreferences: matchedGuest.dietaryPreferences
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'ServerError', message: 'Failed to process RSVP submission' });
  }
}
