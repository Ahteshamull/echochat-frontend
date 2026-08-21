'use client';

import { useState } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { api } from '@/services/api';
import { User } from '@/types/chat';
import { X, Search, UserPlus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface GroupCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GroupCreateModal({ isOpen, onClose }: GroupCreateModalProps) {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { createGroupConversation } = useChatStore();

  if (!isOpen) return null;

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.get<unknown>(`/users/search?q=${encodeURIComponent(query)}`);
      const rawData = response.data;
      const usersArray = Array.isArray(rawData)
        ? (rawData as User[])
        : (typeof rawData === 'object' && rawData !== null && 'value' in rawData && Array.isArray((rawData as { value: unknown }).value))
          ? ((rawData as { value: User[] }).value)
          : [];
      // Exclude already selected users from search results
      const filtered = usersArray.filter(
        (user) => !selectedUsers.some((selected) => selected._id === user._id)
      );
      setSearchResults(filtered);
    } catch (err) {
      console.error('Search error in modal:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchResults(searchResults.filter((u) => u._id !== user._id));
  };

  const handleDeselectUser = (user: User) => {
    setSelectedUsers(selectedUsers.filter((u) => u._id !== user._id));
    if (searchQuery.trim()) {
      setSearchResults([...searchResults, user]);
    }
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name!');
      return;
    }

    if (selectedUsers.length < 2) {
      toast.error('Select at least 2 other members to start a group chat!');
      return;
    }

    setIsCreating(true);
    try {
      const participantIds = selectedUsers.map((u) => u._id);
      await createGroupConversation(groupName.trim(), participantIds);
      toast.success('Group chat created successfully!');
      onClose();
      // Reset state
      setGroupName('');
      setSelectedUsers([]);
      setSearchResults([]);
      setSearchQuery('');
    } catch (err: unknown) {
      let errMsg = 'Could not create group chat.';
      const axiosError = err as {
        response?: {
          data?: {
            error?: {
              details?: Array<{ message: string }>;
            };
          };
        };
      };
      if (axiosError.response?.data?.error?.details) {
        errMsg = axiosError.response.data.error.details.map((d) => d.message).join(', ');
      }
      toast.error(errMsg);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-effect w-full max-w-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-slide-up">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Create New Group</h3>
          <button 
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 custom-scrollbar text-left">
          
          {/* Group Name input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase">Group Name</label>
            <input 
              type="text" 
              placeholder="e.g. Project Team" 
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              disabled={isCreating}
              className="glass-input w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none"
            />
          </div>

          {/* Selected participants list */}
          {selectedUsers.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase">
                Selected Members ({selectedUsers.length})
              </label>
              <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-white/5 border border-white/5">
                {selectedUsers.map((user) => (
                  <div 
                    key={user._id}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 text-xs font-medium"
                  >
                    <span>{user.name}</span>
                    <button 
                      onClick={() => handleDeselectUser(user)}
                      className="p-0.5 hover:text-white text-indigo-400 rounded-full transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Search Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase">Search Members (Name or Phone)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input 
                type="text" 
                placeholder="e.g. Ada" 
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                disabled={isCreating}
                className="glass-input w-full pl-9 pr-4 py-2.5 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Search results list */}
          <div className="space-y-2">
            {isSearching ? (
              <div className="flex justify-center py-6 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                {searchResults.map((user) => (
                  <div 
                    key={user._id}
                    className="p-2 hover:bg-white/5 rounded-xl flex items-center justify-between transition-all"
                  >
                    <div className="text-left">
                      <span className="text-xs font-semibold text-white block">{user.name}</span>
                      <span className="text-[10px] text-slate-400">{user.phone}</span>
                    </div>
                    <button
                      onClick={() => handleSelectUser(user)}
                      className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : searchQuery.trim() ? (
              <div className="text-center py-6 text-xs text-slate-500">
                No users found.
              </div>
            ) : null}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            * Min 3 members required (You + 2 members)
          </span>
          <div className="flex space-x-2">
            <button 
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleCreate}
              disabled={isCreating || selectedUsers.length < 2 || !groupName.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Group</span>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
