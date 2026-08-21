'use client';

import { X, AlertTriangle, HelpCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  type?: 'danger' | 'info';
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const isDanger = type === 'danger';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Backdrop click closer */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className="glass-effect relative w-full max-w-sm rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col p-6 animate-slide-up space-y-4">
        
        {/* Header with Icon & Close Button */}
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-2xl ${
            isDanger 
              ? 'bg-rose-500/10 border border-rose-500/20' 
              : 'bg-indigo-500/10 border border-indigo-500/20'
          }`}>
            {isDanger ? (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            ) : (
              <HelpCircle className="w-5 h-5 text-indigo-400" />
            )}
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="text-left space-y-1.5">
          <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-white ${
              isDanger 
                ? 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-950/20' 
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-950/20'
            }`}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
}
