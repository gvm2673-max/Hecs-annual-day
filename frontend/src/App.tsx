import React, { useState, useEffect } from 'react';
import { EnvelopeInvitation } from './components/public/EnvelopeInvitation';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { EventItem, GuestItem } from './types';
import { AlertCircle, Lock, Home } from 'lucide-react';
import { apiRequest } from './utils/api';
import { HecsLogo } from './theme';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [adminToken, setAdminToken] = useState<string | null>(
    localStorage.getItem('admin_token')
  );

  // Public Invitation State
  const [publicData, setPublicData] = useState<{
    event: EventItem;
    guest: GuestItem | null;
  } | null>(null);
  const [loadingPublic, setLoadingPublic] = useState(false);
  const [publicError, setPublicError] = useState<string | null>(null);

  // Sync with browser navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check if current route is admin
  const isAdminRoute = currentPath.startsWith('/admin');

  // Verify admin session if on admin route
  useEffect(() => {
    if (isAdminRoute && adminToken) {
      apiRequest<{ authenticated: boolean }>('/api/auth/verify', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      })
        .then((data) => {
          if (!data.authenticated) {
            localStorage.removeItem('admin_token');
            setAdminToken(null);
          }
        })
        .catch(() => {
          localStorage.removeItem('admin_token');
          setAdminToken(null);
        });
    }
  }, [isAdminRoute, adminToken]);

  // Parse public invitation route: /:slug or /:slug/:guestCode
  useEffect(() => {
    if (isAdminRoute) return;

    const segments = currentPath.split('/').filter(Boolean);
    const slug = segments[0];
    const guestCode = segments[1];

    setLoadingPublic(true);
    setPublicError(null);

    const apiUrl = !slug
      ? '/api/public/primary-event'
      : guestCode
      ? `/api/public/invite/${encodeURIComponent(slug)}/${encodeURIComponent(guestCode)}`
      : `/api/public/invite/${encodeURIComponent(slug)}`;

    apiRequest<{ event: EventItem; guest: GuestItem | null }>(apiUrl)
      .then((data) => {
        if (data && data.event) {
          setPublicData(data);
        } else {
          setPublicData(null);
          setPublicError('No active event invitation found. Please verify the URL provided by your host.');
        }
      })
      .catch((err) => {
        setPublicError(err.message || 'Unable to load invitation');
        setPublicData(null);
      })
      .finally(() => {
        setLoadingPublic(false);
      });
  }, [currentPath, isAdminRoute]);

  const handleAdminLogout = async () => {
    if (adminToken) {
      await apiRequest('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      }).catch(() => {});
    }
    localStorage.removeItem('admin_token');
    setAdminToken(null);
  };

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  /* ========================================================================= */
  /* ADMIN EXPERIENCE */
  /* ========================================================================= */
  if (isAdminRoute) {
    if (!adminToken) {
      return (
        <AdminLogin
          onLoginSuccess={(token) => {
            setAdminToken(token);
          }}
          onBackToInvite={() => {
            navigateTo(publicData?.event?.slug ? `/${publicData.event.slug}` : '/');
          }}
        />
      );
    }
    return (
      <AdminDashboard
        token={adminToken}
        onLogout={handleAdminLogout}
      />
    );
  }

  /* ========================================================================= */
  /* PUBLIC GUEST EXPERIENCE (Mobile-First, Strictly Isolated) */
  /* ========================================================================= */
  if (loadingPublic) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-6 flex flex-col items-center">
          <HecsLogo className="h-12 w-auto mb-6" />
          <div className="w-12 h-12 rounded-full border-3 border-[#16834A] border-t-transparent animate-spin mb-4" />
          <p className="font-sans text-base font-medium text-[#1F2937]">
            Loading Invitation...
          </p>
          <p className="text-xs text-[#6B7280] mt-1">
            Preparing your personalized event portal
          </p>
        </div>
      </div>
    );
  }

  if (publicError || !publicData) {
    const isServerError = publicError && (
      publicError.toLowerCase().includes('database') ||
      publicError.toLowerCase().includes('server') ||
      publicError.toLowerCase().includes('connection') ||
      publicError.toLowerCase().includes('500') ||
      publicError.toLowerCase().includes('503')
    );

    const errorTitle = isServerError
      ? 'Service Temporarily Unavailable'
      : 'Invitation Not Found';

    return (
      <div className="min-h-screen bg-[#F1F8F2] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <HecsLogo className="h-10 w-auto" />
          </div>

          <div className="w-14 h-14 rounded-2xl bg-[#F1F8F2] text-[#16834A] flex items-center justify-center mx-auto mb-4 border border-[#E5E7EB]">
            <AlertCircle className="w-7 h-7 text-[#16834A]" />
          </div>

          <h1 className="text-2xl font-bold text-[#1F2937]">
            {errorTitle}
          </h1>
          <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
            {publicError || 'The event or personalized invite link could not be located. Please verify the URL provided by your host.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigateTo('/')}
              className="py-2.5 px-4 rounded-xl bg-[#16834A] text-white text-xs font-semibold hover:bg-[#136f3e] transition-colors shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Go to Home</span>
            </button>
            <button
              type="button"
              onClick={() => navigateTo('/admin')}
              className="py-2.5 px-4 rounded-xl bg-[#F1F8F2] text-[#16834A] text-xs font-semibold hover:bg-[#e2f1e4] transition-colors flex items-center gap-1.5 border border-[#E5E7EB] cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Host Sign In</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <EnvelopeInvitation
        event={publicData.event}
        guest={publicData.guest}
        onRsvpSuccess={(updatedGuest) => {
          setPublicData((prev) => (prev ? { ...prev, guest: updatedGuest } : prev));
        }}
        onAdminAccess={() => {
          navigateTo('/admin');
        }}
      />
    </>
  );
}
