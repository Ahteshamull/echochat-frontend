'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function AppInitializer({ children }: { children: React.ReactNode }) {
  const { restoreSession, isRestoring, token, isAuthenticated } = useAuthStore();
  const { initSocket, disconnectSocket, isSocketConnected } = useChatStore();

  // Restore session on mount
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Handle socket lifecycle
  useEffect(() => {
    if (isAuthenticated && token) {
      initSocket(token);
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, token, initSocket, disconnectSocket]);

  if (isRestoring) {
    return (
      <div className="min-h-screen bg-bg-midnight text-white flex flex-col items-center justify-center p-6 gradient-bg">
        <div className="flex flex-col items-center max-w-md text-center space-y-6">
          <div className="relative">
            {/* outer ring */}
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            {/* inner icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-white animate-pulse">
              Restoring Session...
            </h2>
            <p className="text-sm text-slate-400">
              Verifying session with Render cloud backend. Initial wake-up can take up to 50 seconds.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <Toaster 
        position="top-center"
        toastOptions={{
          className: 'glass-panel text-white border border-white/10',
          style: {
            background: 'rgba(17, 21, 34, 0.9)',
            color: '#fff',
            backdropFilter: 'blur(10px)',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}
