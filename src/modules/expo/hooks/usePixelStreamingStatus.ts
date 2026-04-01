import { useEffect, useMemo, useState } from 'react';
import { reportExpoDevError } from '../lib/devErrorReporter';
import {
  buildFallbackPixelStreamingRuntimeStatus,
  derivePixelStreamingAvailability,
  fetchPixelStreamingRuntimeStatus,
  getPixelStreamingRuntimeConfig,
  probePixelStreamingAvailability,
  type PixelStreamingAvailability,
  type PixelStreamingRuntimeStatus
} from '../services/pixelStreamingConfig';

interface UsePixelStreamingStatusOptions {
  shouldProbe?: boolean;
}

export function usePixelStreamingStatus({ shouldProbe = true }: UsePixelStreamingStatusOptions = {}) {
  const config = useMemo(() => getPixelStreamingRuntimeConfig(), []);
  const [availability, setAvailability] = useState<PixelStreamingAvailability>(shouldProbe ? 'connecting' : 'unavailable');
  const [runtimeStatus, setRuntimeStatus] = useState<PixelStreamingRuntimeStatus | null>(null);

  useEffect(() => {
    let isActive = true;

    if (!shouldProbe) {
      queueMicrotask(() => {
        if (!isActive) return;
        setAvailability('unavailable');
        setRuntimeStatus(null);
      });

      return () => {
        isActive = false;
      };
    }

    const loadStatus = async () => {
      if (isActive) {
        setAvailability('connecting');
      }

      try {
        const status = await fetchPixelStreamingRuntimeStatus(config);
        if (!isActive) return;

        setRuntimeStatus(status);
        setAvailability(derivePixelStreamingAvailability(status));
      } catch (error) {
        reportExpoDevError('usePixelStreamingStatus.fetchPixelStreamingRuntimeStatus', error, {
          signalingUrl: config.signalingUrl,
          statusEndpointUrl: config.statusEndpointUrl,
        });
        const isReachable = await probePixelStreamingAvailability(config);
        if (!isActive) return;

        const fallbackStatus = buildFallbackPixelStreamingRuntimeStatus(isReachable, config);
        setRuntimeStatus(fallbackStatus);
        setAvailability(derivePixelStreamingAvailability(fallbackStatus));
      }
    };

    void loadStatus();

    return () => {
      isActive = false;
    };
  }, [config, shouldProbe]);

  return {
    config,
    availability,
    runtimeStatus,
    isAvailable: availability === 'available',
  };
}
