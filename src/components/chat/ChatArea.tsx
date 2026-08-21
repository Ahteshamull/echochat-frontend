'use client';

import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useScroll } from '@/hooks/useScroll';
import { formatMessageTime } from '@/utils/date';
import { 
  Send, 
  Settings, 
  MessageSquare, 
  Loader2, 
  ArrowDown, 
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import GroupSettingsModal from './GroupSettingsModal';
import { GroupConversation } from '@/types/chat';

export default function ChatArea() {
  const { user: currentUser } = useAuthStore();
  const { 
    activeConversation, 
    messages, 
    hasMoreMessages, 
    isLoadingMessages, 
    isSendingMessage,
    sendMessage,
    fetchMessages,
    isSocketConnected,
    setActiveConversation
  } = useChatStore();

  const [text, setText] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messageContainerRef = useRef<HTMLDivElement | null>(null);

  // Connect smart scrolling
  const { newMessagesCount, scrollToBottom } = useScroll(messageContainerRef, messages, activeConversation?._id || '');

  // Reset scroll and load messages on room switch
  useEffect(() => {
    if (activeConversation) {
      const timer = setTimeout(() => {
        setText('');
        setIsSettingsOpen(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [activeConversation]);

  if (!activeConversation) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-bg-midnight relative p-6">
        <div className="absolute inset-0 bg-indigo-500/[0.02] blur-3xl pointer-events-none" />
        <div className="text-center max-w-sm space-y-4 z-10 glass-panel p-8 rounded-3xl border border-white/5 shadow-xl">
          <div className="w-14 h-14 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto text-indigo-400">
            <MessageSquare className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 text-center">
            <h3 className="text-base font-bold text-white">Start Messaging</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Select any conversation from the sidebar or search for a new friend to start chatting.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isGroup = activeConversation.type === 'group';
  const chatTitle = isGroup ? activeConversation.name : activeConversation.participant.name;

  // Resolve sender names inside groups
  const getSenderName = (senderId: string) => {
    if (senderId === currentUser?._id) return 'You';
    if (isGroup) {
      const found = activeConversation.participants.find((p) => p._id === senderId);
      return found ? found.name : 'Unknown User';
    }
    return activeConversation.participant.name;
  };

  // Check if sender is admin in groups
  const isSenderAdmin = (senderId: string) => {
    if (isGroup) {
      return activeConversation.admins.includes(senderId);
    }
    return false;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSendingMessage) return;

    try {
      const messageText = text;
      setText(''); // Instant UI cleanup
      await sendMessage(messageText);
      // Auto scroll to bottom on sent messages
      setTimeout(() => scrollToBottom('smooth'), 50);
    } catch (err) {
      toast.error('Failed to send message.');
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMessages || !hasMoreMessages || messages.length === 0) return;
    setIsLoadingMore(true);
    try {
      const oldestMessageId = messages[0]._id;
      // Record height before loading more to adjust scroll offset
      const container = messageContainerRef.current;
      const scrollHeightBefore = container ? container.scrollHeight : 0;
      const scrollTopBefore = container ? container.scrollTop : 0;

      await fetchMessages(activeConversation._id, oldestMessageId);
      
      // Keep scroll position stable after prepending older messages
      setTimeout(() => {
        if (container) {
          const heightDiff = container.scrollHeight - scrollHeightBefore;
          container.scrollTop = scrollTopBefore + heightDiff;
        }
      }, 50);
    } catch (err) {
      toast.error('Failed to load older messages.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-bg-midnight relative overflow-hidden">
      
      {/* Active Room Header */}
      <div className="h-16 border-b border-white/10 glass-panel flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center space-x-3 text-left">
          {/* Back button on mobile */}
          <button 
            onClick={() => setActiveConversation(null)}
            className="md:hidden p-1.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white mr-1.5"
            title="Back to chat list"
          >
            ←
          </button>
          <div className={`w-9.5 h-9.5 rounded-xl flex items-center justify-center font-bold text-xs ${
            isGroup ? 'bg-teal-500/10 text-teal-300' : 'bg-indigo-500/10 text-indigo-300'
          }`}>
            {chatTitle ? chatTitle[0].toUpperCase() : '?'}
          </div>
          <div className="text-left">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-white block truncate max-w-[180px] sm:max-w-xs">{chatTitle}</span>
              {!isGroup && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse animate-duration-3000" title="Active" />
              )}
            </div>
            <span className="text-[9px] text-slate-400 block mt-0.5">
              {isGroup ? `${activeConversation.participants.length} members` : `${activeConversation.participant.phone} • Active`}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Socket Alert Banner if socket is disconnected */}
          {!isSocketConnected && (
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Reconnecting...</span>
            </div>
          )}

          {/* Group Settings Toggle (Only for Groups) */}
          {isGroup && (
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-white/5"
              title="Group Settings"
            >
              <Settings className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Container */}
      <div 
        ref={messageContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar scroll-smooth-active"
      >
        {/* Pagination Trigger */}
        {hasMoreMessages && (
          <div className="flex justify-center py-2 shrink-0">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-semibold text-slate-300 hover:text-white transition-all disabled:opacity-50 flex items-center space-x-1.5"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <span>Load older messages</span>
              )}
            </button>
          </div>
        )}

        {/* Empty history state */}
        {!isLoadingMessages && messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-center text-xs text-slate-500 p-8">
            No messages in this conversation. Send a message to start chatting!
          </div>
        )}

        {/* Message bubble loop */}
        {messages.map((msg) => {
          const isMe = msg.sender === currentUser?._id;
          const senderName = getSenderName(msg.sender);
          const showSenderName = isGroup && !isMe;
          const isAdminBadge = isSenderAdmin(msg.sender);

          return (
            <div 
              key={msg._id} 
              className={`flex items-start space-x-2.5 animate-slide-up ${isMe ? 'justify-end text-right' : 'justify-start text-left'}`}
            >
              {/* Receiver avatar */}
              {!isMe && (
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-[10px] font-bold text-slate-300 mt-1">
                  {senderName ? senderName[0].toUpperCase() : '?'}
                </div>
              )}

              {/* Message content block */}
              <div className="max-w-[75%] sm:max-w-md space-y-1">
                {showSenderName && (
                  <span className="text-[9px] text-slate-400 font-bold block pl-1.5 flex items-center space-x-1 justify-start">
                    <span>{senderName}</span>
                    {isAdminBadge && (
                      <span className="text-[7px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 px-1 rounded-md scale-90">
                        Admin
                      </span>
                    )}
                  </span>
                )}

                {/* Bubble card */}
                <div className={`p-3 rounded-2xl ${
                  isMe 
                    ? 'bg-bg-bubble-me text-white rounded-tr-none' 
                    : 'bg-bg-bubble-other text-slate-100 rounded-tl-none border border-white/[0.02]'
                }`}>
                  <p className="text-[12px] sm:text-xs leading-normal select-text whitespace-pre-wrap break-words">
                    {msg.text}
                  </p>
                  
                  {/* Timestamp inside bubble */}
                  <div className="flex items-center justify-end space-x-1 mt-1">
                    <span className="text-[8px] text-white/45">
                      {formatMessageTime(msg.createdAt)}
                    </span>
                    {isMe && (
                      <span className="text-[8.5px] text-indigo-200/60 font-bold select-none" title="Sent">
                        ✓
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sender avatar */}
              {isMe && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/20 flex items-center justify-center text-[10px] font-bold text-indigo-300 mt-1">
                  You
                </div>
              )}
            </div>
          );
        })}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating auto-scroll bottom badge */}
      {newMessagesCount > 0 && (
        <button
          onClick={() => scrollToBottom('smooth')}
          aria-label={`${newMessagesCount} new messages below`}
          className="absolute bottom-20 right-6 px-4.5 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 border border-indigo-500 text-[10px] font-bold flex items-center space-x-2 animate-bounce z-25 transition-all group"
        >
          <span className="w-4.5 h-4.5 bg-white text-indigo-600 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0">
            {newMessagesCount}
          </span>
          <span>{newMessagesCount === 1 ? 'New message below' : 'New messages below'}</span>
          <ArrowDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
        </button>
      )}

      {/* Message Compose Form */}
      <form 
        onSubmit={handleSend}
        className="p-4 border-t border-white/10 glass-panel bg-white/[0.01] flex items-center space-x-3 shrink-0 z-10"
      >
        <input
          type="text"
          placeholder={isSocketConnected ? "Type a message..." : "Disconnected... Reconnecting..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isSendingMessage || !isSocketConnected}
          className="glass-input flex-1 px-4 py-3 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!text.trim() || isSendingMessage || !isSocketConnected}
          className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 transition-all shrink-0 flex items-center justify-center disabled:cursor-not-allowed"
          title="Send Message"
        >
          {isSendingMessage ? (
            <Loader2 className="w-4.5 h-4.5 animate-spin" />
          ) : (
            <Send className="w-4.5 h-4.5" />
          )}
        </button>
      </form>

      {/* Settings Modal overlay */}
      {isGroup && (
        <GroupSettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          conversation={activeConversation as GroupConversation}
        />
      )}
    </div>
  );
}
