import { Router } from 'express';
import {
  getPrimaryEvent,
  getPublicInviteBySlug,
  getPersonalizedInvite,
  submitRsvp
} from '../controllers/public.controller.js';

const router = Router();

router.get('/public/primary-event', getPrimaryEvent);
router.get('/public/invite/:slug', getPublicInviteBySlug);
router.get('/public/invite/:slug/:guestCode', getPersonalizedInvite);
router.post('/public/rsvp', submitRsvp);

export default router;
