import { eventPublisher } from '../../events/eventPublisher.js';
import { PlatformEvent } from '../../events/eventTypes.js';

export const leadEventService = {
  async publishLeadCreated(leadId: string, score: number, industry: string) {
    return eventPublisher.publish(PlatformEvent.LEAD_CREATED, { leadId, score, industry });
  },
};
