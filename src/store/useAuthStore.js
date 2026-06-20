import { create } from 'zustand';
import { supabase } from '../lib/supabase';

const useAuthStore = create((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  realtimeChannel: null,
  
  initialize: async () => {
    try {
      set({ isLoading: true });
      const { data: { session } } = await supabase.auth.getSession();
      
      set({ session, user: session?.user || null });
      if (session) {
        await get().fetchProfile(session.user, true);
      } else {
        set({ profile: null, isLoading: false });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(`Auth state change event: ${event}`);
        
        if (event === 'SIGNED_OUT' || !session) {
          // Clean up realtime channel on logout
          const channel = get().realtimeChannel;
          if (channel) {
            supabase.removeChannel(channel);
          }
          set({ session: null, user: null, profile: null, isLoading: false, realtimeChannel: null });
          return;
        }

        set({ session, user: session.user });
        
        // Fetch profile and setup realtime if we don't have it or on login
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await get().fetchProfile(session.user, true);
        } else {
          await get().fetchProfile(session.user, false);
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ isLoading: false });
    }
  },

  fetchProfile: async (user, setGlobalLoading = false) => {
    if (!user?.id) return;
    if (setGlobalLoading) {
      set({ isLoading: true });
    }
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (userError && userError.code !== 'PGRST116') throw userError;
      
      if (userData) {
        if (userData.status === 'suspended') {
          const channel = get().realtimeChannel;
          if (channel) {
            supabase.removeChannel(channel);
          }
          await supabase.auth.signOut();
          set({ session: null, user: null, profile: null, isLoading: false, realtimeChannel: null });
          window.location.href = '/login?suspended=true';
          return;
        }

        if (userData.status === 'deactivated' || userData.status === 'pending_deletion') {
          await supabase.from('users').update({ 
            status: 'active',
            deactivation_reason: null,
            deletion_reason: null,
            deletion_requested_at: null
          }).eq('id', user.id);
          userData.status = 'active';
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
        
        // Set up real-time subscription for profile changes if not already set
        if (!get().realtimeChannel) {
          get().setupRealtime(user.id, userData.role);
        }
      } else {
        set({ profile: null });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      if (setGlobalLoading) {
        set({ isLoading: false });
      }
    }
  },

  setupRealtime: (userId, role) => {
    // Clean up existing channel first if any
    const existingChannel = get().realtimeChannel;
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    console.log(`Setting up real-time subscription for user ${userId} (${role})`);
    
    const channel = supabase.channel(`user-profile-updates-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`
        },
        async (payload) => {
          console.log('Realtime users table update received:', payload);
          await get().fetchProfile({ id: userId }, false);
        }
      );

    if (role === 'tutor') {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tutor_profiles',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          console.log('Realtime tutor_profiles table update received:', payload);
          await get().fetchProfile({ id: userId }, false);
        }
      );
    } else if (role === 'guardian') {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guardian_profiles',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          console.log('Realtime guardian_profiles table update received:', payload);
          await get().fetchProfile({ id: userId }, false);
        }
      );
    }

    channel.subscribe((status) => {
      console.log(`Realtime subscription status for user ${userId}:`, status);
    });

    set({ realtimeChannel: channel });
  },

  signOut: async () => {
    try {
      const channel = get().realtimeChannel;
      if (channel) {
        supabase.removeChannel(channel);
      }
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during Supabase signOut:', error);
    } finally {
      set({ session: null, user: null, profile: null, isLoading: false, realtimeChannel: null });
      window.location.href = '/';
    }
  }
}));

export default useAuthStore;

