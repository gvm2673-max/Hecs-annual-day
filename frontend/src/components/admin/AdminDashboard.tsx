import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Share2,
  Download,
  Upload,
  Search,
  ExternalLink,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  LogOut,
  Calendar,
  MapPin,
  Sparkles,
  ChevronDown,
  UserCheck,
  KeyRound,
  AlertTriangle,
  Check,
  X,
  LayoutDashboard,
  QrCode,
  ShieldCheck,
  BarChart3,
  Menu
} from 'lucide-react';
import { EventItem, GuestItem } from '../../types';
import { EventModal } from './EventModal';
import { GuestModal } from './GuestModal';
import { ShareModal } from './ShareModal';
import { ChangeCredentialsModal } from './ChangeCredentialsModal';
import { exportGuestsToCSV, parseCSVToGuests } from '../../utils/csv';
import { apiRequest } from '../../utils/api';
import { HecsLogo } from '../../theme';

interface AdminDashboardProps {
  token: string;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ token, onLogout }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [currentEventId, setCurrentEventId] = useState<string>('');
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [metrics, setMetrics] = useState({
    totalInvitees: 0,
    attendingCount: 0,
    declinedCount: 0,
    pendingCount: 0,
    totalHeadcount: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'overview' | 'guests' | 'analytics'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modals state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<EventItem | null>(null);

  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [guestToEdit, setGuestToEdit] = useState<GuestItem | null>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareGuest, setShareGuest] = useState<GuestItem | null>(null);

  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);

  // In-app Delete Confirmation Dialog state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'guest' | 'event';
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // In-app Toast Banner state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Guest list filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'attending' | 'declined' | 'pending'>('all');

  const csvInputRef = useRef<HTMLInputElement | null>(null);

  // Load events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<EventItem[]>('/api/events', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const eventList = Array.isArray(data) ? data : [];
      setEvents(eventList);
      if (eventList.length > 0) {
        if (!currentEventId || !eventList.some((e: EventItem) => e.id === currentEventId)) {
          setCurrentEventId(eventList[0].id);
        }
      }
    } catch (err: any) {
      if (err.message && err.message.includes('401')) {
        onLogout();
        return;
      }
      setError(err.message || 'Error fetching events');
    } finally {
      setLoading(false);
    }
  };

  // Load guests for selected event
  const fetchGuests = async (eventId: string) => {
    if (!eventId) return;
    try {
      const data = await apiRequest<GuestItem[]>(`/api/events/${eventId}/guests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const guestList = Array.isArray(data) ? data : [];
      setGuests(guestList);

      // Compute live metrics
      const totalInvitees = guestList.length;
      const attending = guestList.filter((g) => g.status === 'attending');
      const declined = guestList.filter((g) => g.status === 'declined');
      const pending = guestList.filter((g) => g.status === 'pending');
      const totalHeadcount = attending.reduce((acc, g) => acc + (g.attendingCount || 1), 0);

      setMetrics({
        totalInvitees,
        attendingCount: attending.length,
        declinedCount: declined.length,
        pendingCount: pending.length,
        totalHeadcount
      });
    } catch (err: any) {
      if (err.message && err.message.includes('401')) {
        onLogout();
        return;
      }
      console.error('Error fetching guests', err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [token]);

  useEffect(() => {
    if (currentEventId) {
      fetchGuests(currentEventId);
    } else {
      setGuests([]);
    }
  }, [currentEventId]);

  const currentEvent = events.find((e) => e.id === currentEventId);

  // Request to delete a guest
  const requestDeleteGuest = (guestId: string, guestName?: string) => {
    const target = guests.find((g) => g.id === guestId);
    setDeleteTarget({
      type: 'guest',
      id: guestId,
      name: guestName || target?.name || 'Guest Record'
    });
  };

  // Request to delete an event
  const requestDeleteEvent = (eventId: string, eventTitle?: string) => {
    const target = events.find((e) => e.id === eventId);
    setDeleteTarget({
      type: 'event',
      id: eventId,
      name: eventTitle || target?.title || 'Event'
    });
  };

  // Execute deletion
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    if (deleteTarget.type === 'guest') {
      try {
        await apiRequest(`/api/events/${currentEventId}/guests/${deleteTarget.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        setGuests((prev) => prev.filter((g) => g.id !== deleteTarget.id));
        fetchGuests(currentEventId);
        setToast({
          type: 'success',
          message: `Guest "${deleteTarget.name}" deleted successfully.`
        });
      } catch (err: any) {
        console.error('Failed to delete guest', err);
        setToast({
          type: 'error',
          message: err.message || 'Failed to delete guest.'
        });
      } finally {
        setIsDeleting(false);
        setDeleteTarget(null);
      }
    } else if (deleteTarget.type === 'event') {
      try {
        await apiRequest(`/api/events/${deleteTarget.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        const remaining = events.filter((e) => e.id !== deleteTarget.id);
        setEvents(remaining);
        if (remaining.length > 0) {
          setCurrentEventId(remaining[0].id);
        } else {
          setCurrentEventId('');
        }
        setToast({
          type: 'success',
          message: `Event "${deleteTarget.name}" permanently deleted.`
        });
      } catch (err: any) {
        console.error('Failed to delete event', err);
        setToast({
          type: 'error',
          message: err.message || 'Failed to delete event.'
        });
      } finally {
        setIsDeleting(false);
        setDeleteTarget(null);
      }
    }
  };

  // CSV Import handler
  const handleCSVImport = (file: File) => {
    if (!file || !currentEventId) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = reader.result as string;
        const parsed = parseCSVToGuests(text);
        if (parsed.length === 0) {
          setToast({
            type: 'error',
            message: 'No valid guest records found in the uploaded CSV.'
          });
          return;
        }

        const data = await apiRequest<{ count: number }>(`/api/events/${currentEventId}/guests/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ guests: parsed })
        });

        setToast({
          type: 'success',
          message: `Successfully imported ${data.count} guest records!`
        });
        fetchGuests(currentEventId);
      } catch (err: any) {
        setToast({
          type: 'error',
          message: err.message || 'Error processing CSV file.'
        });
      }
    };
    reader.readAsText(file);
  };

  // Filtered guests
  const filteredGuests = guests.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.guestCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.mobileNumber && g.mobileNumber.includes(searchQuery));

    const matchesStatus =
      statusFilter === 'all' ? true : g.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate RSVP Response Percentages
  const total = metrics.totalInvitees || 1;
  const attendingPct = Math.round((metrics.attendingCount / total) * 100);
  const declinedPct = Math.round((metrics.declinedCount / total) * 100);
  const pendingPct = Math.round((metrics.pendingCount / total) * 100);
  const respondedTotal = metrics.attendingCount + metrics.declinedCount;
  const responseRate = Math.round((respondedTotal / total) * 100);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1F2937] flex flex-col md:flex-row selection:bg-[#16834A]/20 selection:text-[#16834A]">
      {/* ========================================================================= */}
      {/* ENTERPRISE WHITE SIDEBAR NAVIGATION */}
      {/* ========================================================================= */}
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 lg:w-72 bg-[#FFFFFF] border-r border-[#E5E7EB] flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* Logo & Corporate Branding Area */}
          <div className="h-18 px-6 border-b border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HecsLogo className="h-9 w-auto" />
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F1F8F2] md:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-1.5">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Management
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveTab('overview');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#F1F8F2] text-[#16834A] border-l-4 border-[#16834A] shadow-xs'
                  : 'text-[#1F2937] hover:bg-[#F1F8F2]/70 hover:text-[#16834A]'
              }`}
            >
              <LayoutDashboard
                className={`w-4 h-4 ${activeTab === 'overview' ? 'text-[#16834A]' : 'text-[#6B7280]'}`}
              />
              <span>Dashboard & KPIs</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('guests');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'guests'
                  ? 'bg-[#F1F8F2] text-[#16834A] border-l-4 border-[#16834A] shadow-xs'
                  : 'text-[#1F2937] hover:bg-[#F1F8F2]/70 hover:text-[#16834A]'
              }`}
            >
              <Users
                className={`w-4 h-4 ${activeTab === 'guests' ? 'text-[#16834A]' : 'text-[#6B7280]'}`}
              />
              <span className="flex-1 text-left">Guest Directory</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FFFFFF] border border-[#E5E7EB] text-[#16834A]">
                {guests.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('analytics');
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-[#F1F8F2] text-[#16834A] border-l-4 border-[#16834A] shadow-xs'
                  : 'text-[#1F2937] hover:bg-[#F1F8F2]/70 hover:text-[#16834A]'
              }`}
            >
              <BarChart3
                className={`w-4 h-4 ${activeTab === 'analytics' ? 'text-[#16834A]' : 'text-[#6B7280]'}`}
              />
              <span>RSVP Analytics</span>
            </button>

            <div className="pt-4 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Quick Actions
            </div>

            {currentEvent && (
              <button
                type="button"
                onClick={() => {
                  setShareGuest(null);
                  setIsShareModalOpen(true);
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#1F2937] hover:bg-[#F1F8F2] hover:text-[#16834A] transition-colors cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-[#16834A]" />
                <span>Share & QR Code</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsCredentialsModalOpen(true);
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#1F2937] hover:bg-[#F1F8F2] hover:text-[#16834A] transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#16834A]" />
              <span>Security & Access</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer: System Status & User Profile */}
        <div className="p-4 border-t border-[#E5E7EB] bg-[#F1F8F2]/60">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16834A] animate-pulse" />
              <span className="text-xs font-semibold text-[#1F2937]">System Online</span>
            </div>
            <span className="text-[10px] text-[#6B7280] font-mono">v2.4 Pro</span>
          </div>

          <div className="p-3 bg-[#FFFFFF] rounded-xl border border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#F1F8F2] border border-[#E5E7EB] flex items-center justify-center text-[#16834A] font-bold text-xs shrink-0">
                AD
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-[#1F2937] truncate">Administrator</p>
                <p className="text-[11px] text-[#16834A] font-medium">HECS Host Portal</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 rounded-lg text-[#6B7280] hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN VIEWPORT */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Navbar */}
        <header className="bg-[#FFFFFF] border-b border-[#E5E7EB] sticky top-0 z-30 px-4 sm:px-8 py-3.5 shadow-2xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-xl text-[#1F2937] hover:bg-[#F1F8F2] md:hidden cursor-pointer border border-[#E5E7EB]"
                aria-label="Open Sidebar Menu"
              >
                <Menu className="w-5 h-5 text-[#16834A]" />
              </button>

              <div className="hidden sm:flex items-center gap-2">
                <HecsLogo className="h-7 w-auto md:hidden" />
                <span className="text-sm font-bold text-[#1F2937] hidden lg:inline">
                  Event Operations Center
                </span>
              </div>

              {/* Event Selector Dropdown */}
              {events.length > 0 && (
                <div className="relative">
                  <select
                    value={currentEventId}
                    onChange={(e) => setCurrentEventId(e.target.value)}
                    className="pl-3.5 pr-8 py-2 rounded-xl bg-[#F1F8F2] border border-[#E5E7EB] text-xs font-semibold text-[#1F2937] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A] cursor-pointer appearance-none max-w-[200px] sm:max-w-xs truncate"
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title || ev.hostNames} ({ev.date})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#16834A] absolute right-2.5 top-3 pointer-events-none" />
                </div>
              )}
            </div>

            {/* Header Right Action Controls */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setEventToEdit(null);
                  setIsEventModalOpen(true);
                }}
                className="py-2 px-3.5 rounded-xl bg-[#16834A] hover:bg-[#136f3e] text-white text-xs font-semibold tracking-wide flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Event</span>
              </button>

              {currentEvent && (
                <a
                  href={`/${currentEvent.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-xl bg-[#F1F8F2] hover:bg-[#e2f1e4] text-[#16834A] text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-colors border border-[#E5E7EB]"
                >
                  <span className="hidden sm:inline">Preview Invite</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#16834A]" />
                </a>
              )}

              <button
                type="button"
                onClick={() => setIsCredentialsModalOpen(true)}
                className="py-2 px-3 rounded-xl bg-[#FFFFFF] hover:bg-[#F1F8F2] text-[#1F2937] text-xs font-semibold tracking-wide flex items-center gap-1.5 transition-colors border border-[#E5E7EB] cursor-pointer"
                title="Security Settings"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#16834A]" />
                <span className="hidden md:inline">Credentials</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Main Workspace */}
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
          {loading ? (
            <div className="text-center py-24">
              <div className="w-10 h-10 rounded-full border-3 border-[#16834A] border-t-transparent animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#1F2937]">Loading event details...</p>
              <p className="text-xs text-[#6B7280] mt-1">Connecting to HECS secure services</p>
            </div>
          ) : !currentEvent ? (
            <div className="max-w-md mx-auto text-center py-16 px-6 bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-lg">
              <div className="w-14 h-14 rounded-2xl bg-[#F1F8F2] text-[#16834A] flex items-center justify-center mx-auto mb-4 border border-[#E5E7EB]">
                <Sparkles className="w-7 h-7 text-[#16834A]" />
              </div>
              <h2 className="text-2xl font-bold text-[#1F2937]">No Events Created Yet</h2>
              <p className="text-xs text-[#6B7280] mt-2 mb-6 leading-relaxed">
                Create your first HECS enterprise event invitation to begin dispatching personalized guest invites and tracking live confirmations.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEventToEdit(null);
                  setIsEventModalOpen(true);
                }}
                className="py-3 px-6 rounded-xl bg-[#16834A] hover:bg-[#136f3e] text-white text-xs font-semibold tracking-wide shadow-sm hover:shadow-md transition-colors cursor-pointer"
              >
                + Create First Event
              </button>
            </div>
          ) : (
            <>
              {/* EVENT HERO SUMMARY CARD */}
              <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-sm p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative overflow-hidden">
                {/* Green Decorative Bar */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#16834A] to-[#27AE60]" />

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  {currentEvent.imageUrl ? (
                    <img
                      src={currentEvent.imageUrl}
                      alt={currentEvent.title}
                      referrerPolicy="no-referrer"
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border border-[#E5E7EB] shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#F1F8F2] border border-[#E5E7EB] flex items-center justify-center text-[#16834A] font-bold text-3xl shrink-0">
                      ✦
                    </div>
                  )}

                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F8F2] text-[#16834A] text-xs font-bold mb-2 border border-[#E5E7EB]">
                      <span>{currentEvent.celebrationType || 'Celebration'}</span>
                      <span>•</span>
                      <span className="font-mono text-[11px] text-[#16834A]">
                        /{currentEvent.slug}
                      </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-bold text-[#1F2937] leading-tight">
                      {currentEvent.title || currentEvent.hostNames}
                    </h1>

                    {currentEvent.title && (
                      <p className="text-sm text-[#6B7280] mt-1 font-medium">
                        Hosted by {currentEvent.hostNames}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B7280] mt-3">
                      <span className="flex items-center gap-1.5 font-medium text-[#1F2937]">
                        <Calendar className="w-3.5 h-3.5 text-[#16834A]" />
                        {currentEvent.date} {currentEvent.time && `• ${currentEvent.time}`}
                      </span>
                      {currentEvent.venueName && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#16834A]" />
                          {currentEvent.venueName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Event Level Quick Actions */}
                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-[#E5E7EB]">
                  <button
                    type="button"
                    onClick={() => {
                      setShareGuest(null);
                      setIsShareModalOpen(true);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-[#16834A] hover:bg-[#136f3e] text-white text-xs font-semibold tracking-wide flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Invite & QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEventToEdit(currentEvent);
                      setIsEventModalOpen(true);
                    }}
                    className="py-2.5 px-3.5 rounded-xl bg-[#F1F8F2] hover:bg-[#e2f1e4] text-[#1F2937] text-xs font-semibold tracking-wide flex items-center gap-1.5 border border-[#E5E7EB] transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-[#16834A]" />
                    <span>Edit Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => requestDeleteEvent(currentEvent.id, currentEvent.title)}
                    className="p-2.5 rounded-xl bg-[#FFFFFF] hover:bg-red-50 text-[#6B7280] hover:text-red-700 border border-[#E5E7EB] hover:border-red-200 transition-colors cursor-pointer"
                    title="Delete Event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* LIVE RSVP METRICS CARDS (LIGHT GREEN #F1F8F2 + GREEN HIGHLIGHTS #16834A) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
                {/* Total Invitees */}
                <div className="bg-[#F1F8F2] p-4 sm:p-5 rounded-2xl border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center justify-between text-[#1F2937] mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                      Total Invitees
                    </span>
                    <Users className="w-4 h-4 text-[#16834A]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#1F2937]">
                    {metrics.totalInvitees}
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">Guest parties registered</p>
                </div>

                {/* Confirmed Attending */}
                <div className="bg-[#F1F8F2] p-4 sm:p-5 rounded-2xl border border-[#E5E7EB] shadow-xs relative overflow-hidden">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#16834A]">
                      Attending
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-[#16834A]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#16834A]">
                    {metrics.attendingCount}
                  </div>
                  <p className="text-[11px] text-[#16834A] mt-0.5 font-semibold">
                    {attendingPct}% attendance rate
                  </p>
                </div>

                {/* Declined */}
                <div className="bg-[#F1F8F2] p-4 sm:p-5 rounded-2xl border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center justify-between text-[#1F2937] mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                      Declined
                    </span>
                    <XCircle className="w-4 h-4 text-[#6B7280]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#1F2937]">
                    {metrics.declinedCount}
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">Cannot attend</p>
                </div>

                {/* Pending */}
                <div className="bg-[#F1F8F2] p-4 sm:p-5 rounded-2xl border border-[#E5E7EB] shadow-xs">
                  <div className="flex items-center justify-between text-[#1F2937] mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                      Pending
                    </span>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#1F2937]">
                    {metrics.pendingCount}
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-0.5">Awaiting reply</p>
                </div>

                {/* Total Headcount */}
                <div className="col-span-2 sm:col-span-1 bg-[#FFFFFF] p-4 sm:p-5 rounded-2xl border-2 border-[#16834A] shadow-xs">
                  <div className="flex items-center justify-between text-[#16834A] mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#16834A]">
                      Total Headcount
                    </span>
                    <UserCheck className="w-4 h-4 text-[#16834A]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-[#16834A]">
                    {metrics.totalHeadcount}
                  </div>
                  <p className="text-[11px] text-[#1F2937] font-semibold mt-0.5">
                    Confirmed seats & catering
                  </p>
                </div>
              </div>

              {/* PROFESSIONAL GREEN-PALETTE ANALYTICS & PROGRESS METRIC */}
              <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-xs p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-[#1F2937]">
                      RSVP Response Distribution
                    </h3>
                    <p className="text-xs text-[#6B7280]">
                      Live completion metric: {respondedTotal} of {metrics.totalInvitees} invited parties replied ({responseRate}%)
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#16834A]" />
                      <span>Attending ({attendingPct}%)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#E5E7EB]" />
                      <span>Declined ({declinedPct}%)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#27AE60]" />
                      <span>Pending ({pendingPct}%)</span>
                    </span>
                  </div>
                </div>

                {/* Stacked Progress Bar in Green Palette */}
                <div className="w-full h-3 rounded-full bg-[#F1F8F2] overflow-hidden flex border border-[#E5E7EB]">
                  <div
                    style={{ width: `${attendingPct}%` }}
                    className="h-full bg-[#16834A] transition-all duration-500"
                    title={`Attending: ${metrics.attendingCount} (${attendingPct}%)`}
                  />
                  <div
                    style={{ width: `${declinedPct}%` }}
                    className="h-full bg-[#9CA3AF] transition-all duration-500"
                    title={`Declined: ${metrics.declinedCount} (${declinedPct}%)`}
                  />
                  <div
                    style={{ width: `${pendingPct}%` }}
                    className="h-full bg-[#27AE60]/50 transition-all duration-500"
                    title={`Pending: ${metrics.pendingCount} (${pendingPct}%)`}
                  />
                </div>
              </div>

              {/* GUEST LIST & RSVP TRACKER (WHITE CARD + CLEAN TABLE ACCENTED IN GREEN) */}
              <div className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                <div className="p-5 sm:p-6 border-b border-[#E5E7EB] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#1F2937]">
                      Guest Directory & RSVP Tracker
                    </h2>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Manage guest codes, contact details, attendance status, and headcount allocations.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => exportGuestsToCSV(guests, currentEvent.title || currentEvent.hostNames)}
                      disabled={guests.length === 0}
                      className="py-2 px-3 rounded-xl bg-[#F1F8F2] hover:bg-[#e2f1e4] text-[#1F2937] text-xs font-semibold tracking-wide flex items-center gap-1.5 border border-[#E5E7EB] disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#16834A]" />
                      <span>Export CSV</span>
                    </button>

                    <input
                      ref={csvInputRef}
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        if (e.target.files?.[0]) handleCSVImport(e.target.files[0]);
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => csvInputRef.current?.click()}
                      className="py-2 px-3 rounded-xl bg-[#F1F8F2] hover:bg-[#e2f1e4] text-[#1F2937] text-xs font-semibold tracking-wide flex items-center gap-1.5 border border-[#E5E7EB] transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#16834A]" />
                      <span>Import CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setGuestToEdit(null);
                        setIsGuestModalOpen(true);
                      }}
                      className="py-2 px-4 rounded-xl bg-[#16834A] hover:bg-[#136f3e] text-white text-xs font-semibold tracking-wide flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Guest</span>
                    </button>
                  </div>
                </div>

                {/* Filters & Search Row */}
                <div className="p-4 sm:px-6 bg-[#F1F8F2] border-b border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="relative w-full sm:w-72">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, code, or phone..."
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-hidden focus:ring-2 focus:ring-[#16834A]/30 focus:border-[#16834A]"
                    />
                    <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-2.5" />
                  </div>

                  <div className="flex items-center gap-1 bg-[#FFFFFF] p-1 rounded-xl border border-[#E5E7EB] w-full sm:w-auto justify-center">
                    {(['all', 'attending', 'declined', 'pending'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatusFilter(st)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                          statusFilter === st
                            ? 'bg-[#16834A] text-white shadow-xs'
                            : 'text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F1F8F2]'
                        }`}
                      >
                        {st === 'all' ? `All (${guests.length})` : st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Guests Table */}
                {filteredGuests.length === 0 ? (
                  <div className="text-center py-16 px-4 bg-white">
                    <p className="text-base font-bold text-[#1F2937]">
                      {guests.length === 0
                        ? 'No guests registered yet'
                        : 'No guests match the search filter'}
                    </p>
                    <p className="text-xs text-[#6B7280] mt-1 max-w-sm mx-auto">
                      {guests.length === 0
                        ? 'Add individual guests with assigned invite codes, or import your guest list in bulk via CSV.'
                        : 'Try resetting your search query or switching status filters.'}
                    </p>
                    {guests.length === 0 && (
                      <div className="mt-5 flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setGuestToEdit(null);
                            setIsGuestModalOpen(true);
                          }}
                          className="py-2.5 px-4 rounded-xl bg-[#16834A] hover:bg-[#136f3e] text-white text-xs font-semibold transition-colors cursor-pointer"
                        >
                          + Add First Guest
                        </button>
                        <button
                          type="button"
                          onClick={() => csvInputRef.current?.click()}
                          className="py-2.5 px-4 rounded-xl bg-[#F1F8F2] text-[#1F2937] text-xs font-semibold border border-[#E5E7EB] hover:bg-[#e2f1e4] transition-colors cursor-pointer"
                        >
                          Import from CSV
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto bg-white">
                    <table className="w-full text-left text-xs text-[#1F2937]">
                      <thead className="bg-[#F1F8F2] text-[#1F2937] uppercase tracking-wider text-[11px] font-bold border-b border-[#E5E7EB]">
                        <tr>
                          <th className="py-3 px-4 sm:px-6">Guest / Party</th>
                          <th className="py-3 px-3">Guest Code</th>
                          <th className="py-3 px-3">RSVP Status</th>
                          <th className="py-3 px-3">Headcount</th>
                          <th className="py-3 px-3 hidden md:table-cell">Dietary & Notes</th>
                          <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB]">
                        {filteredGuests.map((guest) => (
                          <tr
                            key={guest.id}
                            className="hover:bg-[#F1F8F2]/60 transition-colors"
                          >
                            <td className="py-3.5 px-4 sm:px-6">
                              <div className="font-bold text-sm text-[#1F2937]">
                                {guest.name}
                              </div>
                              {guest.mobileNumber && (
                                <div className="text-[11px] text-[#6B7280] mt-0.5">
                                  {guest.mobileNumber}
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-3">
                              <span className="font-mono bg-[#F1F8F2] text-[#16834A] px-2 py-0.5 rounded text-[11px] font-bold border border-[#E5E7EB]">
                                {guest.guestCode}
                              </span>
                            </td>

                            <td className="py-3.5 px-3">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  guest.status === 'attending'
                                    ? 'bg-[#F1F8F2] text-[#16834A] border border-[#16834A]/30'
                                    : guest.status === 'declined'
                                    ? 'bg-gray-100 text-gray-700 border border-gray-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {guest.status === 'attending' && '✓ Attending'}
                                {guest.status === 'declined' && '✕ Declined'}
                                {guest.status === 'pending' && '⏳ Pending'}
                              </span>
                            </td>

                            <td className="py-3.5 px-3 font-semibold text-[#1F2937]">
                              {guest.status === 'attending' ? (
                                <span>
                                  {guest.attendingCount}{' '}
                                  <span className="text-[#6B7280] font-normal">
                                    / max {guest.maxGuests}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-[#9CA3AF]">—</span>
                              )}
                            </td>

                            <td className="py-3.5 px-3 hidden md:table-cell max-w-xs truncate">
                              {guest.dietaryPreferences && (
                                <span className="inline-block bg-[#F1F8F2] text-[#16834A] text-[11px] font-medium px-2 py-0.5 rounded mr-1.5 border border-[#E5E7EB]">
                                  🍽️ {guest.dietaryPreferences}
                                </span>
                              )}
                              {guest.notes && (
                                <span className="text-[11px] text-[#6B7280] italic">
                                  "{guest.notes}"
                                </span>
                              )}
                              {!guest.dietaryPreferences && !guest.notes && (
                                <span className="text-[#9CA3AF] text-[11px]">None</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 sm:px-6 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShareGuest(guest);
                                    setIsShareModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-[#16834A] hover:bg-[#F1F8F2] transition-colors cursor-pointer"
                                  title="Share personalized invite"
                                >
                                  <Share2 className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setGuestToEdit(guest);
                                    setIsGuestModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg text-[#1F2937] hover:bg-[#F1F8F2] transition-colors cursor-pointer"
                                  title="Edit guest"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => requestDeleteGuest(guest.id, guest.name)}
                                  className="p-1.5 rounded-lg text-[#6B7280] hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Delete guest"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Event Edit / Create Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        eventToEdit={eventToEdit}
        onSave={(savedEvent) => {
          fetchEvents();
          if (savedEvent && savedEvent.id) {
            setCurrentEventId(savedEvent.id);
          }
        }}
        onDelete={(eventId, title) => {
          requestDeleteEvent(eventId, title);
        }}
        token={token}
      />

      {/* Guest Edit / Create Modal */}
      {currentEvent && (
        <GuestModal
          isOpen={isGuestModalOpen}
          onClose={() => setIsGuestModalOpen(false)}
          eventId={currentEvent.id}
          guestToEdit={guestToEdit}
          onSave={() => {
            fetchGuests(currentEvent.id);
          }}
          onDelete={(guestId, name) => {
            requestDeleteGuest(guestId, name);
          }}
          token={token}
        />
      )}

      {/* Quick Share Modal */}
      {currentEvent && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          event={currentEvent}
          guests={guests}
          preselectedGuest={shareGuest}
        />
      )}

      {/* Change Admin Credentials Modal */}
      <ChangeCredentialsModal
        isOpen={isCredentialsModalOpen}
        onClose={() => setIsCredentialsModalOpen(false)}
        token={token}
      />

      {/* Custom In-App Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-2xl overflow-hidden p-6 sm:p-7">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#1F2937]">
                  {deleteTarget.type === 'guest' ? 'Delete Guest Record' : 'Delete Event Invitation'}
                </h3>
                <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
                  {deleteTarget.type === 'guest' ? (
                    <>
                      Are you sure you want to remove{' '}
                      <strong className="text-[#1F2937] font-bold">{deleteTarget.name}</strong> from this event? This will revoke their personalized invite code and clear their RSVP status.
                    </>
                  ) : (
                    <>
                      Are you sure you want to permanently delete{' '}
                      <strong className="text-[#1F2937] font-bold">{deleteTarget.name}</strong>? All registered guest records and RSVP statuses will be deleted. This cannot be undone.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="py-2.5 px-4 rounded-xl bg-[#F1F8F2] hover:bg-[#e2f1e4] text-[#1F2937] text-xs font-semibold tracking-wide transition-colors cursor-pointer disabled:opacity-50 border border-[#E5E7EB]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="py-2.5 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold tracking-wide shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deleteTarget.type === 'guest' ? 'Delete Guest' : 'Delete Event'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border bg-white border-[#E5E7EB] animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
              toast.type === 'success'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {toast.type === 'success' ? <Check className="w-4 h-4 text-[#16834A]" /> : <AlertTriangle className="w-4 h-4" />}
          </div>
          <p className="text-xs font-semibold text-[#1F2937] flex-1">{toast.message}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-[#6B7280] hover:text-[#1F2937] p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
