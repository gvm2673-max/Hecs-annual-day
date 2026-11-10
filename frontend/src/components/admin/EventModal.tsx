import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Link as LinkIcon, Check, AlertCircle, Trash2, CalendarDays, Settings2 } from 'lucide-react';
import { EventItem } from '../../types';
import { parseAndConvertImageUrl, testImageLoad } from '../../utils/image';
import { apiRequest } from '../../utils/api';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: EventItem | null;
  onSave: (event: EventItem) => void;
  onDelete?: (eventId: string, eventTitle: string) => void;
  token: string;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  eventToEdit,
  onSave,
  onDelete,
  token
}) => {
  const [slug, setSlug] = useState(eventToEdit?.slug || '');
  const [title, setTitle] = useState(eventToEdit?.title || '');
  const [hostNames, setHostNames] = useState(eventToEdit?.hostNames || '');
  const [celebrationType, setCelebrationType] = useState(eventToEdit?.celebrationType || 'Corporate Celebration');
  const [date, setDate] = useState(eventToEdit?.date || '');
  const [time, setTime] = useState(eventToEdit?.time || '4:30 PM');
  const [venueName, setVenueName] = useState(eventToEdit?.venueName || '');
  const [venueAddress, setVenueAddress] = useState(eventToEdit?.venueAddress || '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(eventToEdit?.googleMapsUrl || '');
  const [invitationMessage, setInvitationMessage] = useState(
    eventToEdit?.invitationMessage ||
      'Together with our families and team, we cordially invite you to join us in celebrating this special milestone.'
  );
  const [rsvpDeadline, setRsvpDeadline] = useState(eventToEdit?.rsvpDeadline || '');
  const [imageUrl, setImageUrl] = useState(eventToEdit?.imageUrl || '');
  const [googleDriveFileId, setGoogleDriveFileId] = useState<string>(eventToEdit?.googleDriveFileId || '');
  const [imageSource, setImageSource] = useState<'upload' | 'url' | 'google_drive'>(
    eventToEdit?.imageSource || (eventToEdit?.imageUrl?.includes('google') ? 'google_drive' : eventToEdit?.imageUrl?.startsWith('http') ? 'url' : 'upload')
  );
  const [imagePosition, setImagePosition] = useState<'top' | 'center' | 'bottom'>(
    eventToEdit?.imagePosition || 'top'
  );
  const [imageAspect, setImageAspect] = useState<'auto' | 'portrait' | 'landscape' | 'square'>(
    eventToEdit?.imageAspect || 'auto'
  );
  const [imageFit, setImageFit] = useState<'cover' | 'contain' | 'natural'>(
    eventToEdit?.imageFit || 'cover'
  );

  const [uploadTab, setUploadTab] = useState<'upload' | 'url'>(
    eventToEdit?.imageSource || (eventToEdit?.imageUrl?.startsWith('http') ? 'url' : 'upload')
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync form state when modal opens or eventToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
        setSlug(eventToEdit.slug || '');
        setTitle(eventToEdit.title || '');
        setHostNames(eventToEdit.hostNames || '');
        setCelebrationType(eventToEdit.celebrationType || 'Corporate Celebration');
        setDate(eventToEdit.date || '');
        setTime(eventToEdit.time || '4:30 PM');
        setVenueName(eventToEdit.venueName || '');
        setVenueAddress(eventToEdit.venueAddress || '');
        setGoogleMapsUrl(eventToEdit.googleMapsUrl || '');
        setInvitationMessage(
          eventToEdit.invitationMessage ||
            'Together with our families and team, we cordially invite you to join us in celebrating this special milestone.'
        );
        setRsvpDeadline(eventToEdit.rsvpDeadline || '');
        setImageUrl(eventToEdit.imageUrl || '');
        setGoogleDriveFileId(eventToEdit.googleDriveFileId || '');
        const src = eventToEdit.imageSource || (eventToEdit.imageUrl?.includes('google') ? 'google_drive' : eventToEdit.imageUrl?.startsWith('http') ? 'url' : 'upload');
        setImageSource(src);
        setUploadTab(src === 'upload' ? 'upload' : 'url');
        setImagePosition(eventToEdit.imagePosition || 'top');
        setImageAspect(eventToEdit.imageAspect || 'auto');
        setImageFit(eventToEdit.imageFit || 'cover');
      } else {
        setSlug('');
        setTitle('');
        setHostNames('');
        setCelebrationType('Corporate Celebration');
        setDate('');
        setTime('4:30 PM');
        setVenueName('');
        setVenueAddress('');
        setGoogleMapsUrl('');
        setInvitationMessage(
          'Together with our families and team, we cordially invite you to join us in celebrating this special milestone.'
        );
        setRsvpDeadline('');
        setImageUrl('');
        setGoogleDriveFileId('');
        setImageSource('upload');
        setUploadTab('upload');
        setImagePosition('top');
        setImageAspect('auto');
        setImageFit('cover');
      }
      setError(null);
    }
  }, [isOpen, eventToEdit]);

  if (!isOpen) return null;

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, WebP).');
      return;
    }

    setIsUploading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const data = await apiRequest<{ success: boolean; url: string }>('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ dataUrl: base64Data, filename: file.name })
        });

        setImageUrl(data.url);
        setImageSource('upload');
        setGoogleDriveFileId('');
      } catch (err: any) {
        setError(err.message || 'Failed to upload photo');
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setError('Error reading local file.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostNames.trim() || !date) {
      setError('Host Names and Date are required.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (imageUrl && uploadTab === 'url') {
        const parsed = parseAndConvertImageUrl(imageUrl);
        const test = await testImageLoad(parsed.url, parsed.isGoogleDrive);
        if (!test.valid) {
          setError(test.error || 'Unable to load image from provided URL.');
          setIsSaving(false);
          return;
        }
      }

      const payload = {
        slug: slug.trim(),
        title: title.trim(),
        hostNames: hostNames.trim(),
        celebrationType: celebrationType.trim(),
        date,
        time: time.trim(),
        venueName: venueName.trim(),
        venueAddress: venueAddress.trim(),
        googleMapsUrl: googleMapsUrl.trim(),
        invitationMessage: invitationMessage.trim(),
        rsvpDeadline: rsvpDeadline.trim(),
        imageUrl: imageUrl.trim(),
        imageSource,
        googleDriveFileId,
        imagePosition,
        imageAspect,
        imageFit
      };

      const url = eventToEdit ? `/api/events/${eventToEdit.id}` : '/api/events';
      const method = eventToEdit ? 'PUT' : 'POST';

      const data = await apiRequest<EventItem>(url, {
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
      setError(err.message || 'Failed to save event');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 sm:px-6 border-b border-[#E5E7EB] bg-[#F1F8F2] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] flex items-center justify-center text-[#16834A] shadow-xs">
              <CalendarDays className="w-5 h-5 text-[#16834A]" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#16834A]">
                Event Configuration
              </span>
              <h2 className="text-xl font-bold text-[#1F2937]">
                {eventToEdit ? 'Edit Event Details' : 'Create New Event'}
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

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Info: Title & Hosts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1">
                Celebration Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. HECS Annual Gala & Awards"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-sm text-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1">
                Host / Organization Names *
              </label>
              <input
                type="text"
                required
                value={hostNames}
                onChange={(e) => setHostNames(e.target.value)}
                placeholder="e.g. Huber Enviro Care Systems"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-sm text-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A]"
              />
            </div>
          </div>

          {/* Slug & Celebration Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1">
                Custom URL Slug (Direct Access)
              </label>
              <div className="relative flex items-center">
                <span className="text-xs text-[#6B7280] bg-[#F1F8F2] px-3 py-2.5 rounded-l-xl border border-r-0 border-[#E5E7EB] font-mono">
                  /
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. hecs-annual-gala"
                  className="w-full px-3.5 py-2.5 rounded-r-xl bg-[#FFFFFF] border border-[#E5E7EB] text-sm text-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A]"
                />
              </div>
              <p className="text-[11px] text-[#6B7280] mt-1">
                Shareable link: <span className="font-mono text-[#16834A]">/:slug</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1">
                Celebration Type / Category
              </label>
              <input
                type="text"
                value={celebrationType}
                onChange={(e) => setCelebrationType(e.target.value)}
                placeholder="e.g. Corporate Gala, Award Ceremony, Celebration"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-sm text-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A]"
              />
            </div>
          </div>

          {/* Date, Time & RSVP Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1">
                Event Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-sm text-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1">
                Time
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 5:00 PM IST"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-sm text-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1">
                RSVP Deadline
              </label>
              <input
                type="date"
                value={rsvpDeadline}
                onChange={(e) => setRsvpDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-sm text-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A]"
              />
            </div>
          </div>

          {/* Venue Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1">
                Venue Name
              </label>
              <input
                type="text"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                placeholder="e.g. HECS Convention Center"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-sm text-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1">
                Venue Full Address
              </label>
              <input
                type="text"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                placeholder="e.g. HECS Tower, Chennai, India"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-sm text-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A]"
              />
            </div>
          </div>

          {/* Invitation Message */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937] mb-1">
              Invitation Note / Letter to Guests
            </label>
            <textarea
              rows={3}
              value={invitationMessage}
              onChange={(e) => setInvitationMessage(e.target.value)}
              placeholder="Write a warm note to your guests..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#E5E7EB] text-sm text-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A] resize-none"
            />
          </div>

          {/* High-Resolution Photo Uploader */}
          <div className="p-4 rounded-2xl bg-[#F1F8F2] border border-[#E5E7EB] space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1F2937]">
                Event Photo / Portrait (Featured Card Image)
              </label>
              <div className="flex gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setUploadTab('upload')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    uploadTab === 'upload'
                      ? 'bg-[#16834A] text-white shadow-xs'
                      : 'bg-[#FFFFFF] text-[#1F2937] border border-[#E5E7EB] hover:bg-[#e2f1e4]'
                  }`}
                >
                  File Upload
                </button>
                <button
                  type="button"
                  onClick={() => setUploadTab('url')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    uploadTab === 'url'
                      ? 'bg-[#16834A] text-white shadow-xs'
                      : 'bg-[#FFFFFF] text-[#1F2937] border border-[#E5E7EB] hover:bg-[#e2f1e4]'
                  }`}
                >
                  Image URL
                </button>
              </div>
            </div>

            {uploadTab === 'upload' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="border-2 border-dashed border-[#A7D7B9] hover:border-[#16834A] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-white flex flex-col items-center justify-center"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                  }}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-[#F1F8F2] text-[#16834A] flex items-center justify-center mb-2 border border-[#E5E7EB]">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-[#1F2937]">
                  {isUploading ? 'Uploading High-Resolution Image...' : 'Click or Drag & Drop Photo Here'}
                </p>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Supports JPG, PNG, WebP up to 50MB
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="relative">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => {
                      setError(null);
                      const parsed = parseAndConvertImageUrl(e.target.value);
                      setImageUrl(parsed.url);
                      if (parsed.isGoogleDrive) {
                        setImageSource('google_drive');
                        setGoogleDriveFileId(parsed.fileId || '');
                      } else {
                        setImageSource('url');
                        setGoogleDriveFileId('');
                      }
                    }}
                    placeholder="https://example.com/photo.jpg or Google Drive share link"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-sm text-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A] pr-9"
                  />
                  <LinkIcon className="w-4 h-4 text-[#6B7280] absolute right-3 top-3" />
                </div>
                <p className="text-[11px] text-[#6B7280] leading-normal">
                  💡 Supports direct image URLs or Google Drive share links. Ensure Google Drive file permission is set to <strong>"Anyone with the link"</strong>.
                </p>
              </div>
            )}

            {imageUrl && (
              <div className="p-3.5 bg-white rounded-xl border border-[#E5E7EB] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1F2937]">
                    Photo Display & Framing
                  </span>
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-0.5 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    Remove Photo
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#1F2937] uppercase tracking-wider mb-1">
                      Framing / Orientation
                    </label>
                    <select
                      value={imageAspect}
                      onChange={(e) => setImageAspect(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] text-xs text-[#1F2937] focus:outline-hidden focus:ring-1 focus:ring-[#16834A]"
                    >
                      <option value="auto">Auto / Smart Adaptive</option>
                      <option value="portrait">Portrait (4:5)</option>
                      <option value="landscape">Landscape (16:10 / 16:9)</option>
                      <option value="square">Square (1:1)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#1F2937] uppercase tracking-wider mb-1">
                      Focal Alignment
                    </label>
                    <select
                      value={imagePosition}
                      onChange={(e) => setImagePosition(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#E5E7EB] text-xs text-[#1F2937] focus:outline-hidden focus:ring-1 focus:ring-[#16834A]"
                    >
                      <option value="top">Top</option>
                      <option value="center">Center</option>
                      <option value="bottom">Bottom</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#1F2937] uppercase tracking-wider mb-1">
                    Display Fit Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setImageFit('cover')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        imageFit === 'cover'
                          ? 'bg-[#16834A] text-white border-[#16834A]'
                          : 'bg-white text-[#1F2937] border-[#E5E7EB] hover:bg-[#F1F8F2]'
                      }`}
                    >
                      Fill Card Frame (Cover)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageFit('contain')}
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        imageFit === 'contain'
                          ? 'bg-[#16834A] text-white border-[#16834A]'
                          : 'bg-white text-[#1F2937] border-[#E5E7EB] hover:bg-[#F1F8F2]'
                      }`}
                    >
                      Show Entire Photo (Contain)
                    </button>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-[#E5E7EB]">
                  <p className="text-[11px] text-[#6B7280] mb-1.5 flex items-center justify-between">
                    <span>Live Invitation Card Preview</span>
                    <span className="text-[10px] italic text-[#16834A]">How guests will see it</span>
                  </p>
                  <div className="relative w-full max-w-[260px] mx-auto rounded-xl overflow-hidden border border-[#E5E7EB] bg-[#F1F8F2] shadow-inner">
                    <div
                      className={`w-full overflow-hidden ${
                        imageFit === 'contain'
                          ? 'h-48 flex items-center justify-center p-1 bg-black/5'
                          : imageAspect === 'portrait'
                          ? 'aspect-[4/5]'
                          : imageAspect === 'square'
                          ? 'aspect-square'
                          : imageAspect === 'landscape'
                          ? 'aspect-[16/10]'
                          : 'aspect-[4/5]'
                      }`}
                    >
                      <img
                        src={imageUrl}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className={`w-full h-full ${
                          imageFit === 'contain'
                            ? 'object-contain max-h-48'
                            : `object-cover ${
                                imagePosition === 'top'
                                  ? 'object-top'
                                  : imagePosition === 'bottom'
                                  ? 'object-bottom'
                                  : 'object-center'
                              }`
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between gap-3">
            {eventToEdit && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDelete(eventToEdit.id, eventToEdit.title);
                }}
                className="py-2.5 px-3 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-semibold tracking-wide transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Event</span>
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
                disabled={isSaving || isUploading}
                className="py-2.5 px-6 rounded-xl bg-[#16834A] hover:bg-[#136f3e] text-white text-xs font-semibold tracking-wide shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{eventToEdit ? 'Save Changes' : 'Create Event'}</span>
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
