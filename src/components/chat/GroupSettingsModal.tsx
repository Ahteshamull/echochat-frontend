'use client';

import { useState, useEffect } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/services/api';
import { User, GroupConversation } from '@/types/chat';
import { X, UserMinus, ShieldAlert, Edit, UserPlus, Loader2, LogOut, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: GroupConversation;
}

export default function GroupSettingsModal({ isOpen, onClose, conversation }: GroupSettingsModalProps) {
  const { user: currentUser } = useAuthStore();
  const { 
    removeParticipant, 
    promoteToAdmin, 
    renameGroup, 
    addParticipants 
  } = useChatStore();

  const [newName, setNewName] = useState(conversation.name);
  const [isRenaming, setIsRenaming] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
  });

  const triggerConfirm = (
    title: string,
    message: string,
    type: 'danger' | 'info',
    onConfirm: () => void
  ) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      type,
      onConfirm,
    });
  };

  // Sync rename input when conversation changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setNewName(conversation.name);
    }, 0);
    return () => clearTimeout(timer);
  }, [conversation.name]);

  if (!isOpen) return null;

  const isAdmin = conversation.admins.includes(currentUser?._id || '');

  const handleRename = async () => {
    if (!newName.trim() || newName.trim() === conversation.name) return;
    setIsRenaming(true);
    try {
      await renameGroup(conversation._id, newName.trim());
      toast.success('Group name renamed successfully!');
    } catch (err) {
      toast.error('Failed to rename group.');
    } finally {
      setIsRenaming(false);
    }
  };

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
      // Exclude users already in the group
      const filtered = usersArray.filter(
        (user) => !conversation.participants.some((p) => p._id === user._id)
      );
      setSearchResults(filtered);
    } catch (err) {
      console.error('Add search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddUser = async (userId: string, userName: string) => {
    setIsAddingUser(true);
    try {
      await addParticipants(conversation._id, [userId]);
      toast.success(`${userName} added to the group!`);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      toast.error('Failed to add member.');
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleRemoveUser = async (userId: string, userName: string) => {
    triggerConfirm(
      'Remove Member',
      `Are you sure you want to remove ${userName} from the group?`,
      'danger',
      async () => {
        try {
          await removeParticipant(conversation._id, userId);
          toast.success(`${userName} removed from group successfully.`);
        } catch (err) {
          toast.error('Failed to remove member.');
        }
      }
    );
  };

  const handlePromoteAdmin = async (userId: string, userName: string) => {
    triggerConfirm(
      'Promote to Admin',
      `Do you want to promote ${userName} to admin?`,
      'info',
      async () => {
        try {
          await promoteToAdmin(conversation._id, userId);
          toast.success(`${userName} is now an admin!`);
        } catch (err) {
          toast.error('Failed to promote member.');
        }
      }
    );
  };

  const handleLeaveGroup = async () => {
    triggerConfirm(
      'Leave Group',
      'Are you sure you want to leave this group?',
      'danger',
      async () => {
        setIsLeaving(true);
        try {
          await removeParticipant(conversation._id, currentUser?._id || '');
          toast.success('You left the group successfully.');
          onClose();
        } catch (err) {
          toast.error('Failed to leave group.');
        } finally {
          setIsLeaving(false);
        }
      }
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-effect w-full max-w-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-slide-up">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="text-left">
            <h3 className="text-lg font-bold text-white">Group Info & Settings</h3>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Created: {new Date(conversation.createdAt || conversation.updatedAt).toLocaleDateString()}
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6 custom-scrollbar text-left">
          
          {/* Rename section (Admins only) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase">Rename Group</label>
            <div className="flex space-x-2">
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={!isAdmin || isRenaming}
                className="glass-input flex-1 px-4 py-2.5 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none disabled:opacity-50"
              />
              {isAdmin && (
                <button 
                  onClick={handleRename}
                  disabled={isRenaming || newName.trim() === conversation.name}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
                >
                  {isRenaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Edit className="w-3.5 h-3.5" />}
                  <span>Update</span>
                </button>
              )}
            </div>
            {!isAdmin && (
              <span className="text-[10px] text-slate-500 block">
                * Only admins can rename the group.
              </span>
            )}
          </div>

          {/* Add member section (Admins only) */}
          {isAdmin && (
            <div className="space-y-2 border-t border-white/5 pt-4">
              <label className="text-xs font-semibold text-slate-400 uppercase">Add New Member</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search by name or phone..." 
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="glass-input w-full pl-9 pr-3 py-2.5 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none"
                />
              </div>

              {/* Add member search list */}
              {isSearching ? (
                <div className="flex justify-center py-4 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar border border-white/5 p-1 rounded-xl bg-white/[0.01]">
                  {searchResults.map((user) => (
                    <div 
                      key={user._id}
                      className="p-1.5 hover:bg-white/5 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="text-white font-medium block">{user.name}</span>
                        <span className="text-[9px] text-slate-400">{user.phone}</span>
                      </div>
                      <button
                        onClick={() => handleAddUser(user._id, user.name)}
                        disabled={isAddingUser}
                        className="p-1 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded transition-all"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : searchQuery.trim() ? (
                <div className="text-center py-4 text-[10px] text-slate-500">
                  No users found outside this group.
                </div>
              ) : null}
            </div>
          )}

          {/* Members list */}
          <div className="space-y-2 border-t border-white/5 pt-4">
            <label className="text-xs font-semibold text-slate-400 uppercase block">
              Group Members ({conversation.participants.length})
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {conversation.participants.map((member) => {
                const isMemberAdmin = conversation.admins.includes(member._id);
                const isSelf = member._id === currentUser?._id;

                return (
                  <div 
                    key={member._id}
                    className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold text-xs text-slate-300">
                        {member.name[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white flex items-center space-x-1.5">
                          <span>{member.name}</span>
                          {isSelf && <span className="text-[9px] bg-slate-700 text-slate-300 px-1 py-0.2 rounded">You</span>}
                        </span>
                        <span className="text-[9px] text-slate-400 block">{member.phone}</span>
                      </div>
                    </div>

                    {/* Member Actions */}
                    <div className="flex items-center space-x-1.5">
                      {isMemberAdmin && (
                        <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                          Admin
                        </span>
                      )}

                      {/* Admin controls over other members */}
                      {isAdmin && !isSelf && (
                        <>
                          {/* Promote Admin Button */}
                          {!isMemberAdmin && (
                            <button
                              onClick={() => handlePromoteAdmin(member._id, member.name)}
                              className="p-1 hover:bg-white/5 text-slate-400 hover:text-indigo-400 rounded-md transition-all"
                              title="Promote to Admin"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </button>
                          )}
                          
                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemoveUser(member._id, member.name)}
                            className="p-1 hover:bg-white/5 text-slate-400 hover:text-rose-400 rounded-md transition-all"
                            title="Remove from Group"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-white/10 bg-white/[0.02] flex items-center justify-end">
          <button 
            onClick={handleLeaveGroup}
            disabled={isLeaving}
            className="px-4 py-2 bg-rose-600/10 hover:bg-rose-600 border border-rose-500/20 hover:border-transparent text-rose-400 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
          >
            {isLeaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span>Leave Group</span>
          </button>
        </div>

      </div>
    </div>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
      />
    </>
  );
}
