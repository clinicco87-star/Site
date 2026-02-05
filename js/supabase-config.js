// Supabase Configuration - FIXED VERSION
// IMPORTANT: Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://ezbcxhuzisiavlkpzocl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6YmN4aHV6aXNpYXZsa3B6b2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNDAxNTUsImV4cCI6MjA4NTYxNjE1NX0.INNe6q8lF-dYmfDBlamd0bqv7T2T0gCALklU0Oe3oIs';

// Create Supabase client ONCE
let supabaseClient;

// Initialize Supabase only if not already initialized
function initSupabase() {
    if (!supabaseClient && window.supabase && window.supabase.createClient) {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Make it globally available
        window.supabaseClient = supabaseClient;
        console.log('✅ Supabase initialized successfully');
    } else if (window.supabaseClient) {
        supabaseClient = window.supabaseClient;
        console.log('✅ Using existing Supabase client');
    } else {
        console.error('❌ Failed to initialize Supabase');
        return null;
    }
    
    return supabaseClient;
}

// Authentication Functions
const supabaseFunctions = {
    // Initialize Supabase
    init: function() {
        return initSupabase();
    },
    
    // Check if user is authenticated
    checkAuth: async function() {
        try {
            const client = this.init();
            if (!client) throw new Error('Supabase not initialized');
            
            const { data: { session } } = await client.auth.getSession();
            return session;
        } catch (error) {
            console.error('Auth check error:', error);
            return null;
        }
    },
    
    // Sign in with email and password
    signIn: async function(email, password) {
        try {
            const client = this.init();
            if (!client) throw new Error('Supabase not initialized');
            
            const { data, error } = await client.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    },
    
    // Send OTP to email
    sendOTP: async function(email) {
        try {
            const client = this.init();
            if (!client) throw new Error('Supabase not initialized');
            
            const { data, error } = await client.auth.signInWithOtp({
                email: email,
                options: {
                    shouldCreateUser: false,
                    emailRedirectTo: window.location.origin
                }
            });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Send OTP error:', error);
            throw error;
        }
    },
    
    // Verify OTP
    verifyOTP: async function(email, token) {
        try {
            const client = this.init();
            if (!client) throw new Error('Supabase not initialized');
            
            const { data, error } = await client.auth.verifyOtp({
                email: email,
                token: token,
                type: 'email'
            });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Verify OTP error:', error);
            throw error;
        }
    },
    
    // Sign out
    signOut: async function() {
        try {
            const client = this.init();
            if (!client) throw new Error('Supabase not initialized');
            
            const { error } = await client.auth.signOut();
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    },
    
    // Forgot password
    resetPassword: async function(email) {
        try {
            const client = this.init();
            if (!client) throw new Error('Supabase not initialized');
            
            const { error } = await client.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Reset password error:', error);
            throw error;
        }
    },
    
    // Update password
    updatePassword: async function(newPassword) {
        try {
            const client = this.init();
            if (!client) throw new Error('Supabase not initialized');
            
            const { data, error } = await client.auth.updateUser({
                password: newPassword
            });
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Update password error:', error);
            throw error;
        }
    },
    
    // Get current user
    getCurrentUser: async function() {
        try {
            const client = this.init();
            if (!client) throw new Error('Supabase not initialized');
            
            return await client.auth.getUser();
        } catch (error) {
            console.error('Get user error:', error);
            throw error;
        }
    },
    
    // Get Supabase client directly
    getClient: function() {
        return this.init();
    }
};

// Make functions globally available
window.supabaseFunctions = supabaseFunctions;

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', function() {
    supabaseFunctions.init();
    console.log('📦 Supabase functions ready');
});