import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Dashboard from "./pages/Dashboard";
import Bookings from "./pages/Bookings";
import Rooms from "./pages/Rooms";
import Users from "./pages/Users";
import Notifications from "./pages/Notifications";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";

// GUARD: Protects routes from unauthenticated users
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="h-screen w-full flex items-center justify-center bg-gray-50 text-pucho-purple animate-pulse">Loading Pucho OS...</div>;
    if (!user) return <Navigate to="/login" replace />;
    return children;
};

function App() {
    return (
        <BrowserRouter>
            <ToastProvider>
                <AuthProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* App Area */}
                        <Route path="/admin" element={
                            <ProtectedRoute>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }>
                            <Route index element={<Dashboard />} />
                            <Route path="bookings" element={<Bookings />} />
                            <Route path="rooms" element={<Rooms />} />
                            <Route path="users" element={<Users />} />
                            <Route path="notifications" element={<Notifications />} />
                        </Route>

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/admin" replace />} />
                    </Routes>
                </AuthProvider>
            </ToastProvider>
        </BrowserRouter>
    );
}

export default App;
