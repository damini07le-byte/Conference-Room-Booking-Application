import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const profile = user ? {
        full_name: user.full_name || user.email?.split('@')[0] || 'User',
        email: user.email,
        department: user.department,
        role: (user.role || (user.email?.toLowerCase().includes('admin') ? 'ADMIN' : 'EMPLOYEE')).toUpperCase(),
        reminder_30min: user.reminder_30min ?? true,
        daily_report: user.daily_report ?? true,
        email_alerts: user.email_alerts ?? true,
        slack_sync: user.slack_sync ?? false
    } : null;

    useEffect(() => {
        let isMounted = true;

        const handleProfileFetch = async (sessionUser) => {
            if (!sessionUser) return null;
            try {
                const { data: profileData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('user_id', sessionUser.id)
                    .single();
                return profileData ? { ...sessionUser, ...profileData } : sessionUser;
            } catch (err) {
                console.error("[Auth] Profile fetch error:", err);
                return sessionUser;
            }
        };

        const initialize = async () => {
            console.log("[Auth] initialize started");
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user && isMounted) {
                    const fullUser = await handleProfileFetch(session.user);
                    if (isMounted) setUser(fullUser);
                }
            } catch (err) {
                console.error("[Auth] initialize error:", err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                    console.log("[Auth] initialize complete");
                }
            }

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                console.log("[Auth] onAuthStateChange event:", event);
                
                if (session?.user) {
                    const fullUser = await handleProfileFetch(session.user);
                    if (isMounted) {
                        setUser(fullUser);
                        setLoading(false);
                    }
                } else {
                    if (isMounted) {
                        setUser(null);
                        setLoading(false);
                    }
                }
            });

            return subscription;
        };

        const subscriptionPromise = initialize();

        return () => {
            isMounted = false;
            subscriptionPromise.then(sub => sub?.unsubscribe());
        };
    }, []);

    const login = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) return { success: false, message: error.message };
            return { success: true };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    const signUp = async (email, password, profileData) => {
        try {
            // LAYER 1: Pre-Flight Check
            // Attempt a silent sign-in first. If it works, the user exists and we don't need to 'signUp' (which throttles).
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (!signInError && signInData.user) {
                // User already exists and entered correct password. Just trigger a profile refresh.
                await supabase.from('users').upsert([{
                    user_id: signInData.user.id,
                    email,
                    full_name: profileData.full_name,
                    department: profileData.department,
                    role: profileData.role || 'EMPLOYEE',
                    last_login: new Date().toISOString()
                }], { onConflict: 'user_id' });
                
                return { success: true, message: "Welcome back! Entering dashboard." };
            }

            // LAYER 2: Actual Silent Signup (Only if user doesn't exist)
            const { data: signData, error: signError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: profileData.full_name,
                        role: profileData.role || 'EMPLOYEE',
                        department: profileData.department
                    }
                }
            });

            if (signError) {
                if (signError.status === 429 || signError.message.toLowerCase().includes('rate limit')) {
                    // Provide the "Alias Fix" suggestion directly to the user
                    return { 
                        success: false, 
                        message: "Supabase Security Throttle active. Try using an email alias like: " + 
                                 email.replace('@', '+test@') + " or wait 10 mins." 
                    };
                }
                throw signError;
            }

            if (signData.user) {
                // Force link profile to public.users table immediately
                const { error: dbError } = await supabase.from('users').upsert([{
                    user_id: signData.user.id,
                    email,
                    full_name: profileData.full_name,
                    department: profileData.department,
                    role: profileData.role || 'EMPLOYEE',
                    last_login: new Date().toISOString()
                }], { onConflict: 'user_id' });

                if (dbError) throw dbError;
            }

            return { success: true };
        } catch (error) {
            console.error("[Auth] Unified Registration Failure:", error);
            return { success: false, message: error.message };
        }
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error("[Auth] Logout error during signOut:", err);
        } finally {
            // ALWAYS clear user state locally
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, login, logout, signUp, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
