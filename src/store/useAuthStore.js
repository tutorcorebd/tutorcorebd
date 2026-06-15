import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const useAuthStore = create((set) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await useAuthStore.getState().fetchProfile(session.user);
      }
      
      set({ session, user: session?.user || null, isLoading: false });

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ session, user: session?.user || null });
        if (session) {
          await useAuthStore.getState().fetchProfile(session.user);
        } else {
          set({ profile: null });
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ isLoading: false });
    }
  },

  fetchProfile: async (user) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (userError && userError.code !== 'PGRST116') throw userError;
      
      if (userData) {
        if (userData.status === 'suspended') {
          await supabase.auth.signOut();
          set({ session: null, user: null, profile: null });
          window.location.href = '/login?suspended=true';
          return;
        }
        let completeProfile = { ...userData };
        
        if (userData.role === 'tutor') {
          const { data: tutorData, error: tutorError } = await supabase
            .from('tutor_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (!tutorError && tutorData) {
            completeProfile.tutor_profile = tutorData;
          }
        } else if (userData.role === 'guardian') {
          const { data: guardianData, error: guardianError } = await supabase
            .from('guardian_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
            
          if (!guardianError && guardianData) {
            completeProfile.guardian_profile = guardianData;
          }
        }
        
        set({ profile: completeProfile });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during Supabase signOut:', error);
    } finally {
      set({ session: null, user: null, profile: null });
      window.location.href = '/';
    }
  }
}));

export default useAuthStore;
