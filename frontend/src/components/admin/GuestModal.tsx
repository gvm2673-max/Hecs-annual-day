import React, { useState } from 'react';
import { X, Check, AlertCircle, Trash2, UserPlus, Users } from 'lucide-react';
import { GuestItem } from '../../types';
import { apiRequest } from '../../utils/api';

interface GuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  guestToEdit?: GuestItem | null;
  onSave: (guest: GuestItem) => void;
  onDelete?: (guestId: string, guestName: string) => void;
  token: string;
}

export const GuestModal: React.FC<GuestModalProps> = ({
  isOpen,
  onClose,
  eventId,
  guestToEdit,
  onSave,
  onDelete,
  token
}) => {
  const [name, setName] = useState(guestToEdit?.name || '');
  const [mobileNumber, setMobileNumber] = useState(guestToEdit?.mobileNumber || '');
  const [customCode, setCustomCode] = useState(guestToEdit?.guestCode || '');
  const [maxGuests, setMaxGuests] = useState<number>(guestToEdit?.maxGuests || 2);
  const [status, setStatus] = useState<'pending' | 'attending' | 'declined'>(
    guestToEdit?.status || 'pending'
  );
  const [attendingCount, setAttendingCount] = useState<number>(
    guestToEdit?.attendingCount !== undefined ? guestToEdit.attendingCount : 0
  );
  const [notes, setNotes] = useState(guestToEdit?.notes || '');
  const [dietaryPreferences, setDietaryPreferences] = useState(
    guestToEdit?.dietaryPreferences || ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Guest name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        mobileNumber: mobileNumber.trim(),
        guestCode: customCode.trim().toUpperCase(),
        maxGuests: Number(maxGuests) || 2,
        status,
        attendingCount: status === 'attending' ? Math.max(1, Number(attendingCount) || 1) : 0,
        notes: notes.trim(),
        dietaryPreferences: dietaryPreferences.trim()
      };

      const url = guestToEdit
        ? `/api/events/${eventId}/guests/${guestToEdit.id}`
        : `/api/events/${eventId}/guests`;
      const method = guestToEdit ? 'PUT' : 'POST';

      const data = await apiRequest<GuestItem>(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      onSave(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save guest');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="p-5 sm:px-6 border-b border-[#E5E7EB] bg-[#F1F8F2] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] flex items-center justify-center text-[#16834A] shadow-xs">
              <UserPlus className="w-5 h-5 text-[#16834A]" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#16834A]">
                Guest Directory
              </span>
              <h2 className="text-xl font-bold text-[#1F2937]">
                {guestToEdit ? 'Edit Guest Record' : 'Add New Guest'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FFFFFF] hover:bg-[#E5E7EB] text-[#1F2937] flex items-center justify-center transition-colors cursor-pointer border border-[#E5E7EB]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1">
              Guest / Party Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Eleanor Parker & Guest"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-sm text-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="e.g. +1 555-0192"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-sm text-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1">
                Guest Code (URL access)
              </label>
              <input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder="Auto-generated if empty"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-sm text-[#1F2937] uppercase font-mono focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1">
                Max Allowed In Party
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={maxGuests}
                onChange={(e) => setMaxGuests(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-sm text-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1">
                Current RSVP Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  const s = e.target.value as 'pending' | 'attending' | 'declined';
                  setStatus(s);
                  if (s === 'attending' && attendingCount === 0) setAttendingCount(1);
                  if (s === 'declined') setAttendingCount(0);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-sm text-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A]"
              >
                <option value="pending">⏳ Pending Response</option>
                <option value="attending">✓ Joyfully Attending</option>
                <option value="declined">✕ Regretfully Declined</option>
              </select>
            </div>
          </div>

          {status === 'attending' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1">
                Confirmed Attending Headcount
              </label>
              <input
                type="number"
                min={1}
                max={maxGuests}
                value={attendingCount}
                onChange={(e) => setAttendingCount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-sm text-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1">
              Dietary Preferences
            </label>
            <input
              type="text"
              value={dietaryPreferences}
              onChange={(e) => setDietaryPreferences(e.target.value)}
              placeholder="e.g. Vegetarian, Nut Allergy"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-sm text-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1">
              Internal Notes / Message
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Table assignment, special notes, etc."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-sm text-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A] resize-none"
            />
          </div>

          <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between gap-3">
            {guestToEdit && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(guestToEdit.id, guestToEdit.name);
                }}
                className="py-2.5 px-3 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-semibold tracking-wide transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Guest</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-[#F1F8F2] hover:bg-[#e2f1e4] text-[#1F2937] text-xs font-semibold tracking-wide transition-colors cursor-pointer border border-[#E5E7EB]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="py-2.5 px-6 rounded-xl bg-[#16834A] hover:bg-[#136f3e] text-white text-xs font-semibold tracking-wide shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{guestToEdit ? 'Update Guest' : 'Add Guest'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
