'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import Sidebar from '@/components/chat/Sidebar';
import ChatArea from '@/components/chat/ChatArea';

export default function ChatPage() {
  const { isAuthenticated, isRestoring } = useAuthStore();
  const { activeConversation } = useChatStore();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isRestoring && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isRestoring, router]);

  if (isRestoring || !isAuthenticated) {
    return null; // Initialized by AppInitializer loading screen anyway
  }

  return (
    <div className="w-full h-screen flex overflow-hidden bg-bg-midnight relative">
      {/* Sidebar Panel */}
      <div 
        className={`${
          activeConversation ? 'hidden md:flex' : 'flex'
        } w-full md:w-80 h-full shrink-0`}
      >
        <Sidebar />
      </div>

      {/* Chat Area Panel */}
      <div 
        className={`${
          activeConversation ? 'flex' : 'hidden md:flex'
        } flex-1 h-full`}
      >
        <ChatArea />
      </div>
    </div>
  );
}
