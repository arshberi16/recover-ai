import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { clearApiCache } from '../services/api';

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
  signUp: (email: string, pass: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  demoLogin: (role?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: AuthUser = {
  id: 'usr-demo-001',
  email: 'admin@recoverai.io',
  name: 'Payment Ops Admin',
  role: 'Payment Operations Lead',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
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
    try {
      const { data } = await supabase.auth.signInWithPassword({ email, password: pass });
      const targetEmail = data?.user?.email || email;
      const u = {
        id: data?.user?.id || `usr-${Date.now()}`,
        email: targetEmail,
        name: data?.user?.user_metadata?.full_name || email.split('@')[0],
        role: 'Payment Operations Lead'
      };
      setUser(u);
      localStorage.setItem('recoverai_user_email', u.email);
      return { error: null };
    } catch (err) {
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, pass: string, name: string) => {
    setLoading(true);
    clearApiCache();
    try {
      const { data } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { full_name: name } }
      });
      const targetEmail = data?.user?.email || email;
      const u = {
        id: data?.user?.id || `usr-${Date.now()}`,
        email: targetEmail,
        name: name || email.split('@')[0],
        role: 'Payment Operations'
      };
      setUser(u);
      localStorage.setItem('recoverai_user_email', u.email);
      return { error: null };
    } catch (err) {
      return { error: err };
    } finally {
      setLoading(false);
    }
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

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, demoLogin }}>
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
