import { RefObject, useEffect, useState, useRef, useCallback } from 'react';

export function useScroll(
  containerRef: RefObject<HTMLDivElement | null>,
  dependency: unknown[],
  conversationId: string
) {
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const isAutoScrolling = useRef(false);
  const lastConversationIdRef = useRef<string>(conversationId);
  const lastMessageIdRef = useRef<string | null>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const container = containerRef.current;
    if (container) {
      isAutoScrolling.current = true;
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
      // Reset flag after transition finishes
      setTimeout(() => {
        isAutoScrolling.current = false;
        setNewMessagesCount(0);
      }, 350);
    }
  }, [containerRef]);

  // Handle conversation switch
  useEffect(() => {
    if (conversationId !== lastConversationIdRef.current) {
      lastConversationIdRef.current = conversationId;
      setNewMessagesCount(0);
      lastMessageIdRef.current = null;
      // Scroll to bottom immediately on room switch
      setTimeout(() => {
        scrollToBottom('auto');
      }, 50);
    }
  }, [conversationId, scrollToBottom]);

  // Run scroll checks when dependencies change (new messages arrive)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const lastMsg = dependency[dependency.length - 1] as { _id: string } | undefined;
    const lastMsgId = lastMsg?._id || null;

    // If the last message is identical and we already had a last message ref,
    // it means this is a pagination prepend load (older messages were added at the top).
    // We must ignore this to preserve scroll position stability and let ChatArea adjust.
    const isPaginationPrepend = lastMessageIdRef.current !== null && lastMessageIdRef.current === lastMsgId;
    if (isPaginationPrepend) {
      lastMessageIdRef.current = lastMsgId;
      return;
    }

    // If it is the first load of messages for the current conversation, scroll to bottom
    // and do not show the floating button
    const isFirstLoad = container.scrollTop === 0 && newMessagesCount === 0;

    // Determine if user was near the bottom before the update (within 150px)
    const threshold = 150;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold;

    if (isNearBottom || isFirstLoad) {
      scrollToBottom('auto');
      lastMessageIdRef.current = lastMsgId;
    } else {
      // Check if this is a newly appended message (new message received)
      if (lastMsgId && lastMessageIdRef.current && lastMessageIdRef.current !== lastMsgId) {
        setNewMessagesCount((prev) => prev + 1);
      }
      // Update ref
      lastMessageIdRef.current = lastMsgId;
    }
  }, [dependency, containerRef, scrollToBottom, conversationId, newMessagesCount]);

  // Monitor scroll adjustments manually
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isAutoScrolling.current) return;

      const isAtBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      if (isAtBottom) {
        setNewMessagesCount(0);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef]);

  return { newMessagesCount, scrollToBottom };
}
