'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatStore } from '@/store/useChatStore';
import { useDebounce } from '@/hooks/useDebounce';
import { api } from '@/services/api';
import { User } from '@/types/chat';
import { formatMessageTime } from '@/utils/date';
import { 
  LogOut, 
  Search, 
  Users, 
  MessageSquare, 
  Plus, 
  Loader2, 
  User as UserIcon 
} from 'lucide-react';
import toast from 'react-hot-toast';
import GroupCreateModal from './GroupCreateModal';

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const { 
    conversations, 
    activeConversation, 
    setActiveConversation, 
    isLoadingConversations,
    createDirectConversation,
    isSocketConnected,
    fetchConversations
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Handle debounced search query
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const response = await api.get<unknown>(`/users/search?q=${encodeURIComponent(debouncedSearchQuery)}`);
        const rawData = response.data;
        const usersArray = Array.isArray(rawData)
          ? (rawData as User[])
          : (typeof rawData === 'object' && rawData !== null && 'value' in rawData && Array.isArray((rawData as { value: unknown }).value))
            ? ((rawData as { value: User[] }).value)
            : [];
        // Exclude current user from search results
        const filtered = usersArray.filter((u) => u._id !== user?._id);
        setSearchResults(filtered);
      } catch (err) {
        console.error('Search users error:', err);
      } finally {
        setIsSearching(false);
      }
    };
    performSearch();
  }, [debouncedSearchQuery, user?._id]);

  const handleStartChat = async (targetUser: User) => {
    try {
      // Clear search
      setSearchQuery('');
      setSearchResults([]);
      
      // Check if conversation already exists in active store list
      const existing = conversations.find(
        (c) => c.type === 'direct' && c.participant._id === targetUser._id
      );

      if (existing) {
        setActiveConversation(existing);
      } else {
        // Create direct conversation
        await createDirectConversation(targetUser._id);
        toast.success(`Chat started with ${targetUser.name}!`);
      }
    } catch (err) {
      console.error('Start chat error:', err);
      toast.error('Could not start chat.');
    }
  };

  return (
    <div className="w-full md:w-80 h-full border-r border-white/10 flex flex-col bg-bg-panel text-white relative">
      
      {/* Current User Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center space-x-3 text-left">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300">
            {user?.name ? user.name[0].toUpperCase() : <UserIcon className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold text-white block truncate">{user?.name}</span>
            <span className="text-[10px] text-slate-400 block truncate">{user?.phone}</span>
          </div>
        </div>

        {/* Socket Connection & Logout Actions */}
        <div className="flex items-center space-x-2">
          {/* Socket Indicator */}
          <div className="relative group cursor-help">
            <div className={`w-2.5 h-2.5 rounded-full ${isSocketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-pulse'}`} />
            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block glass-panel px-2.5 py-1 rounded-lg text-[9px] whitespace-nowrap text-slate-300 border border-white/10">
              {isSocketConnected ? 'Real-time connected' : 'Disconnected, retrying...'}
            </div>
          </div>

          <button 
            onClick={logout} 
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
            title="Logout"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Action panel (Search & Add Group) */}
      <div className="p-3 border-b border-white/5 space-y-2">
        <div className="flex items-center space-x-2">
          {/* Search bar */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input 
              type="text" 
              placeholder="Search by name or phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-full pl-9 pr-3 py-2.5 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none"
            />
          </div>

          {/* New Group Button */}
          <button 
            onClick={() => setIsGroupModalOpen(true)}
            className="p-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/20 rounded-xl transition-all"
            title="Create New Group"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conversations / Search results list */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {searchQuery.trim() ? (
          // Render Search Results
          <div className="p-2 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wide">Search Results</span>
            {isSearching ? (
              <div className="flex justify-center py-8 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : searchResults.length > 0 ? (
              searchResults.map((targetUser) => (
                <button
                  key={targetUser._id}
                  onClick={() => handleStartChat(targetUser)}
                  className="w-full p-3 rounded-2xl flex items-center space-x-3 hover:bg-white/5 transition-all text-left border border-transparent hover:border-white/5"
                >
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center font-bold text-indigo-300">
                    {targetUser.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-white block">{targetUser.name}</span>
                    <span className="text-[10px] text-slate-400 block">{targetUser.phone}</span>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                No users found.
              </div>
            )}
          </div>
        ) : (
          // Render Chat List
          <div className="p-2 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wide">Conversations</span>
            
            {isLoadingConversations && conversations.length === 0 ? (
              // Skeleton loading states
              <div className="space-y-2 p-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex items-center space-x-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse">
                    <div className="w-9 h-9 rounded-lg bg-white/5" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-white/5 rounded w-[45%]" />
                      <div className="h-2.5 bg-white/5 rounded w-[75%]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length > 0 ? (
              conversations.map((room) => {
                const isActive = activeConversation?._id === room._id;
                const isGroup = room.type === 'group';
                
                // Resolve name and initials
                const roomName = isGroup ? room.name : room.participant.name;
                const initials = roomName ? roomName[0].toUpperCase() : '?';

                return (
                  <button
                    key={room._id}
                    onClick={() => setActiveConversation(room)}
                    className={`w-full p-3 rounded-2xl flex items-center space-x-3 transition-all text-left border ${
                      isActive 
                        ? 'bg-indigo-600/10 border-indigo-500/20 text-white' 
                        : 'border-transparent hover:bg-white/5 text-slate-300 hover:text-white'
                    }`}
                  >
                    {/* Avatar */}
                    <div className={`w-9.5 h-9.5 rounded-xl flex items-center justify-center font-bold text-xs relative ${
                      isGroup 
                        ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20' 
                        : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                    }`}>
                      {initials}
                      {/* Group marker icon */}
                      {isGroup && (
                        <div className="absolute -bottom-1 -right-1 bg-teal-500 p-0.5 rounded-md border border-bg-panel">
                          <Users className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                          {roomName}
                        </span>
                        <span className="text-[9px] text-slate-500 shrink-0">
                          {formatMessageTime(room.updatedAt)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-[10px] truncate pr-4 ${room.hasUnread ? 'text-indigo-300 font-bold' : 'text-slate-400'}`}>
                          {room.lastMessage?.text ? (
                            <>
                              {isGroup && room.lastMessage.sender === user?._id && 'You: '}
                              {room.lastMessage.text}
                            </>
                          ) : (
                            <span className="italic text-slate-500">No messages</span>
                          )}
                        </p>
                        {room.hasUnread && (
                          <span className="w-2 h-2 bg-indigo-500 rounded-full shrink-0 animate-pulse" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-12 px-4 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-500">No chats started.</p>
                <p className="text-[10px] text-slate-600 leading-normal">
                  Search for a friend by name or phone number in the search bar above to start chatting.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <GroupCreateModal 
        isOpen={isGroupModalOpen} 
        onClose={() => setIsGroupModalOpen(false)} 
      />
    </div>
  );
}
