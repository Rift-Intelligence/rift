// Bridge for sending a plain user message into the active chat from anywhere
// in the tree (e.g. the Plan-mode question cards) without prop-drilling
// sendMessage. The composer/send lives inside <Chat> (useChat); this dispatches
// an event that useChatHandlers picks up and sends in the current chat mode.
// Mirrors the launch-operation event pattern.

const EVENT_NAME = "rift:submit-message";

export interface SubmitMessageDetail {
  text: string;
}

/** Fire to send `text` as a user message into the active chat. */
export function submitChatMessage(text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  window.dispatchEvent(
    new CustomEvent<SubmitMessageDetail>(EVENT_NAME, {
      detail: { text: trimmed },
    }),
  );
}

/** Subscribe to programmatic message submissions. Returns a cleanup function. */
export function onSubmitChatMessage(
  callback: (text: string) => void,
): () => void {
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<SubmitMessageDetail>).detail;
    if (detail?.text) callback(detail.text);
  };
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
