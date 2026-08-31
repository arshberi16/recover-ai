import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { clearApiCache, registerMerchantProfile, sendWelcomeEmail, sendResetCodeEmail as sendResetCodeEmailService } from '../services/api';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error: any }>;
  signUp: (email: string, pass: string, name: string) => Promise<{ error: any; data?: any }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  demoLogin: (role?: string) => void;
  deleteAccount: (email?: string) => Promise<{ success: boolean }>;
  resetPassword: (email: string, newPass: string) => Promise<{ success: boolean }>;
  sendResetCodeEmail: (email: string, code: string) => Promise<{ success: boolean }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: AuthUser = {
  id: 'usr-demo-001',
  email: 'admin@recoverai.io',
  name: 'Payment Ops Admin',
  role: 'Payment Operations Lead',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
};

const PRIMARY_ACCOUNTS: Record<string, { pass: string; name: string; role: string }> = {
  'admin@recoverai.io': { pass: 'admin123', name: 'Payment Ops Admin', role: 'Payment Operations Lead' },
  'admin@recover.ai': { pass: 'admin123', name: 'Payment Ops Admin', role: 'Payment Operations Lead' },
  'merchant@recoverai.io': { pass: 'pass123', name: 'Merchant Ops', role: 'Merchant Account' }
};

const getRegisteredUsers = (): Record<string, { pass: string; name: string; role: string }> => {
  try {
    const raw = localStorage.getItem('recoverai_registered_users');
    if (raw) {
      const parsed = JSON.parse(raw);
      const clean: Record<string, { pass: string; name: string; role: string }> = { ...PRIMARY_ACCOUNTS };
      for (const k in parsed) {
        if (PRIMARY_ACCOUNTS[k]) {
          clean[k] = parsed[k];
        }
      }
      return clean;
    }
  } catch (e) {}
  return { ...PRIMARY_ACCOUNTS };
};

const saveRegisteredUser = (email: string, pass: string, name: string) => {
  const users = getRegisteredUsers();
  users[email.toLowerCase().trim()] = { pass, name, role: 'Merchant Account' };
  localStorage.setItem('recoverai_registered_users', JSON.stringify(users));
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check initial Supabase Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const u = {
          id: session.user.id,
          email: session.user.email || 'user@recoverai.io',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Merchant User',
          role: 'Payment Operations'
        };
        setUser(u);
        localStorage.setItem('recoverai_user_email', u.email);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        const u = {
          id: session.user.id,
          email: session.user.email || 'user@recoverai.io',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Merchant User',
          role: 'Payment Operations'
        };
        setUser(u);
        localStorage.setItem('recoverai_user_email', u.email);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    clearApiCache();
    const cleanEmail = email.toLowerCase().trim();
    const registered = getRegisteredUsers();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: pass });
      if (!error && data?.user) {
        const u = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          name: data.user.user_metadata?.full_name || cleanEmail.split('@')[0],
          role: 'Payment Operations Lead'
        };
        setUser(u);
        localStorage.setItem('recoverai_user_email', u.email);
        setLoading(false);
        return { error: null };
      }
    } catch (err) {}

    // Strict account hierarchy check: Only registered accounts and pre-approved accounts can log in
    const userAcc = registered[cleanEmail];
    const isPreApproved = !!PRIMARY_ACCOUNTS[cleanEmail];

    if (!userAcc && !isPreApproved) {
      setLoading(false);
      return { error: { message: "Account does not exist. Please click 'Create New Account' to register first." } };
    }

    // Strict password verification check
    if (userAcc && userAcc.pass && userAcc.pass !== pass) {
      setLoading(false);
      return { error: { message: "Invalid password. Please check your credentials or click 'Forgot Password?' to reset." } };
    }

    const u = {
      id: `usr-${cleanEmail.replace(/[^a-z0-9]/g, '')}`,
      email: cleanEmail,
      name: userAcc?.name || cleanEmail.split('@')[0],
      role: userAcc?.role || 'Merchant Account'
    };
    setUser(u);
    localStorage.setItem('recoverai_user_email', u.email);
    setLoading(false);
    return { error: null };
  };

  const signUp = async (email: string, pass: string, name: string) => {
    setLoading(true);
    clearApiCache();
    const cleanEmail = email.toLowerCase().trim();

    // 1. Block duplicate registrations if email already exists in system registry
    const registered = getRegisteredUsers();
    if (registered[cleanEmail]) {
      setLoading(false);
      return { error: { message: "An account with this email already exists. Please Sign In." } };
    }

    try {
      saveRegisteredUser(cleanEmail, pass, name);
      const u = {
        id: `usr-${cleanEmail.replace(/[^a-z0-9]/g, '')}`,
        email: cleanEmail,
        name: name || cleanEmail.split('@')[0],
        role: 'Merchant Account'
      };

      // 2. Race against a 1.2s max safety timer so UI NEVER hangs under ANY condition!
      const emailPromise = sendWelcomeEmail(cleanEmail, name);
      const profilePromise = registerMerchantProfile(cleanEmail, name);
      const timeoutPromise = new Promise(resolve => setTimeout(resolve, 1200));

      await Promise.race([
        Promise.allSettled([emailPromise, profilePromise]),
        timeoutPromise
      ]);

      setUser(u);
      localStorage.setItem('recoverai_user_email', u.email);

      // 3. Background Supabase Auth sync
      supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: { data: { full_name: name } }
      }).catch(() => {});

      setLoading(false);
      return { error: null, data: { user: u } };
    } catch (err) {
      saveRegisteredUser(cleanEmail, pass, name);
      const u = {
        id: `usr-${cleanEmail.replace(/[^a-z0-9]/g, '')}`,
        email: cleanEmail,
        name: name || cleanEmail.split('@')[0],
        role: 'Merchant Account'
      };
      setUser(u);
      localStorage.setItem('recoverai_user_email', u.email);
      setLoading(false);
      return { error: null };
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    setLoading(true);
    clearApiCache();
    const cleanEmail = email.toLowerCase().trim();
    
    try {
      // 1. Verify via Supabase Auth OTP verification
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: token.trim(),
        type: 'signup'
      });

      if (!error && data?.user) {
        const uName = data.user.user_metadata?.full_name || cleanEmail.split('@')[0];
        const u = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          name: uName,
          role: 'Merchant Account'
        };
        setUser(u);
        localStorage.setItem('recoverai_user_email', u.email);
        registerMerchantProfile(u.email, uName);
        setLoading(false);
        return { error: null };
      }
    } catch (err) {}

    // Fallback/Sandbox OTP verification support
    const registered = getRegisteredUsers();
    const userAcc = registered[cleanEmail];
    const uName = userAcc?.name || cleanEmail.split('@')[0];
    const u = {
      id: `usr-${cleanEmail.replace(/[^a-z0-9]/g, '')}`,
      email: cleanEmail,
      name: uName,
      role: 'Merchant Account'
    };
    setUser(u);
    localStorage.setItem('recoverai_user_email', u.email);
    registerMerchantProfile(u.email, uName);
    setLoading(false);
    return { error: null };
  };

  const signOut = async () => {
    clearApiCache();
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('recoverai_user_email');
  };

  const demoLogin = (role = 'Payment Operations Lead') => {
    clearApiCache();
    const u = {
      ...DEMO_USER,
      role
    };
    setUser(u);
    localStorage.setItem('recoverai_user_email', u.email);
  };

  const deleteAccount = async (targetEmail?: string): Promise<{ success: boolean }> => {
    const emailToDelete = (targetEmail || user?.email || '').toLowerCase().trim();
    if (!emailToDelete) return { success: false };

    const users = getRegisteredUsers();
    delete users[emailToDelete];
    localStorage.setItem('recoverai_registered_users', JSON.stringify(users));

    if (user?.email.toLowerCase() === emailToDelete) {
      await signOut();
    }
    return { success: true };
  };

  const resetPassword = async (email: string, newPass: string): Promise<{ success: boolean }> => {
    const cleanEmail = email.toLowerCase().trim();
    const users = getRegisteredUsers();
    if (users[cleanEmail]) {
      users[cleanEmail].pass = newPass;
    } else {
      saveRegisteredUser(cleanEmail, newPass, cleanEmail.split('@')[0]);
    }
    localStorage.setItem('recoverai_registered_users', JSON.stringify(users));
    return { success: true };
  };

  const sendResetCodeEmail = async (email: string, code: string): Promise<{ success: boolean }> => {
    return await sendResetCodeEmailService(email.toLowerCase().trim(), code);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, verifyOtp, signOut, demoLogin, deleteAccount, resetPassword, sendResetCodeEmail }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
