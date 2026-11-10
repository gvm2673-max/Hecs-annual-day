import { Request, Response } from 'express';
import crypto from 'crypto';
import { EventModel } from '../models/event.model.js';
import { GuestModel } from '../models/guest.model.js';

export async function getAllEvents(req: Request, res: Response) {
  try {
    const events = await EventModel.find().sort({ createdAt: -1 });
    const formatted = events.map((ev) => ({
      id: ev.id,
      slug: ev.slug,
      title: ev.title,
      hostNames: ev.hostNames,
      celebrationType: ev.celebrationType,
      date: ev.date,
      time: ev.time,
      venueName: ev.venueName,
      venueAddress: ev.venueAddress,
      googleMapsUrl: ev.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.venueAddress || ev.venueName)}`,
      invitationMessage: ev.invitationMessage,
      imageUrl: ev.imageUrl,
      imageSource: (ev as any).imageSource || (ev.imageUrl?.startsWith('http') ? 'url' : 'upload'),
      googleDriveFileId: (ev as any).googleDriveFileId || '',
      imagePosition: ev.imagePosition,
      imageAspect: ev.imageAspect,
      imageFit: ev.imageFit,
      rsvpDeadline: ev.rsvpDeadline,
      createdAt: ev.createdAt,
      updatedAt: ev.updatedAt
    }));
    return res.json(formatted);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'ServerError', message: 'Failed to fetch events from MongoDB' });
  }
}

export async function getEventById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const event = await EventModel.findOne({ id });
    if (!event) {
      return res.status(404).json({ success: false, error: 'NotFound', message: 'Event not found' });
    }
    return res.json({
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
      rsvpDeadline: event.rsvpDeadline,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'ServerError', message: 'Failed to fetch event details' });
  }
}

export async function createEvent(req: Request, res: Response) {
  try {
    const {
      title,
      hostNames,
      celebrationType,
      date,
      time,
      venueName,
      venueAddress,
      googleMapsUrl,
      invitationMessage,
      imageUrl,
      imageSource,
      googleDriveFileId,
      imagePosition,
      imageAspect,
      imageFit,
      rsvpDeadline,
      slug
    } = req.body;

    if (!hostNames || !date) {
      return res.status(400).json({ success: false, error: 'ValidationError', message: 'Host Names and Date are required.' });
    }

    let baseSlug = (slug || `${celebrationType || 'event'}-${hostNames}`)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!baseSlug) baseSlug = `event-${Date.now()}`;

    let finalSlug = baseSlug;
    let counter = 1;
    while (await EventModel.exists({ slug: finalSlug })) {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    const eventId = `evt-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    const newEvent = await EventModel.create({
      id: eventId,
      slug: finalSlug,
      title: title || '',
      hostNames,
      celebrationType: celebrationType || 'Celebration',
      date,
      time: time || '5:00 PM',
      venueName: venueName || '',
      venueAddress: venueAddress || '',
      googleMapsUrl: googleMapsUrl || '',
      invitationMessage: invitationMessage || '',
      imageUrl: imageUrl || '',
      imageSource: imageSource || 'upload',
      googleDriveFileId: googleDriveFileId || '',
      imagePosition: imagePosition || 'top',
      imageAspect: imageAspect || 'auto',
      imageFit: imageFit || 'cover',
      rsvpDeadline: rsvpDeadline || ''
    });

    return res.status(201).json(newEvent);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'ServerError', message: 'Failed to save event to MongoDB' });
  }
}

export async function updateEvent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await EventModel.findOne({ id });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'NotFound', message: 'Event not found' });
    }

    const {
      title,
      hostNames,
      celebrationType,
      date,
      time,
      venueName,
      venueAddress,
      googleMapsUrl,
      invitationMessage,
      imageUrl,
      imageSource,
      googleDriveFileId,
      imagePosition,
      imageAspect,
      imageFit,
      rsvpDeadline,
      slug
    } = req.body;

    if (hostNames !== undefined && !hostNames.trim()) {
      return res.status(400).json({ success: false, error: 'ValidationError', message: 'Host Names cannot be empty.' });
    }
    if (date !== undefined && !date.trim()) {
      return res.status(400).json({ success: false, error: 'ValidationError', message: 'Event Date cannot be empty.' });
    }

    if (title !== undefined) existing.title = title.trim();
    if (hostNames !== undefined) existing.hostNames = hostNames.trim();
    if (celebrationType !== undefined) existing.celebrationType = celebrationType.trim();
    if (date !== undefined) existing.date = date.trim();
    if (time !== undefined) existing.time = time.trim();
    if (venueName !== undefined) existing.venueName = venueName.trim();
    if (venueAddress !== undefined) existing.venueAddress = venueAddress.trim();
    if (googleMapsUrl !== undefined) existing.googleMapsUrl = googleMapsUrl.trim();
    if (invitationMessage !== undefined) existing.invitationMessage = invitationMessage.trim();

    if (imageUrl !== undefined) {
      existing.imageUrl = imageUrl;
    }
    if (imageSource !== undefined) {
      (existing as any).imageSource = imageSource;
    }
    if (googleDriveFileId !== undefined) {
      (existing as any).googleDriveFileId = googleDriveFileId;
    }
    if (imagePosition !== undefined) existing.imagePosition = imagePosition;
    if (imageAspect !== undefined) existing.imageAspect = imageAspect;
    if (imageFit !== undefined) existing.imageFit = imageFit;
    if (rsvpDeadline !== undefined) existing.rsvpDeadline = rsvpDeadline.trim();

    if (slug && slug.trim().toLowerCase() !== existing.slug) {
      const cleanSlug = slug.trim().toLowerCase();
      const slugExists = await EventModel.exists({ slug: cleanSlug, id: { $ne: id } });
      if (slugExists) {
        return res.status(400).json({ success: false, error: 'ValidationError', message: 'Event URL slug already in use by another event.' });
      }
      existing.slug = cleanSlug;
    }

    await existing.save();
    return res.json(existing);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'ServerError', message: 'Failed to update event in MongoDB' });
  }
}

export async function deleteEvent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const event = await EventModel.findOneAndDelete({ id });
    if (!event) {
      return res.status(404).json({ success: false, error: 'NotFound', message: 'Event not found' });
    }
    await GuestModel.deleteMany({ eventId: id });
    return res.json({ success: true, message: 'Event and associated guests deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'ServerError', message: 'Failed to delete event from MongoDB' });
  }
}
