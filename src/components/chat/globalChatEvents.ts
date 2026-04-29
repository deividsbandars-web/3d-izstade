export const GLOBAL_CHAT_OPEN_EVENT = 'warpala:open-global-chat';

export type GlobalChatOpenDetail = {
  focusInput?: boolean;
};

export function dispatchOpenGlobalChat(detail: GlobalChatOpenDetail = { focusInput: true }) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent<GlobalChatOpenDetail>(GLOBAL_CHAT_OPEN_EVENT, { detail }));
}
