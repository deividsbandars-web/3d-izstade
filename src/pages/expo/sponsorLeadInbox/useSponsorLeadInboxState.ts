import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getSponsorLeadInbox,
  type SponsorLeadInboxResponse,
} from '../../../modules/expo/services/sponsorLeadInboxClient';
import { supabaseClient } from '../../../lib/supabaseClient';

type InboxAccessState =
  | 'checking-auth'
  | 'ready'
  | 'signed-out'
  | 'access-denied'
  | 'backend-unavailable'
  | 'unavailable';

type LeadFilter = 'all' | 'follow-up-due' | 'hot-leads' | 'needs-action' | 'package-requests';

function formatRequestError(error: unknown) {
  return error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : 'Unknown request error';
}

function resolveAccessStateFromError(errorText: string): Exclude<InboxAccessState, 'checking-auth' | 'ready'> {
  if (errorText.includes('SERVER_API_HTTP_401')) {
    return 'signed-out';
  }

  if (errorText.includes('SERVER_API_HTTP_403')) {
    return 'access-denied';
  }

  if (errorText.includes('SERVER_API_HTTP_') || errorText.includes('Failed to fetch')) {
    return 'backend-unavailable';
  }

  return 'unavailable';
}

export function useSponsorLeadInboxState() {
  const [searchParams] = useSearchParams();
  const sponsorSlug = searchParams.get('sponsor') || 'sponsor-concierge';
  const [data, setData] = useState<SponsorLeadInboxResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accessState, setAccessState] = useState<InboxAccessState>('checking-auth');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeStatusAction, setActiveStatusAction] = useState<string | null>(null);
  const [activeOpsSave, setActiveOpsSave] = useState<string | null>(null);
  const [activeQuickAction, setActiveQuickAction] = useState<string | null>(null);
  const [activeReplySentAction, setActiveReplySentAction] = useState<string | null>(null);
  const [leadFilter, setLeadFilter] = useState<LeadFilter>('all');
  const [opsDrafts, setOpsDrafts] = useState<Record<string, { followUpAt: string; opsNotes: string }>>({});

  const loadInbox = useCallback(async (cancelled: () => boolean) => {
    setLoading(true);
    setError(null);
    setAccessState('checking-auth');

    try {
      const { data: sessionData } = await supabaseClient.auth.getSession();
      const hasSession = Boolean(sessionData.session?.access_token);

      if (!hasSession) {
        if (!cancelled()) {
          setAccessState('signed-out');
          setData(null);
          setLoading(false);
        }
        return;
      }

      const response = await getSponsorLeadInbox(sponsorSlug);
      if (!cancelled()) {
        setAccessState('ready');
        setData(response);
      }
    } catch (requestError) {
      if (!cancelled()) {
        const errorText = formatRequestError(requestError);
        setError(errorText);
        setAccessState(resolveAccessStateFromError(errorText));
        setData(null);
      }
    } finally {
      if (!cancelled()) {
        setLoading(false);
      }
    }
  }, [sponsorSlug]);

  useEffect(() => {
    let cancelled = false;

    void loadInbox(() => cancelled);

    return () => {
      cancelled = true;
    };
  }, [loadInbox]);

  return {
    accessState,
    activeOpsSave,
    activeQuickAction,
    activeReplySentAction,
    activeStatusAction,
    data,
    error,
    leadFilter,
    loading,
    message,
    opsDrafts,
    setActiveOpsSave,
    setActiveQuickAction,
    setActiveReplySentAction,
    setActiveStatusAction,
    setData,
    setLeadFilter,
    setMessage,
    setOpsDrafts,
    sponsorSlug,
  };
}
