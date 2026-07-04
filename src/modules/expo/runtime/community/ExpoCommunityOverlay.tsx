import { useCallback, useEffect, useRef, useState } from 'react';
import { expoCommunityService, type ExpoCommunityResponse } from '../../../../app/expo/expoCommunityService';
import { EXPO_COMMUNITY_LIMITS, getExpoCommunityStatusLabel } from '../../../../shared/expo/communityContent';
import type { ExpoCommunityAuditEvent, ExpoCommunityEntry, ExpoCommunityGraffiti, ExpoCommunitySprayPlacement } from '../../../../shared/expo/communityContent';
import { supabaseClient } from '../../../../lib/supabaseClient';
import './ExpoCommunityOverlay.css';

type CommunityTab = 'feed' | 'graffiti' | 'post' | 'review' | 'voice';

function buildCurrentSprayPlacement(playerPosition?: [number, number, number]): ExpoCommunitySprayPlacement | undefined {
  if (!playerPosition) return undefined;
  const [x, y, z] = playerPosition;
  if (!Number.isFinite(x) || !Number.isFinite(z)) return undefined;
  return {
    rotationY: 0,
    surfaceLabel: 'Current city spot',
    x: Math.round(x * 100) / 100,
    y: Math.round(Math.min(4.8, Math.max(1.8, (Number.isFinite(y) ? y : 3.8) - 1.2)) * 100) / 100,
    z: Math.round(z * 100) / 100,
  };
}

function formatSprayTarget(placement: ExpoCommunitySprayPlacement | null | undefined, selected: boolean) {
  if (!placement) return 'Spray target: the nearest approved city spot.';
  const x = Math.round(placement.x);
  const z = Math.round(placement.z);
  if (selected) {
    const rawLabel = String(placement.surfaceLabel || '').trim();
    const lowerLabel = rawLabel.toLowerCase();
    const label = !rawLabel || lowerLabel === 'city spot' || lowerLabel === 'picked city spot'
      ? 'city spot'
      : lowerLabel.includes('expo-')
        ? 'city surface'
        : rawLabel;
    return `Spray target: selected ${label} near X ${x}, Z ${z}.`;
  }
  return `Spray target: your current city spot near X ${x}, Z ${z}.`;
}

export function ExpoCommunityOverlay({ isTouchDevice, playerPosition }: { isTouchDevice: boolean; playerPosition?: [number, number, number] }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<CommunityTab>('feed');
  const [data, setData] = useState<ExpoCommunityResponse | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [placementMode, setPlacementMode] = useState(false);
  const [selectedSprayPlacement, setSelectedSprayPlacement] = useState<ExpoCommunitySprayPlacement | null>(null);
  const [post, setPost] = useState({ body: '', kind: 'message' as 'advert' | 'message', title: '' });
  const [graffiti, setGraffiti] = useState({ color: '#22d3ee', logoUrl: '', markText: '' });
  const [voiceTitle, setVoiceTitle] = useState('Voice message');
  const [recording, setRecording] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [moderation, setModeration] = useState<{ audit: ExpoCommunityAuditEvent[]; entries: ExpoCommunityEntry[]; graffiti: ExpoCommunityGraffiti[] }>({ audit: [], entries: [], graffiti: [] });
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<number | null>(null);

  const openPanel = useCallback(() => {
    if (document.pointerLockElement) document.exitPointerLock?.();
    setOpen(true);
  }, []);

  async function refresh() {
    try {
      setData(await expoCommunityService.getPublic());
    } catch {
      setMessage('The city board is temporarily unavailable.');
    }
  }

  useEffect(() => {
    void refresh();
    void supabaseClient.auth.getSession().then(({ data: session }) => {
      setIsAdmin(session.session?.user.app_metadata?.role === 'admin');
    });
    const openBoard = () => openPanel();
    const onSprayPlacementSelected = ((event: CustomEvent<ExpoCommunitySprayPlacement>) => {
      setSelectedSprayPlacement(event.detail);
      setPlacementMode(false);
      setTab('graffiti');
      setOpen(true);
      setMessage('Spray spot selected. Add your mark and send it for review.');
    }) as EventListener;
    const onSprayPlacementStatus = ((event: CustomEvent<{ status: string }>) => {
      if (event.detail.status === 'active') setPlacementMode(true);
      if (event.detail.status === 'cancelled' || event.detail.status === 'selected') setPlacementMode(false);
      if (event.detail.status === 'cancelled') {
        setOpen(true);
        setTab('graffiti');
        setMessage('Spot selection cancelled.');
      }
    }) as EventListener;
    window.addEventListener('expo:open-community-board', openBoard);
    window.addEventListener('expo:spray-placement-selected', onSprayPlacementSelected);
    window.addEventListener('expo:spray-placement-status', onSprayPlacementStatus);
    return () => {
      window.removeEventListener('expo:open-community-board', openBoard);
      window.removeEventListener('expo:spray-placement-selected', onSprayPlacementSelected);
      window.removeEventListener('expo:spray-placement-status', onSprayPlacementStatus);
    };
  }, [openPanel]);

  useEffect(() => () => {
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    document.body.classList.toggle('expo-community-panel-open', open);
    return () => document.body.classList.remove('expo-community-panel-open');
  }, [open]);

  useEffect(() => {
    document.body.classList.toggle('expo-spray-placement-active', placementMode);
    return () => document.body.classList.remove('expo-spray-placement-active');
  }, [placementMode]);

  function showError(error: unknown) {
    const text = error instanceof Error ? error.message : String(error);
    if (text.includes('HTTP_401')) setMessage('Sign in before posting to the city board.');
    else setMessage(text.replace(/^.*SERVER_API_HTTP_\d+:\s*/, '') || 'Request failed.');
  }

  async function submitPost() {
    setBusy(true);
    setMessage('');
    try {
      await expoCommunityService.submitEntry(post);
      setPost({ body: '', kind: 'message', title: '' });
      setMessage('Sent for review. Approved posts appear for everyone in the city.');
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  }

  async function submitGraffiti() {
    setBusy(true);
    setMessage('');
    try {
      const result = await expoCommunityService.submitGraffiti({
        ...graffiti,
        placement: selectedSprayPlacement ?? buildCurrentSprayPlacement(playerPosition),
      });
      setGraffiti({ color: '#22d3ee', logoUrl: '', markText: '' });
      setSelectedSprayPlacement(null);
      setMessage(`Sent for review. ${result.remaining} spray submissions remain this hour.`);
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  }

  async function reportItem(id: string) {
    setBusy(true);
    setMessage('');
    try {
      await expoCommunityService.report(id, 'other', 'Visitor asked for operator review.');
      await refresh();
      setMessage('Reported. An operator will review it.');
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  }

  async function startRecording() {
    setMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : undefined });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (!blob.size || blob.size > EXPO_COMMUNITY_LIMITS.voiceBytes) {
          setMessage('Recording is empty or too large. Keep it under 15 seconds.');
          return;
        }
        setBusy(true);
        try {
          await expoCommunityService.submitVoice(blob, voiceTitle);
          setMessage('Voice message sent for review. Audio never plays automatically.');
        } catch (error) {
          showError(error);
        } finally {
          setBusy(false);
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      stopTimerRef.current = window.setTimeout(() => recorder.stop(), EXPO_COMMUNITY_LIMITS.voiceSeconds * 1000);
    } catch {
      setMessage('Microphone access is required to record a voice message.');
    }
  }

  function stopRecording() {
    if (stopTimerRef.current) window.clearTimeout(stopTimerRef.current);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }

  const currentSprayPlacement = buildCurrentSprayPlacement(playerPosition);
  const effectiveSprayPlacement = selectedSprayPlacement ?? currentSprayPlacement;

  function startSprayPlacementPick() {
    if (document.pointerLockElement) document.exitPointerLock?.();
    setPlacementMode(true);
    setOpen(false);
    window.dispatchEvent(new Event('expo:start-spray-placement'));
  }

  function cancelSprayPlacementPick() {
    setPlacementMode(false);
    window.dispatchEvent(new Event('expo:cancel-spray-placement'));
  }

  const placementPrompt = placementMode ? (
    <div
      className="expo-community-placement-prompt"
      role="status"
    >
      <strong>Pick spray spot</strong>
      <span>Aim at a nearby city surface, then click or tap to place the spray. Esc cancels.</span>
      <button type="button" onClick={cancelSprayPlacementPick}>Cancel</button>
    </div>
  ) : null;

  async function loadModeration() {
    setBusy(true);
    try {
      setModeration(await expoCommunityService.getModeration());
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  }

  async function moderate(id: string, status: 'approved' | 'rejected' | 'removed', note = '') {
    setBusy(true);
    try {
      await expoCommunityService.moderate(id, status, note);
      await Promise.all([loadModeration(), refresh()]);
      window.dispatchEvent(new Event('expo:community-updated'));
      setMessage(status === 'approved' ? 'Item is now visible in the city.' : status === 'removed' ? 'Item was removed from the city.' : 'Item was rejected.');
    } catch (error) {
      showError(error);
      setBusy(false);
    }
  }

  if (!open) {
    if (isTouchDevice) {
      return placementPrompt;
    }

    return (
      <>
        <button type="button" className="expo-community-launcher" onClick={openPanel}>City board</button>
        {placementPrompt}
      </>
    );
  }

  return (
    <section className="expo-community-panel" aria-label="City community board">
      <header className="expo-community-header">
        <div>
          <strong style={{ display: 'block', fontSize: '0.96rem' }}>City board</strong>
          <span style={{ color: '#94a3b8', fontSize: '0.68rem' }}>Messages, small ads, voice notes and temporary sprays</span>
        </div>
        <button type="button" aria-label="Close city board" onClick={() => setOpen(false)}>X</button>
      </header>
      <div className="expo-community-body">
        <p className="expo-community-intro">
          Leave something for other visitors to find. New posts and marks are reviewed before they appear in the city.
        </p>
        <nav className="expo-community-tabs" aria-label="Community board sections">
          {(['feed', 'post', 'voice', 'graffiti', ...(isAdmin ? ['review' as const] : [])] as const).map((value) => (
            <button key={value} type="button" data-active={tab === value} onClick={() => { setTab(value); setMessage(''); if (value === 'review') void loadModeration(); }}>
              {value === 'feed' ? 'Board' : value === 'post' ? 'Write' : value === 'voice' ? 'Voice' : value === 'review' ? 'Review' : 'Spray'}
            </button>
          ))}
        </nav>

        {tab === 'feed' && (
          <div className="expo-community-feed">
            {(data?.entries || []).map((entry) => (
              <article key={entry.id} className="expo-community-entry">
                <div style={{ color: entry.kind === 'advert' ? '#fde68a' : '#67e8f9', fontSize: '0.64rem', fontWeight: 900, textTransform: 'uppercase' }}>{entry.kind}</div>
                <strong style={{ display: 'block', fontSize: '0.86rem', marginTop: '3px' }}>{entry.title}</strong>
                <p style={{ color: '#cbd5e1', fontSize: '0.76rem', lineHeight: 1.45, margin: '6px 0 0' }}>{entry.body}</p>
                {entry.audioUrl && <audio controls preload="none" src={entry.audioUrl} />}
                <div className="expo-community-entry-footer">
                  <span>{entry.authorLabel}</span>
                  <button type="button" disabled={busy} onClick={() => void reportItem(entry.id)}>Report</button>
                </div>
              </article>
            ))}
            {(data?.graffiti || []).length > 0 && (
              <div className="expo-community-entry">
                <strong style={{ display: 'block', fontSize: '0.8rem', marginBottom: '9px' }}>Temporary city sprays</strong>
                <div style={{ display: 'grid', gap: '7px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                  {data?.graffiti.map((mark) => (
                    <div key={mark.id} className="expo-community-graffiti-card" style={{ color: mark.color }}>
                      <div>{mark.logoUrl ? <img alt={mark.markText || 'Community logo'} src={mark.logoUrl} /> : mark.markText}</div>
                      <button type="button" disabled={busy} onClick={() => void reportItem(mark.id)}>Report</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'post' && (
          <>
            <label>Post type<select value={post.kind} onChange={(event) => setPost((current) => ({ ...current, kind: event.target.value as 'advert' | 'message' }))}><option value="message">Message</option><option value="advert">Small ad</option></select></label>
            <label>Title<input maxLength={EXPO_COMMUNITY_LIMITS.title} value={post.title} onChange={(event) => setPost((current) => ({ ...current, title: event.target.value }))} placeholder="What is this about?" /></label>
            <label>Text<textarea maxLength={post.kind === 'advert' ? EXPO_COMMUNITY_LIMITS.advertBody : EXPO_COMMUNITY_LIMITS.messageBody} value={post.body} onChange={(event) => setPost((current) => ({ ...current, body: event.target.value }))} placeholder="Keep it useful and easy to scan." /></label>
            <p className="expo-community-notice">Posts are reviewed before other visitors see them.</p>
            <button type="button" className="primary" disabled={busy || !post.title.trim() || !post.body.trim()} onClick={() => void submitPost()}>Send for review</button>
          </>
        )}

        {tab === 'voice' && (
          <>
            <label>Voice note title<input maxLength={EXPO_COMMUNITY_LIMITS.title} value={voiceTitle} onChange={(event) => setVoiceTitle(event.target.value)} /></label>
            <p className="expo-community-notice">Record up to {EXPO_COMMUNITY_LIMITS.voiceSeconds} seconds. Visitors choose whether to play it; distant or automatic playback is disabled.</p>
            <button type="button" className={recording ? '' : 'primary'} disabled={busy} onClick={recording ? stopRecording : () => void startRecording()}>{recording ? 'Stop and send' : 'Start recording'}</button>
          </>
        )}

        {tab === 'graffiti' && (
          <>
            <label>Short mark<input maxLength={EXPO_COMMUNITY_LIMITS.markText} value={graffiti.markText} onChange={(event) => setGraffiti((current) => ({ ...current, markText: event.target.value }))} placeholder="Up to 12 characters" /></label>
            <label>Logo image link (optional)<input type="url" value={graffiti.logoUrl} onChange={(event) => setGraffiti((current) => ({ ...current, logoUrl: event.target.value }))} placeholder="https://.../logo.webp" /></label>
            <label>Color<input type="color" value={graffiti.color} onChange={(event) => setGraffiti((current) => ({ ...current, color: event.target.value }))} /></label>
            <div style={{ background: '#111827', border: '1px solid rgba(148,163,184,.2)', borderRadius: '7px', color: graffiti.color, fontSize: '1.4rem', fontWeight: 950, marginTop: '12px', minHeight: '74px', padding: '18px', textAlign: 'center' }}>{graffiti.markText.toUpperCase() || 'YOUR MARK'}</div>
            <p className="expo-community-notice">
              {formatSprayTarget(effectiveSprayPlacement, Boolean(selectedSprayPlacement))}
            </p>
            <div className="expo-community-placement-actions">
              <button type="button" onClick={startSprayPlacementPick}>Pick spot in city</button>
              <button type="button" disabled={!selectedSprayPlacement} onClick={() => setSelectedSprayPlacement(null)}>Use my spot</button>
            </div>
            <p className="expo-community-notice">Approved sprays appear as temporary city marks for about {EXPO_COMMUNITY_LIMITS.graffitiVisibleMinutes} minutes. Limit: {EXPO_COMMUNITY_LIMITS.graffitiPerHour} submissions per hour. Every mark is reviewed.</p>
            <button type="button" className="primary" disabled={busy || (!graffiti.markText.trim() && !graffiti.logoUrl.trim())} onClick={() => void submitGraffiti()}>Send spray for review</button>
          </>
        )}

        {tab === 'review' && isAdmin && (
          <div className="expo-community-feed">
            {[...moderation.entries, ...moderation.graffiti]
              .filter((item) => item.status === 'pending' || (item.reportCount || 0) > 0)
              .map((item) => (
                <article key={item.id} className="expo-community-entry">
                  <strong style={{ display: 'block', fontSize: '0.82rem' }}>{'kind' in item ? item.title : item.markText || 'Logo mark'}</strong>
                  <p className="expo-community-review-meta">
                    {getExpoCommunityStatusLabel(item.status)}
                    {(item.reportCount || 0) > 0 ? ` / ${item.reportCount} report${item.reportCount === 1 ? '' : 's'}` : ''}
                    {item.expiresAt ? ` / expires ${new Date(item.expiresAt).toLocaleDateString()}` : ''}
                  </p>
                  <p style={{ color: '#cbd5e1', fontSize: '0.74rem', margin: '6px 0 10px' }}>{'kind' in item ? item.body : `Spray / ${item.color}`}</p>
                  {'kind' in item && item.audioUrl && <audio controls preload="none" src={item.audioUrl} style={{ height: '36px', marginBottom: '10px', width: '100%' }} />}
                  <div className="expo-community-actions">
                    <button type="button" className="primary" disabled={busy} onClick={() => void moderate(item.id, 'approved')}>Approve</button>
                    <button type="button" disabled={busy} onClick={() => void moderate(item.id, 'rejected')}>Reject</button>
                    <button type="button" className="danger" disabled={busy} onClick={() => void moderate(item.id, 'removed', 'Removed after operator review')}>Remove</button>
                  </div>
                </article>
              ))}
            {!busy && ![...moderation.entries, ...moderation.graffiti].some((item) => item.status === 'pending' || (item.reportCount || 0) > 0) && <p className="expo-community-notice">No items waiting for review.</p>}
            {moderation.audit.length > 0 && (
              <div className="expo-community-audit">
                <strong>Recent actions</strong>
                {moderation.audit.slice(0, 8).map((event) => (
                  <p key={event.id}>{event.action} / {event.itemType} / {event.actorLabel}{event.note ? ` / ${event.note}` : ''}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {message && <p className={`expo-community-notice ${message.toLowerCase().includes('sent') || message.toLowerCase().includes('selected') || message.toLowerCase().includes('reported') || message.toLowerCase().includes('visible') || message.toLowerCase().includes('removed') ? 'expo-community-success' : 'expo-community-error'}`}>{message}</p>}
        {isTouchDevice && <p className="expo-community-notice">Close the board to continue walking.</p>}
      </div>
    </section>
  );
}
