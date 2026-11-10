import { Request, Response } from 'express';
import crypto from 'crypto';
import { EventModel } from '../models/event.model.js';
import { GuestModel } from '../models/guest.model.js';

export async function getEventGuests(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const guests = await GuestModel.find({ eventId: id }).sort({ createdAt: -1 });
    return res.json(guests);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'ServerError', message: 'Failed to fetch guests for event' });
  }
}

export async function createGuest(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, mobileNumber, maxGuests, status, attendingCount, notes, dietaryPreferences, guestCode } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'ValidationError', message: 'Guest name is required.' });
    }

    const event = await EventModel.findOne({ id });
    if (!event) {
      return res.status(404).json({ success: false, error: 'NotFound', message: 'Event not found' });
    }

    let code = guestCode ? String(guestCode).trim().toUpperCase() : '';
    if (!code || await GuestModel.exists({ eventId: id, guestCode: code })) {
      code = `G-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    }

    const newGuest = await GuestModel.create({
      id: `gst-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      eventId: id,
      guestCode: code,
      name: name.trim(),
      mobileNumber: mobileNumber ? String(mobileNumber).trim() : '',
      maxGuests: Math.max(1, Number(maxGuests) || 2),
      status: status && ['pending', 'attending', 'declined'].includes(status) ? status : 'pending',
      attendingCount: Number(attendingCount) || 0,
      notes: notes ? String(notes).trim() : '',
      dietaryPreferences: dietaryPreferences ? String(dietaryPreferences).trim() : ''
    });

    return res.status(201).json(newGuest);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'ServerError', message: 'Failed to add guest to MongoDB' });
  }
}

export async function updateGuest(req: Request, res: Response) {
  try {
    const { guestId } = req.params;
    const existing = await GuestModel.findOne({ id: guestId });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'NotFound', message: 'Guest not found' });
    }

    const { name, mobileNumber, maxGuests, status, attendingCount, notes, dietaryPreferences, guestCode } = req.body;

    if (name !== undefined) existing.name = name.trim();
    if (mobileNumber !== undefined) existing.mobileNumber = mobileNumber.trim();
    if (maxGuests !== undefined) existing.maxGuests = Math.max(1, Number(maxGuests) || 1);
    if (status !== undefined && ['pending', 'attending', 'declined'].includes(status)) {
      existing.status = status;
    }
    if (attendingCount !== undefined) existing.attendingCount = Math.max(0, Number(attendingCount) || 0);
    if (notes !== undefined) existing.notes = notes.trim();
    if (dietaryPreferences !== undefined) existing.dietaryPreferences = dietaryPreferences.trim();

    if (guestCode && guestCode.trim().toUpperCase() !== existing.guestCode) {
      const cleanCode = guestCode.trim().toUpperCase();
      const codeExists = await GuestModel.exists({ eventId: existing.eventId, guestCode: cleanCode, id: { $ne: guestId } });
      if (codeExists) {
        return res.status(400).json({ success: false, error: 'ValidationError', message: 'Guest code already in use for this event.' });
      }
      existing.guestCode = cleanCode;
    }

    await existing.save();
    return res.json(existing);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'ServerError', message: 'Failed to update guest in MongoDB' });
  }
}

export async function deleteGuest(req: Request, res: Response) {
  try {
    const { guestId } = req.params;
    const guest = await GuestModel.findOneAndDelete({ id: guestId });
    if (!guest) {
      return res.status(404).json({ success: false, error: 'NotFound', message: 'Guest not found' });
    }
    return res.json({ success: true, message: 'Guest removed successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'ServerError', message: 'Failed to delete guest from MongoDB' });
  }
}

export async function importGuestsCsv(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { guests } = req.body;

    if (!Array.isArray(guests) || guests.length === 0) {
      return res.status(400).json({ success: false, error: 'ValidationError', message: 'No guest records provided' });
    }

    const event = await EventModel.findOne({ id });
    if (!event) {
      return res.status(404).json({ success: false, error: 'NotFound', message: 'Event not found' });
    }

    const addedGuests: any[] = [];

    for (const item of guests) {
      const name = item.name ? String(item.name).trim() : '';
      if (!name) continue;

      let code = item.guestCode ? String(item.guestCode).trim().toUpperCase() : '';
      if (!code || await GuestModel.exists({ eventId: id, guestCode: code })) {
        code = `G-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      }

      const newGuest = await GuestModel.create({
        id: `gst-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        eventId: id,
        guestCode: code,
        name,
        mobileNumber: item.mobileNumber ? String(item.mobileNumber).trim() : '',
        maxGuests: Math.max(1, Number(item.maxGuests) || 2),
        status: item.status && ['pending', 'attending', 'declined'].includes(item.status) ? item.status : 'pending',
        attendingCount: Number(item.attendingCount) || 0,
        notes: item.notes ? String(item.notes).trim() : '',
        dietaryPreferences: item.dietaryPreferences ? String(item.dietaryPreferences).trim() : ''
      });

      addedGuests.push(newGuest);
    }

    return res.json({ success: true, count: addedGuests.length, guests: addedGuests });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'ServerError', message: 'Failed to import guests to MongoDB' });
  }
}
