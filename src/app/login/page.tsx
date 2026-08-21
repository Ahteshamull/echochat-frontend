'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { MessageSquare, Phone, User as UserIcon, Loader2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated } = useAuthStore();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/chat');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim() || !name.trim()) {
      toast.error('Both phone number and name are required!');
      return;
    }

    const formattedPhone = phone.trim();
    if (formattedPhone.length < 6) {
      toast.error('Please enter a valid phone number!');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(formattedPhone, name.trim());
      toast.success('Login successful!');
      router.push('/chat');
    } catch (err: unknown) {
      let message = 'Login failed.';
      const axiosError = err as {
        response?: {
          data?: {
            error?: {
              message?: string;
            };
          };
        };
      };
      if (axiosError.response?.data?.error?.message) {
        message = axiosError.response.data.error.message;
      }
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-midnight flex flex-col justify-center py-12 sm:px-6 lg:px-8 gradient-bg relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />

      {/* Back to Home Link */}
      <div className="absolute top-6 left-6 z-10">
        <Link 
          href="/"
          className="text-sm font-semibold text-slate-400 hover:text-white flex items-center space-x-1.5 transition-all"
        >
          <span>← Back to Home</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          Welcome to EchoChat
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Enter your name and phone number to start chatting. <br />
          No separate registration is required!
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="glass-effect py-8 px-6 sm:px-10 rounded-3xl shadow-xl border border-white/10 relative overflow-hidden">
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">
                Phone Number (Must be unique)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-4.5 w-4.5" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  required
                  placeholder="e.g. +15551234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSubmitting}
                  className="glass-input block w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                Your Name
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="h-4.5 w-4.5" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Ada Lovelace"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  className="glass-input block w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder-slate-500 text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 group"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Login</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {isSubmitting && (
            <div className="mt-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 leading-relaxed text-center animate-pulse">
              Connecting to the server for the first time might take up to 50 seconds to spin up. Please wait.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
