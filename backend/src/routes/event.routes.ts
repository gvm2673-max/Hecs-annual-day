import { Router } from 'express';
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
} from '../controllers/event.controller.js';
import {
  getEventGuests,
  createGuest,
  updateGuest,
  deleteGuest,
  importGuestsCsv
} from '../controllers/guest.controller.js';
import { requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Event Routes
router.get('/events', requireAdmin, getAllEvents);
router.get('/events/:id', requireAdmin, getEventById);
router.post('/events', requireAdmin, createEvent);
router.put('/events/:id', requireAdmin, updateEvent);
router.delete('/events/:id', requireAdmin, deleteEvent);

// Guest Routes under Event
router.get('/events/:id/guests', requireAdmin, getEventGuests);
router.post('/events/:id/guests', requireAdmin, createGuest);
router.put('/events/:id/guests/:guestId', requireAdmin, updateGuest);
router.delete('/events/:id/guests/:guestId', requireAdmin, deleteGuest);
router.post('/events/:id/guests/import', requireAdmin, importGuestsCsv);

export default router;
