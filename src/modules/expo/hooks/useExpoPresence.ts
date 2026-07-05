import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { supabase } from '../../../core/supabase';
import { quantizeVectorArray } from '../../../utils/threeUtils';
import { EXPO_SYNC_THROTTLE, type ExpoMode } from '../state/expoRuntime';
import {
  normalizeExpoPresenceGuests,
  type ExpoPresenceGuest,
} from '../runtime/community/expoPresencePolicy';

export type ExpoPresenceStatus = 'connecting' | 'disabled' | 'live' | 'offline';

export function useExpoPresence(mode: ExpoMode, options: { enabled?: boolean } = {}) {
  const [guests, setGuests] = useState<ExpoPresenceGuest[]>([]);
  const [playerPos, setPlayerPos] = useState<number[]>([0, 5, 10]);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isSpeaking] = useState(false);
  const [presenceConnectionStatus, setPresenceConnectionStatus] = useState<Exclude<ExpoPresenceStatus, 'disabled'>>('connecting');
  const presenceEnabled = options.enabled ?? true;
  const effectivePresenceStatus: ExpoPresenceStatus = mode === 'menu' || !presenceEnabled
    ? 'disabled'
    : presenceConnectionStatus;

  const channelRef = useRef<any>(null);
  const lastSyncTime = useRef(0);

  useEffect(() => {
    if (mode === 'menu' || !presenceEnabled) {
      return;
    }

    const connectingTimer = window.setTimeout(() => setPresenceConnectionStatus('connecting'), 0);
    const myId = Math.random().toString(36).substring(7);
    const myColor = new THREE.Color().setHSL(Math.random(), 0.8, 0.5).getStyle();
    const channel = supabase.channel('expo_room', { config: { presence: { key: myId } } });

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const activeGuests: unknown[] = [];

        for (const id in newState) {
          if (id !== myId) activeGuests.push(newState[id][0]);
        }

        setGuests(normalizeExpoPresenceGuests(activeGuests));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setPresenceConnectionStatus('live');
          await channel.track({ id: myId, position: [0, 2, 10], color: myColor, isSpeaking: false });
          return;
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setPresenceConnectionStatus('offline');
        }
      });

    channelRef.current = { channel, myId, myColor };

    return () => {
      window.clearTimeout(connectingTimer);
      supabase.removeChannel(channel);
    };
  }, [mode, presenceEnabled]);

  const handlePlayerMove = (pos: number[]) => {
    setPlayerPos(pos);

    const now = Date.now();
    if (now - lastSyncTime.current > EXPO_SYNC_THROTTLE && channelRef.current) {
      const { channel, myId, myColor } = channelRef.current;
      const safePos = quantizeVectorArray(pos);

      channel.track({ id: myId, position: safePos, color: myColor, isSpeaking });
      lastSyncTime.current = now;
    }
  };

  return {
    guests: effectivePresenceStatus === 'disabled' ? [] : guests,
    playerPos,
    isMicOn,
    isSpeaking,
    setIsMicOn,
    presenceStatus: effectivePresenceStatus,
    handlePlayerMove,
  };
}
