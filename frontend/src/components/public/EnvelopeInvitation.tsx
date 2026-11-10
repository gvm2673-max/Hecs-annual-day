import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  Check,
  X,
  Sparkles,
  Users,
  Maximize2,
  Lock,
  Building2
} from 'lucide-react';
import { EventItem, GuestItem } from '../../types';
import { triggerConfetti } from '../../utils/confetti';
import { apiRequest } from '../../utils/api';
import { HecsLogo } from '../../theme';

interface EnvelopeInvitationProps {
  event: EventItem;
  guest: GuestItem | null;
  onRsvpSuccess?: (updatedGuest: GuestItem) => void;
  onAdminAccess?: () => void;
}

export const EnvelopeInvitation: React.FC<EnvelopeInvitationProps> = ({
  event,
  guest: initialGuest,
  onRsvpSuccess,
  onAdminAccess
}) => {
  // Envelope state: 'sealed' -> 'unfolding' -> 'opened'
  const [envelopeState, setEnvelopeState] = useState<'sealed' | 'unfolding' | 'opened'>('sealed');
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  // Guest & RSVP state
  const [guest, setGuest] = useState<GuestItem | null>(initialGuest);
  const [rsvpStatus, setRsvpStatus] = useState<'attending' | 'declined' | null>(
    initialGuest?.status && initialGuest.status !== 'pending' ? initialGuest.status : null
  );
  const [attendingCount, setAttendingCount] = useState<number>(
    initialGuest?.attendingCount && initialGuest.attendingCount > 0
      ? initialGuest.attendingCount
      : 1
  );
  const [guestName, setGuestName] = useState(initialGuest?.name || '');
  const [mobileNumber, setMobileNumber] = useState(initialGuest?.mobileNumber || '');
  const [dietary, setDietary] = useState(initialGuest?.dietaryPreferences || '');
  const [notes, setNotes] = useState(initialGuest?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isEditingRsvp, setIsEditingRsvp] = useState(
    !initialGuest || initialGuest.status === 'pending'
  );

  const maxAllowed = initialGuest?.maxGuests || 6;

  const effectiveAspect = event.imageAspect || (isPortrait ? 'portrait' : 'auto');
  const effectivePosition = event.imagePosition || (isPortrait ? 'top' : 'top');
  const effectiveFit = event.imageFit || 'cover';

  const positionClass =
    effectivePosition === 'center'
      ? 'object-center'
      : effectivePosition === 'bottom'
      ? 'object-bottom'
      : 'object-top';

  let containerClass =
    'relative w-full aspect-[4/5] sm:aspect-[3/4] max-h-[580px] rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-sm bg-[#F1F8F2]';
  let imgClass = `relative z-10 w-full h-full object-cover ${positionClass}`;

  if (effectiveFit === 'contain') {
    containerClass =
      'relative w-full min-h-[300px] max-h-[580px] rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-sm bg-black/5 flex items-center justify-center p-2';
    imgClass = 'relative z-10 max-h-[560px] w-auto max-w-full object-contain rounded-xl';
  } else if (effectiveAspect === 'portrait') {
    containerClass =
      'relative w-full aspect-[4/5] sm:aspect-[3/4] max-h-[580px] rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-sm bg-[#F1F8F2]';
    imgClass = `relative z-10 w-full h-full object-cover ${positionClass}`;
  } else if (effectiveAspect === 'landscape') {
    containerClass =
      'relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-sm bg-[#F1F8F2]';
    imgClass = `relative z-10 w-full h-full object-cover ${positionClass}`;
  } else if (effectiveAspect === 'square') {
    containerClass =
      'relative w-full aspect-square max-h-[500px] rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-sm bg-[#F1F8F2]';
    imgClass = `relative z-10 w-full h-full object-cover ${positionClass}`;
  } else {
    containerClass = isPortrait
      ? 'relative w-full aspect-[4/5] sm:aspect-[3/4] max-h-[580px] rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-sm bg-[#F1F8F2]'
      : 'relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-[#E5E7EB] shadow-sm bg-[#F1F8F2]';
    imgClass = `relative z-10 w-full h-full object-cover ${positionClass}`;
  }

  const handleOpenEnvelope = () => {
    if (envelopeState !== 'sealed') return;
    setEnvelopeState('unfolding');
    setTimeout(() => {
      setEnvelopeState('opened');
    }, 2200);
  };

  const handleInstantOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEnvelopeState('opened');
  };

  const formattedDate = (() => {
    try {
      if (!event.date) return '';
      const [y, m, d] = event.date.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return event.date;
    }
  })();

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpStatus) {
      setSubmitError('Please select whether you will attend or decline.');
      return;
    }
    if (!guest && !guestName.trim()) {
      setSubmitError('Please provide your name.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        slug: event.slug,
        guestCode: guest?.guestCode,
        name: guest ? guest.name : guestName.trim(),
        mobileNumber: guest ? guest.mobileNumber : mobileNumber.trim(),
        status: rsvpStatus,
        attendingCount: rsvpStatus === 'attending' ? attendingCount : 0,
        dietaryPreferences: dietary.trim(),
        notes: notes.trim()
      };

      const data = await apiRequest<{ guest?: GuestItem }>('/api/public/rsvp', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (data.guest) {
        setGuest(data.guest);
        if (data.guest.guestCode) {
          const newPath = `/${event.slug}/${data.guest.guestCode}`;
          if (window.location.pathname !== newPath) {
            window.history.replaceState({}, '', newPath);
          }
        }
        if (onRsvpSuccess) onRsvpSuccess(data.guest);
      }

      setIsEditingRsvp(false);

      if (rsvpStatus === 'attending') {
        triggerConfetti();
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Error saving response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const mapsUrl =
    event.googleMapsUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${event.venueName} ${event.venueAddress}`
    )}`;

  const makeCalendarUrl = () => {
    const text = encodeURIComponent(event.title || event.hostNames);
    const details = encodeURIComponent(
      `${event.invitationMessage}\n\nHosted by: ${event.hostNames}`
    );
    const location = encodeURIComponent(`${event.venueName}, ${event.venueAddress}`);
    const cleanDate = event.date.replace(/-/g, '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${cleanDate}T180000Z/${cleanDate}T220000Z&details=${details}&location=${location}`;
  };

  return (
    <div className="min-h-screen bg-[#F1F8F2] py-6 sm:py-12 px-3 sm:px-6 flex flex-col items-center justify-start relative overflow-x-hidden selection:bg-[#16834A]/20 selection:text-[#16834A]">
      {/* Background Subtle Dot Grid in Soft Green */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30 bg-[radial-gradient(#16834A_1px,transparent_1px)] [background-size:24px_24px]"
        aria-hidden="true"
      />

      {/* Admin Quick Access Button */}
      <button
        type="button"
        id="btn-admin-access-corner"
        onClick={() => {
          if (onAdminAccess) {
            onAdminAccess();
          } else {
            window.location.href = '/admin';
          }
        }}
        className="fixed top-3.5 right-3.5 sm:top-4 sm:right-4 z-40 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FFFFFF]/90 hover:bg-white text-[#1F2937] hover:text-[#16834A] text-xs font-semibold border border-[#E5E7EB] shadow-xs backdrop-blur-xs transition-all cursor-pointer hover:shadow-sm"
        title="HECS Restricted Administrator Portal"
      >
        <Lock className="w-3.5 h-3.5 text-[#16834A]" />
        <span className="text-[11px] tracking-wide">Host Portal</span>
      </button>

      {/* Corporate Header Branding Pill */}
      <header className="mb-6 flex items-center justify-center">
        <div className="bg-[#FFFFFF] px-5 py-2 rounded-full border border-[#E5E7EB] shadow-xs flex items-center gap-3">
          <HecsLogo className="h-7 w-auto" />
          <span className="h-4 w-[1px] bg-[#E5E7EB]" />
          <span className="text-xs font-semibold text-[#1F2937] tracking-wider uppercase">
            Official Invitation
          </span>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {envelopeState !== 'opened' ? (
          <motion.div
            key="envelope-view"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -40 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg mx-auto flex flex-col items-center justify-center my-auto pt-2 pb-12 cursor-pointer perspective-1000"
            onClick={handleOpenEnvelope}
            id="interactive-envelope-container"
          >
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6 flex flex-col items-center text-center px-4"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFFFFF] border border-[#E5E7EB] text-[#16834A] text-xs uppercase tracking-widest font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#16834A] animate-pulse" />
                <span>HECS Event Invitation</span>
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-bold text-[#1F2937] tracking-tight">
                {guest?.name
                  ? `An Invitation For You — ${guest.name}`
                  : 'An Invitation For You'}
              </h1>
              <p className="text-xs font-semibold text-[#6B7280] mt-1 tracking-wider uppercase">
                {event.hostNames}
              </p>
            </motion.div>

            {/* WHITE & GREEN CORPORATE ENVELOPE */}
            <div className="relative w-full max-w-[390px] sm:max-w-[430px] aspect-[1.38/1] rounded-2xl bg-gradient-to-b from-[#FFFFFF] via-[#F1F8F2] to-[#E2F1E4] shadow-[0_20px_50px_-15px_rgba(22,131,74,0.25),0_0_0_1px_rgba(229,231,235,0.8)] p-3 preserve-3d overflow-hidden border border-[#E5E7EB]">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent opacity-80 pointer-events-none" />

              <div className="w-full h-full rounded-xl border border-dashed border-[#A7D7B9] relative flex flex-col items-center justify-center p-6 text-center overflow-hidden">
                <div className="absolute top-2 left-2 text-[#16834A]/50 text-xs select-none">✦</div>
                <div className="absolute top-2 right-2 text-[#16834A]/50 text-xs select-none">✦</div>
                <div className="absolute bottom-2 left-2 text-[#16834A]/50 text-xs select-none">✦</div>
                <div className="absolute bottom-2 right-2 text-[#16834A]/50 text-xs select-none">✦</div>

                {/* Geometric Fold Guidelines */}
                <div className="absolute inset-0 pointer-events-none opacity-20">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <line x1="0" y1="100" x2="50" y2="45" stroke="#16834A" strokeWidth="0.8" />
                    <line x1="100" y1="100" x2="50" y2="45" stroke="#16834A" strokeWidth="0.8" />
                  </svg>
                </div>

                {/* Envelope Flap */}
                <motion.div
                  className="absolute -top-1 inset-x-0 h-[52%] origin-top preserve-3d z-20"
                  animate={
                    envelopeState === 'unfolding'
                      ? {
                          rotateX: -180,
                          transition: { duration: 1.2, ease: [0.45, 0, 0.55, 1] }
                        }
                      : { rotateX: 0 }
                  }
                >
                  <div className="w-full h-full bg-gradient-to-b from-[#FFFFFF] to-[#E2F1E4] shadow-md border-b border-[#A7D7B9] [clip-path:polygon(0_0,100%_0,50%_100%)] flex items-end justify-center pb-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#16834A]/40 mb-1" />
                  </div>
                </motion.div>

                {/* Inner Card Preview Slide */}
                <motion.div
                  className="absolute inset-x-6 top-8 bottom-6 bg-[#FFFFFF] rounded-lg shadow-inner border border-[#E5E7EB] p-4 flex flex-col items-center justify-center z-10"
                  animate={
                    envelopeState === 'unfolding'
                      ? {
                          y: -70,
                          scale: 1.05,
                          opacity: 1,
                          transition: { delay: 0.8, duration: 1.2, ease: 'easeOut' }
                        }
                      : { y: 0, opacity: 0.9 }
                  }
                >
                  <p className="text-lg font-bold text-[#1F2937]">
                    {event.celebrationType}
                  </p>
                  <p className="text-xs text-[#16834A] font-semibold tracking-widest uppercase mt-1">
                    {formattedDate}
                  </p>
                </motion.div>

                {/* HECS EMERALD WAX SEAL EMBLEM */}
                <motion.div
                  className="relative z-30 flex flex-col items-center mt-2"
                  animate={
                    envelopeState === 'unfolding'
                      ? {
                          scale: [1, 1.25, 0.3],
                          opacity: [1, 1, 0],
                          rotate: [0, -10, 20],
                          transition: { duration: 0.9, ease: 'easeInOut' }
                        }
                      : {
                          scale: [1, 1.02, 1],
                          transition: { repeat: Infinity, duration: 3, ease: 'easeInOut' }
                        }
                  }
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#16834A] via-[#136f3e] to-[#0f5932] shadow-[0_8px_20px_rgba(22,131,74,0.45),inset_0_2px_4px_rgba(255,255,255,0.4),inset_0_-3px_6px_rgba(0,0,0,0.35)] border-2 border-[#27AE60] flex items-center justify-center p-1 relative">
                    <div className="w-14 h-14 rounded-full border border-dashed border-white/40 flex flex-col items-center justify-center shadow-inner">
                      <span className="font-bold text-lg text-white tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                        HECS
                      </span>
                      <span className="text-[8px] text-[#A7D7B9] font-bold uppercase tracking-wider -mt-0.5">
                        SEALED
                      </span>
                    </div>
                  </div>
                </motion.div>

                <div className="relative z-30 mt-4 text-[#16834A] flex items-center gap-1.5 text-xs font-semibold tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-[#16834A]" />
                  <span>
                    {envelopeState === 'unfolding'
                      ? 'Unfolding Invitation...'
                      : 'Tap to unseal & reveal invitation'}
                  </span>
                </div>
              </div>
            </div>

            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={handleInstantOpen}
              className="mt-6 text-xs text-[#6B7280] hover:text-[#16834A] underline underline-offset-4 tracking-wider transition-colors cursor-pointer py-1 px-3"
            >
              Open Immediately without animation
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="invitation-card"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-xl mx-auto flex flex-col items-center"
            id="public-invitation-main"
          >
            {/* INVITATION CARD (PURE WHITE #FFFFFF + CLEAN BORDERS #E5E7EB + SUBTLE SHADOWS) */}
            <div className="w-full bg-[#FFFFFF] rounded-3xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1),0_0_0_1px_rgba(229,231,235,0.8)] border border-[#E5E7EB] overflow-hidden relative">
              {/* Green Header Accent Bar */}
              <div className="h-2 bg-gradient-to-r from-[#16834A] via-[#27AE60] to-[#16834A]" />

              <div className="pt-8 pb-4 px-6 sm:px-10 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#F1F8F2] border border-[#E5E7EB] flex items-center justify-center text-[#16834A] mb-4 shadow-xs">
                  <Building2 className="w-7 h-7 text-[#16834A]" />
                </div>

                <span className="text-xs uppercase tracking-[0.25em] text-[#16834A] font-bold">
                  {event.celebrationType || 'Formal Invitation'}
                </span>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1F2937] tracking-tight mt-3 leading-tight">
                  {event.hostNames}
                </h1>

                <div className="flex items-center justify-center gap-3 my-4 w-full max-w-[200px]">
                  <div className="h-[1px] bg-gradient-to-r from-transparent via-[#16834A] to-transparent flex-1" />
                  <span className="text-[#16834A] text-xs">✦</span>
                  <div className="h-[1px] bg-gradient-to-r from-transparent via-[#16834A] to-transparent flex-1" />
                </div>

                {event.title && (
                  <h2 className="text-xl sm:text-2xl font-bold text-[#1F2937]">
                    {event.title}
                  </h2>
                )}

                <div className="mt-4 max-w-md text-[#6B7280] text-sm sm:text-base leading-relaxed px-2">
                  {event.invitationMessage}
                </div>
              </div>

              {/* Event Image Feature */}
              {event.imageUrl && (
                <div className="px-6 sm:px-10 py-3">
                  <div
                    className={`${containerClass} group cursor-pointer transition-transform duration-300 hover:shadow-md`}
                    onClick={() => setShowLightbox(true)}
                    title="Click to view full photo"
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center blur-2xl opacity-30 scale-110 pointer-events-none"
                      style={{ backgroundImage: `url(${event.imageUrl})` }}
                    />

                    {!photoLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#F1F8F2] animate-pulse z-10">
                        <span className="text-xs text-[#6B7280] italic">
                          Loading photo portrait...
                        </span>
                      </div>
                    )}
                    <img
                      src={event.imageUrl}
                      alt={event.title || event.hostNames}
                      referrerPolicy="no-referrer"
                      onLoad={(e) => {
                        setPhotoLoaded(true);
                        const img = e.currentTarget;
                        if (img.naturalHeight && img.naturalWidth) {
                          setIsPortrait(img.naturalHeight > img.naturalWidth * 0.92);
                        }
                      }}
                      className={`${imgClass} transition-opacity duration-700 ${
                        photoLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                    />

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowLightbox(true);
                      }}
                      className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1F2937]/80 hover:bg-[#1F2937] text-white text-[11px] font-semibold backdrop-blur-md transition-all shadow-md cursor-pointer group-hover:scale-105"
                      title="View full high-resolution photo"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-[#A7D7B9]" />
                      <span>Full Photo</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Date, Time & Venue (Light Green #F1F8F2 Secondary Background) */}
              <div className="px-6 sm:px-10 py-6 border-t border-[#E5E7EB] mt-4 bg-[#F1F8F2]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] text-[#16834A] flex items-center justify-center shrink-0 shadow-xs border border-[#E5E7EB]">
                      <Calendar className="w-5 h-5 text-[#16834A]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                        Date & Time
                      </p>
                      <p className="text-sm sm:text-base font-bold text-[#1F2937] mt-0.5">
                        {formattedDate}
                      </p>
                      <p className="text-xs text-[#6B7280] flex items-center gap-1 mt-0.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-[#16834A]" />
                        <span>{event.time}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] text-[#16834A] flex items-center justify-center shrink-0 shadow-xs border border-[#E5E7EB]">
                      <MapPin className="w-5 h-5 text-[#16834A]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                        Celebration Venue
                      </p>
                      <p className="text-sm sm:text-base font-bold text-[#1F2937] mt-0.5">
                        {event.venueName}
                      </p>
                      <p className="text-xs text-[#6B7280] mt-0.5 leading-relaxed line-clamp-2">
                        {event.venueAddress}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-[#E5E7EB] flex flex-wrap items-center justify-between gap-3">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#e2f1e4] text-[#16834A] text-xs font-semibold tracking-wide transition-all shadow-xs border border-[#E5E7EB]"
                    id="btn-view-location"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#16834A]" />
                    <span>View Location on Google Maps</span>
                    <ExternalLink className="w-3 h-3 text-[#16834A]" />
                  </a>

                  <a
                    href={makeCalendarUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1F2937] hover:text-[#16834A] transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#16834A]" />
                    <span>Add to Calendar</span>
                  </a>
                </div>

                {event.rsvpDeadline && (
                  <p className="text-center text-xs text-[#6B7280] mt-4 font-medium">
                    Kindly reply by <strong className="text-[#1F2937]">{event.rsvpDeadline}</strong>
                  </p>
                )}
              </div>

              {/* RSVP SECTION */}
              <div className="p-6 sm:p-10 bg-[#FFFFFF] border-t border-[#E5E7EB]" id="rsvp-section">
                <div className="text-center mb-6">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#16834A]">
                    RSVP Response Form
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1F2937] mt-1">
                    Will You Join Us?
                  </h3>
                  {guest?.name && (
                    <p className="text-xs text-[#6B7280] mt-1">
                      Reserved invitation for <strong className="text-[#1F2937]">{guest.name}</strong>
                    </p>
                  )}
                </div>

                {!isEditingRsvp && guest?.status && guest.status !== 'pending' ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-[#F1F8F2] rounded-2xl p-6 border border-[#E5E7EB] shadow-xs text-center"
                  >
                    <div
                      className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3 ${
                        guest.status === 'attending'
                          ? 'bg-[#16834A] text-white shadow-xs'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {guest.status === 'attending' ? (
                        <Check className="w-6 h-6 stroke-[2.5]" />
                      ) : (
                        <X className="w-6 h-6 stroke-[2.5]" />
                      )}
                    </div>

                    <h4 className="text-xl font-bold text-[#1F2937]">
                      {guest.status === 'attending'
                        ? 'Response Confirmed: Joyfully Attending!'
                        : 'Response Confirmed: Regretfully Declines'}
                    </h4>

                    {guest.status === 'attending' && (
                      <p className="text-sm text-[#16834A] mt-1.5 font-bold">
                        {guest.attendingCount} {guest.attendingCount === 1 ? 'Guest' : 'Guests'} Reserved
                      </p>
                    )}

                    {guest.dietaryPreferences && (
                      <p className="text-xs text-[#6B7280] mt-2 italic">
                        Dietary note: "{guest.dietaryPreferences}"
                      </p>
                    )}
                    {guest.notes && (
                      <p className="text-xs text-[#6B7280] mt-1 italic">
                        Message to host: "{guest.notes}"
                      </p>
                    )}

                    <div className="mt-5 pt-4 border-t border-[#E5E7EB] flex justify-center">
                      <button
                        type="button"
                        onClick={() => setIsEditingRsvp(true)}
                        className="text-xs font-bold text-[#16834A] hover:text-[#136f3e] underline underline-offset-4 tracking-wide cursor-pointer py-1 px-3"
                        id="btn-edit-rsvp"
                      >
                        Change or Update Your Response
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleRsvpSubmit} className="space-y-5">
                    {submitError && (
                      <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center font-medium">
                        {submitError}
                      </div>
                    )}

                    {!guest && (
                      <div className="space-y-3 bg-[#F1F8F2] p-4 rounded-2xl border border-[#E5E7EB]">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1">
                            Your Full Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            placeholder="e.g. Eleanor Parker"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-sm text-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1">
                            Mobile Number (Optional)
                          </label>
                          <input
                            type="tel"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            placeholder="e.g. +1 555-0199"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-sm text-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A]"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        id="btn-rsvp-attending"
                        onClick={() => {
                          setRsvpStatus('attending');
                          setSubmitError(null);
                        }}
                        className={`py-3.5 px-4 rounded-2xl text-sm font-bold tracking-wide flex items-center justify-center gap-2 border-2 transition-all cursor-pointer ${
                          rsvpStatus === 'attending'
                            ? 'bg-[#16834A] text-white border-[#16834A] shadow-md shadow-[#16834A]/25 scale-[1.01]'
                            : 'bg-white hover:bg-[#F1F8F2] text-[#1F2937] border-[#E5E7EB]'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>✓ Joyfully Attend</span>
                      </button>

                      <button
                        type="button"
                        id="btn-rsvp-declined"
                        onClick={() => {
                          setRsvpStatus('declined');
                          setSubmitError(null);
                        }}
                        className={`py-3.5 px-4 rounded-2xl text-sm font-bold tracking-wide flex items-center justify-center gap-2 border-2 transition-all cursor-pointer ${
                          rsvpStatus === 'declined'
                            ? 'bg-[#1F2937] text-white border-[#1F2937] shadow-md shadow-black/20 scale-[1.01]'
                            : 'bg-white hover:bg-[#F1F8F2] text-[#6B7280] border-[#E5E7EB]'
                        }`}
                      >
                        <X className="w-4 h-4 stroke-[2.5]" />
                        <span>✕ Regretfully Decline</span>
                      </button>
                    </div>

                    <AnimatePresence>
                      {rsvpStatus === 'attending' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-4 pt-2 overflow-hidden"
                        >
                          <div className="bg-[#F1F8F2] p-4 rounded-2xl border border-[#E5E7EB] flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <Users className="w-5 h-5 text-[#16834A]" />
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-[#1F2937]">
                                  Number of Guests Attending
                                </p>
                                <p className="text-xs text-[#6B7280]">
                                  {maxAllowed ? `Allocated party up to ${maxAllowed}` : 'Including yourself'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                id="btn-guest-decrease"
                                onClick={() => setAttendingCount((prev) => Math.max(1, prev - 1))}
                                disabled={attendingCount <= 1}
                                className="w-9 h-9 rounded-xl bg-white text-[#1F2937] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#E5E7EB] flex items-center justify-center font-bold text-lg cursor-pointer transition-colors border border-[#E5E7EB]"
                              >
                                −
                              </button>
                              <span className="w-7 text-center text-xl font-bold text-[#1F2937]">
                                {attendingCount}
                              </span>
                              <button
                                type="button"
                                id="btn-guest-increase"
                                onClick={() =>
                                  setAttendingCount((prev) => Math.min(maxAllowed, prev + 1))
                                }
                                disabled={attendingCount >= maxAllowed}
                                className="w-9 h-9 rounded-xl bg-white text-[#1F2937] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#E5E7EB] flex items-center justify-center font-bold text-lg cursor-pointer transition-colors border border-[#E5E7EB]"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1">
                              Dietary Preferences & Allergies
                            </label>
                            <input
                              type="text"
                              value={dietary}
                              onChange={(e) => setDietary(e.target.value)}
                              placeholder="e.g. Vegetarian, Gluten-free, Nut allergy"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-sm text-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1">
                              Message for the Hosts (Optional)
                            </label>
                            <textarea
                              rows={2}
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Share your warm wishes or congratulations..."
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-sm text-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A] resize-none"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="pt-2 flex items-center gap-3">
                      <button
                        type="submit"
                        id="btn-submit-rsvp"
                        disabled={!rsvpStatus || isSubmitting}
                        className="flex-1 py-3.5 px-6 rounded-2xl bg-[#16834A] hover:bg-[#136f3e] text-white font-bold text-sm tracking-wide shadow-md shadow-[#16834A]/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                            <span>Confirming RSVP...</span>
                          </>
                        ) : (
                          <>
                            <span>Confirm RSVP Response</span>
                            <Sparkles className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      {guest?.status && guest.status !== 'pending' && (
                        <button
                          type="button"
                          onClick={() => setIsEditingRsvp(false)}
                          className="py-3.5 px-4 rounded-2xl bg-[#F1F8F2] text-[#1F2937] text-xs font-semibold hover:bg-[#e2f1e4] transition-colors border border-[#E5E7EB]"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Public Footer */}
            <div className="mt-8 pt-6 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between text-xs text-[#6B7280] gap-4 mb-6 w-full">
              <div className="flex items-center gap-3">
                <HecsLogo className="h-6 w-auto" />
                <span className="text-[11px] text-[#6B7280]">
                  &copy; {new Date().getFullYear()} Huber Enviro Care Systems
                </span>
              </div>
              <button
                type="button"
                id="btn-admin-access-footer"
                onClick={() => {
                  if (onAdminAccess) {
                    onAdminAccess();
                  } else {
                    window.location.href = '/admin';
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#1F2937] hover:text-[#16834A] hover:bg-[#FFFFFF] border border-[#E5E7EB] transition-colors text-[11px] font-semibold cursor-pointer"
              >
                <Lock className="w-3 h-3 text-[#16834A]" />
                <span>Host Sign In</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Photo Lightbox Modal */}
      {showLightbox && event.imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowLightbox(false)}
        >
          <div
            className="relative max-w-4xl max-h-[92vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowLightbox(false)}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Close full photo view"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={event.imageUrl}
              alt={event.title}
              referrerPolicy="no-referrer"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl shadow-2xl object-contain border border-white/20"
            />
            <div className="mt-3 text-center">
              <p className="text-white font-bold text-base">
                {event.hostNames}
              </p>
              {event.title && (
                <p className="text-white/80 text-xs tracking-wider uppercase">
                  {event.title}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
