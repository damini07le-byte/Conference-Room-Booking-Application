import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { User, Lock, ArrowRight, Moon, Sparkles, Circle } from 'lucide-react';
import mascot1 from '../assets/mascot_1.png';
import mascot3 from '../assets/mascot_3.png';
import mascot4 from '../assets/mascot_4.png';
import mascot5 from '../assets/mascot_5.png';


// Floating Mascot Component (Individual Images)
// Floating Mascot Component (Individual Images)
// Floating Mascot Component (Individual Images) with Gaze Tracking
const Mascot = ({ imageSrc, delay, x, y, size = "w-14 h-14", cursorColor = "text-blue-500", cursorRotation = "0deg" }) => {
    return (
        <div
            className={`absolute ${x} ${y} z-20 animate-float transition-all duration-300 hover:scale-110 hover:rotate-6 cursor-pointer pointer-events-auto`}
            style={{
                animationDelay: `${delay}s`
            }}
        >
            <div className={`${size} rounded-full overflow-hidden shadow-lg relative bg-white/50 backdrop-blur-sm border border-white/40`}>
                <img
                    src={imageSrc}
                    alt="User"
                    className="w-full h-full object-cover"
                />
            </div>
            <div
                className={`absolute -bottom-3 -right-3 ${cursorColor} drop-shadow-md`}
                style={{ transform: `rotate(${cursorRotation})` }}
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.5 3.5L10.5 20.5L13.5 13.5L20.5 10.5L3.5 3.5Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                </svg>
            </div>
        </div>
    );
};

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    React.useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const result = await login(email, password);

        if (result.success) {
            navigate('/admin');
        } else {
            setError(result.message || 'Login failed');
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-full bg-white relative flex items-center justify-center p-4 lg:p-8 overflow-hidden font-sans">
            {/* Full Screen Grid Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.4] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)`,
                    backgroundSize: '30px 30px',
                }}>
            </div>

            {/* Ambient Gradients - Subtle */}
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-purple-200/20 rounded-full blur-[100px] pointer-events-none -translate-x-1/4 -translate-y-1/4"></div>
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-200/20 rounded-full blur-[100px] pointer-events-none translate-x-1/4 translate-y-1/4"></div>

            {/* Theme Toggle (Optional as per image) */}
            <div className="absolute top-6 right-6 z-20">
                <button className="p-2.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-100 text-gray-400">
                    <Moon size={18} />
                </button>
            </div>

            {/* Floating Mascots - Individual Images (Matched to Reference) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full">
                {/* Top Left (near logo) */}
                <div className="absolute top-[21%] left-[4.5%]">
                    <Mascot
                        imageSrc={mascot1}
                        x="" y=""
                        delay={0}
                        cursorColor="text-blue-500"
                        cursorRotation="-15deg"
                    />
                </div>

                {/* Bottom Left */}
                <div className="absolute bottom-[16%] left-[8%]">
                    <Mascot
                        imageSrc={mascot3}
                        x="" y=""
                        delay={0.8}
                        cursorColor="text-orange-500"
                        cursorRotation="-5deg"
                    />
                </div>

                {/* Top Right (near card) */}
                <div className="absolute top-[18%] right-[8%]">
                    <Mascot
                        imageSrc={mascot5}
                        x="" y=""
                        delay={1.5}
                        cursorColor="text-purple-500"
                        cursorRotation="15deg"
                    />
                </div>

                {/* Bottom Right */}
                <div className="absolute bottom-[17%] right-[4.5%]">
                    <Mascot
                        imageSrc={mascot4}
                        x="" y=""
                        delay={2.2}
                        cursorColor="text-green-500"
                        cursorRotation="20deg"
                    />
                </div>
            </div>

            <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-24 relative z-10 items-center">

                {/* Left Side: Marketing Content */}
                <div className="text-left space-y-8 lg:pl-16">
                    {/* Logo Section */}
                    <div className="flex items-center gap-3">
                        <img src="/src/assets/pucho_logo_login.png" alt="Pucho.ai" className="h-11" />
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-1">
                            <div className="font-bold text-[#111834] text-lg">Conference Room Booking Application</div>
                            <div className="text-[10px] font-black text-purple-600 tracking-[0.2em] uppercase">POWERED BY AI AGENTS</div>
                        </div>

                        <h1 className="text-7xl font-bold text-[#111834] leading-[0.95] tracking-tighter">
                            Build.<br />
                            <span className="text-[#8b5cf6]">Automate.</span><br />
                            Scale.
                        </h1>

                        <p className="text-gray-500 text-base leading-relaxed max-w-md">
                            From data to working intelligence. Access your command center to manage automated customer communication flows.
                        </p>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-4 pt-2">
                        <div className="flex items-center gap-2 px-4 py-2 bg-[#FAF9FE] border border-[#F0EDFF] rounded-full text-xs font-semibold text-[#6B46C1]">
                            <Sparkles size={14} fill="currentColor" />
                            AI Powered
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-[#F0FFF4] border border-[#C6F6D5] rounded-full text-xs font-semibold text-[#2F855A]">
                            <div className="w-2 h-2 bg-[#48BB78] rounded-full animate-pulse"></div>
                            System Live
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Card */}
                <div className="flex justify-center lg:justify-end">
                    <div className="bg-white p-8 md:p-10 rounded-[32px] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.08)] w-full max-w-[440px] border border-gray-50 relative overflow-hidden">

                        <div className="space-y-2 mb-8">
                            <h2 className="text-3xl font-bold text-[#111834]">Welcome Back</h2>
                            <p className="text-gray-400 text-base">Log in to manage your automated flows.</p>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-500 ml-1">Username</label>
                                <Input
                                    type="text"
                                    icon={User}
                                    placeholder="admin_pucho"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="!gap-0"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-500 ml-1">Password</label>
                                <Input
                                    type="password"
                                    icon={Lock}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="!gap-0"
                                />
                            </div>

                            {error && (
                                <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className={`
                                    w-full h-[56px] flex items-center justify-center gap-2 rounded-[16px]
                                    transition-all duration-300 transform active:scale-[0.98]
                                    font-bold text-[18px] text-white shadow-xl
                                    disabled:opacity-70 disabled:cursor-not-allowed
                                `}
                                style={{
                                    background: 'linear-gradient(180deg, #4F27E9 0%, #2A09B5 100%)',
                                    boxShadow: '0 10px 25px -5px rgba(79, 39, 233, 0.4)'
                                }}
                            >
                                {loading ? 'Logging in...' : 'Log In Now'}
                                {!loading && <ArrowRight className="w-5 h-5" strokeWidth={3} />}
                            </button>
                        </form>

                        <div className="mt-10 text-center">
                            <p className="text-gray-500 font-medium">
                                Don't have an account? <Link to="/register" className="text-[#4F27E9] font-bold hover:underline">Sign up</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
