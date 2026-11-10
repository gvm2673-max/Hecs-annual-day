import React, { useState } from 'react';
import { X, Copy, Check, Share2, MessageCircle, ExternalLink, QrCode } from 'lucide-react';
import { EventItem, GuestItem } from '../../types';
import { QRCodeCanvas } from '../../utils/qr';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem;
  guests: GuestItem[];
  preselectedGuest?: GuestItem | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  event,
  guests,
  preselectedGuest
}) => {
  const [selectedGuestId, setSelectedGuestId] = useState<string>(
    preselectedGuest?.id || ''
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = window.location.origin;
  const currentGuest = guests.find((g) => g.id === selectedGuestId) || preselectedGuest;

  const invitePath = currentGuest
    ? `/${event.slug}/${currentGuest.guestCode}`
    : `/${event.slug}`;

  const fullUrl = `${origin}${invitePath}`;

  const titleSegment = event.title ? ` for "${event.title}"` : '';
  const whatsappText = currentGuest
    ? `Dear ${currentGuest.name},\n\nYou are cordially invited to celebrate with ${event.hostNames}${titleSegment} on ${event.date}.\n\nKindly view your formal digital invitation and RSVP here:\n${fullUrl}`
    : `You are cordially invited to celebrate with ${event.hostNames}${titleSegment} on ${event.date}.\n\nKindly view your digital invitation and RSVP here:\n${fullUrl}`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;
  const smsUrl = `sms:?&body=${encodeURIComponent(whatsappText)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="p-5 sm:px-6 border-b border-[#E5E7EB] bg-[#F1F8F2] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] flex items-center justify-center text-[#16834A] shadow-xs">
              <Share2 className="w-5 h-5 text-[#16834A]" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#16834A]">
                Event Distribution
              </span>
              <h2 className="text-xl font-bold text-[#1F2937]">
                Share Digital Invitation
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

        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1.5">
              Select Recipient Type
            </label>
            <select
              value={selectedGuestId}
              onChange={(e) => setSelectedGuestId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-sm text-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A]"
            >
              <option value="">🌐 General Public Invitation Link (Anyone can RSVP)</option>
              {guests.map((g) => (
                <option key={g.id} value={g.id}>
                  👤 {g.name} (Code: {g.guestCode}) — {g.status}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#6B7280] mt-1">
              {currentGuest
                ? `Personalized invite for ${currentGuest.name}. Opens envelope with personalized greeting.`
                : 'General link for open distribution or group announcements.'}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#F1F8F2] border border-[#E5E7EB] text-center">
            <div className="p-3 bg-white rounded-xl shadow-xs border border-[#E5E7EB]">
              <QRCodeCanvas value={fullUrl} size={170} />
            </div>
            <p className="text-xs text-[#1F2937] mt-3 font-semibold flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-[#16834A]" />
              <span>Scan to preview or open invitation on mobile</span>
            </p>
            <span className="text-[11px] text-[#6B7280] font-mono mt-0.5">
              {invitePath}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1.5">
              Direct Invitation URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={fullUrl}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-xs font-mono text-[#1F2937] truncate select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-4 py-2.5 rounded-xl bg-[#16834A] hover:bg-[#136f3e] text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <span className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937]">
              One-Click Direct Sharing
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20b858] text-white font-semibold text-xs tracking-wide shadow-xs transition-all"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Send via WhatsApp</span>
              </a>

              <a
                href={smsUrl}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#16834A] hover:bg-[#136f3e] text-white font-semibold text-xs tracking-wide shadow-xs transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Send via SMS / Text</span>
              </a>
            </div>

            <a
              href={invitePath}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#F1F8F2] hover:bg-[#e2f1e4] text-[#16834A] font-semibold text-xs tracking-wide transition-colors border border-[#E5E7EB]"
            >
              <span>Test Preview in New Tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
