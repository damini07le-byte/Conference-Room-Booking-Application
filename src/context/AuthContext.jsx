import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial session check (from localStorage)
    useEffect(() => {
        const storedUser = localStorage.getItem('pucho_session');
        if (storedUser) {
            try {
                const sessionUser = JSON.parse(storedUser);
                setUser(sessionUser);
            } catch (err) {
                console.error("[Auth] Session Corruption:", err);
                localStorage.removeItem('pucho_session');
            }
        }
        setLoading(false);
    }, []);

    // CUSTOM SIGNUP (No Supabase Auth)
    const signUp = async (email, password, profileData) => {
        try {
            // Check if user already exists
            const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('*') // Select all to see full ghost data
                .eq('email', email)
                .maybeSingle();

            if (existingUser) {
                console.log("⚠️ [Auth Debug] Conflict Found! Existing User Data:", JSON.stringify(existingUser, null, 2));
                return { success: false, message: "User already exists with this email." };
            }

            // Hash password securely
            const hashedPassword = bcrypt.hashSync(password, 10);
            
            // Create user record in DB
            const { error: insertError } = await supabase
                .from('users')
                .insert([{
                    email,
                    password: hashedPassword,
                    full_name: profileData.full_name,
                    role: profileData.role || 'EMPLOYEE',
                    department: profileData.department
                }]);

            if (insertError) throw insertError;

            // Success feedback (No need to select back, we have the user info)
            return { success: true, message: "Account created successfully! Please login." };
        } catch (error) {
            console.error("[Auth] Custom Signup Failure:", error.message);
            return { success: false, message: error.message };
        }
    };

    // CUSTOM LOGIN (No Supabase Auth)
    const login = async (email, password, requiredRole = null) => {
        try {
            // 🚀 Fast Fetch: Only select what's absolutely necessary
            const { data: userData, error: fetchError } = await supabase
                .from('users')
                .select('user_id, email, password, role, full_name, department')
                .eq('email', email.trim())
                .maybeSingle();

            if (fetchError || !userData) {
                return { success: false, message: "User doesn't exist." };
            }

            // 🚀 Async Verify: Use async comparison to keep UI responsive
            const isMatch = await bcrypt.compare(password, userData.password);
            if (!isMatch) {
                return { success: false, message: "Incorrect password." };
            }

            // Role Security Enforcement
            if (requiredRole && userData.role?.toUpperCase() !== requiredRole.toUpperCase()) {
                const roleLabel = requiredRole?.toUpperCase() === 'ADMIN' ? 'Administrator' : 'Employee';
                return { 
                    success: false, 
                    message: `Access denied. This account does not have ${roleLabel} privileges.` 
                };
            }

            // Prepare session data
            const sessionUser = { ...userData };
            delete sessionUser.password;
            
            localStorage.setItem('pucho_session', JSON.stringify(sessionUser));
            setUser(sessionUser);

            return { success: true, message: "Login successful!", user: sessionUser };
        } catch (error) {
            console.error("[Auth] Custom Login Failure:", error.message);
            return { success: false, message: error.message };
        }
    };

    // CUSTOM LOGOUT
    const logout = () => {
        localStorage.removeItem('pucho_session');
        setUser(null);
    };

    const value = {
        user,
        loading,
        signUp,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
