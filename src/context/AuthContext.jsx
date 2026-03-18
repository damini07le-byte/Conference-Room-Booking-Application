import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                // Try to get session, but don't let a timeout block the app forever
                const { data, error } = await supabase.auth.getSession();
                if (error) throw error;
                
                const session = data?.session;
                if (session) {
                    // Try to fetch profile, but don't block the main user object if it's slow
                    fetchProfile(session.user);
                }
            } catch (error) {
                console.error("Auth init failed:", error);
            } finally {
                setLoading(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                // Add timeout to profile fetch to prevent hanging in loading state
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Profile Timeout')), 3000));
                const profilePromise = fetchProfile(session.user);
                
                try {
                    await Promise.race([profilePromise, timeoutPromise]);
                } catch (e) {
                    console.warn("Profile fetch timed out, continuing with partial user data");
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (authUser) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('user_id', authUser.id)
                .single();

            if (data) {
                setUser({ ...authUser, ...data });
            } else {
                setUser(authUser);
            }
        } catch (error) {
            console.error('Profile fetch error:', error);
            setUser(authUser);
        }
    };

    const login = async (email, password) => {
        try {
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Login connection timed out. Please check your internet or Supabase status.')), 6000));
            const loginPromise = supabase.auth.signInWithPassword({
                email,
                password,
            });

            const { data, error } = await Promise.race([loginPromise, timeoutPromise]);

            if (error) return { success: false, message: error.message };
            return { success: true };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    const signUp = async (email, password, profileData) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) return { success: false, message: error.message };

        if (data.user) {
            const { error: profileError } = await supabase
                .from('users')
                .insert([{
                    user_id: data.user.id,
                    email: email,
                    full_name: profileData.full_name,
                    department: profileData.department,
                    role: profileData.role || 'EMPLOYEE'
                }]);
            
            if (profileError) console.error('Profile Creation Error:', profileError);
        }

        return { success: true };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, signUp, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
