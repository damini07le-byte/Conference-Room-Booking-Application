import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/ui/Input';
import { Mail, Lock, User, Briefcase, Sparkles, ArrowRight, Moon } from 'lucide-react';
import logo from '../assets/pucho_logo_login.png';
import mascot1 from '../assets/mascot_1.png';
import mascot3 from '../assets/mascot_3.png';
import mascot4 from '../assets/mascot_4.png';
import mascot5 from '../assets/mascot_5.png';

const Mascot = ({ imageSrc, delay, x, y, size = "w-10 h-10 lg:w-14 lg:h-14", cursorColor = "text-blue-500", cursorRotation = "0deg" }) => {
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
                className={`absolute -bottom-2 -right-2 lg:-bottom-3 lg:-right-3 ${cursorColor} drop-shadow-md`}
                style={{ transform: `rotate(${cursorRotation})` }}
            >
                <svg className="w-4 h-4 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.5 3.5L10.5 20.5L13.5 13.5L20.5 10.5L3.5 3.5Z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                </svg>
            </div>
        </div>
    );
};

const Register = () => {
    const navigate = useNavigate();
    const { signUp } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        department: '',
        password: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        const result = await signUp(formData.email, formData.password, {
            full_name: formData.full_name,
            department: formData.department,
            role: formData.email.includes('admin') ? 'ADMIN' : 'EMPLOYEE'
        });

        if (result.success) {
            navigate('/login');
        } else {
            setError(result.message);
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-full bg-white relative flex items-center justify-center p-4 lg:p-6 overflow-hidden font-sans">
            {/* Full Screen Grid Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.4] pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)`,
                    backgroundSize: '30px 30px',
                }}>
            </div>

            {/* Ambient Gradients - Subtle */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-200/20 rounded-full blur-[100px] pointer-events-none -translate-x-1/4 -translate-y-1/4"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[100px] pointer-events-none translate-x-1/4 translate-y-1/4"></div>

            {/* Theme Toggle */}
            <div className="absolute top-4 right-4 z-20">
                <button className="p-2.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm border border-gray-100 text-gray-400">
                    <Moon size={18} />
                </button>
            </div>

            {/* Floating Mascots */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full font-sans">
                <div className="absolute top-[2%] lg:top-[18%] left-[1%] lg:left-[4%]">
                    <Mascot imageSrc={mascot1} delay={0} cursorColor="text-blue-500" cursorRotation="-15deg" />
                </div>
                <div className="absolute bottom-[2%] lg:bottom-[14%] left-[2%] lg:left-[7%]">
                    <Mascot imageSrc={mascot3} delay={0.8} cursorColor="text-orange-500" cursorRotation="-5deg" />
                </div>
                <div className="absolute top-[1.5%] lg:top-[15%] right-[2%] lg:right-[7%]">
                    <Mascot imageSrc={mascot5} delay={1.5} cursorColor="text-purple-500" cursorRotation="15deg" />
                </div>
                <div className="absolute bottom-[2%] lg:bottom-[15%] right-[1%] lg:right-[4%]">
                    <Mascot imageSrc={mascot4} delay={2.2} cursorColor="text-green-500" cursorRotation="20deg" />
                </div>
            </div>

            <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 relative z-10 items-center pb-8 pt-6 lg:py-0">
                {/* Left Side: Marketing Content */}
                <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 lg:pl-12 mb-2 lg:mb-0">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="Pucho.ai" className="h-10" />
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <div className="font-bold text-[#111834] text-base lg:text-lg">Conference Room Booking Application</div>
                            <div className="text-[10px] font-black text-purple-600 tracking-[0.2em] uppercase">JOIN THE REVOLUTION</div>
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-bold text-[#111834] leading-[0.95] tracking-tighter">
                            Book.<br />
                            <span className="text-[#4F27E9]">Collaborate.</span><br />
                            Succeed.
                        </h1>

                        <p className="text-gray-500 text-sm lg:text-base leading-relaxed max-w-md">
                            Create your digital ID to access the smarter way to manage workspaces and meetings.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center lg:justify-start gap-3 pt-1">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FAF9FE] border border-[#F0EDFF] rounded-full text-[10px] font-semibold text-[#4F27E9]">
                            <Sparkles size={12} fill="currentColor" />
                            Premium Access
                        </div>
                    </div>
                </div>

                {/* Right Side: Register Card */}
                <div className="flex justify-center lg:justify-end">
                    <div className="bg-white p-6 lg:p-10 rounded-[28px] lg:rounded-[32px] shadow-[0_32px_80px_-20px_rgba(0,0,0,0.08)] w-full max-w-[420px] border border-gray-50 relative overflow-hidden">
                        <div className="space-y-1 mb-6">
                            <h2 className="text-2xl lg:text-3xl font-bold text-[#111834]">Create Account</h2>
                            <p className="text-gray-400 text-sm lg:text-base font-medium">Sign up to start your journey.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 ml-1">Full Name</label>
                                <Input
                                    type="text"
                                    icon={User}
                                    placeholder="Jane Doe"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                    required
                                    className="h-[48px]"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 ml-1">Email Address</label>
                                <Input
                                    type="email"
                                    icon={Mail}
                                    placeholder="jane@company.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    required
                                    className="h-[48px]"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 ml-1">Department</label>
                                <Input
                                    type="text"
                                    icon={Briefcase}
                                    placeholder="Engineering"
                                    value={formData.department}
                                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                                    required
                                    className="h-[48px]"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 ml-1">Password</label>
                                <Input
                                    type="password"
                                    icon={Lock}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    required
                                    className="h-[48px]"
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded-xl bg-red-50 text-red-600 text-xs font-medium border border-red-100 animate-shake">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className={`
                                    w-full h-[52px] flex items-center justify-center gap-2 rounded-[14px]
                                    transition-all duration-300 transform active:scale-[0.98]
                                    font-bold text-[16px] text-white shadow-xl
                                    disabled:opacity-70 disabled:cursor-not-allowed
                                `}
                                style={{
                                    background: 'linear-gradient(180deg, #4F27E9 0%, #2A09B5 100%)',
                                    boxShadow: '0 8px 20px -5px rgba(79, 39, 233, 0.4)'
                                }}
                            >
                                {loading ? 'Creating Account...' : 'Sign Up Now'}
                                {!loading && <ArrowRight className="w-5 h-5" strokeWidth={3} />}
                            </button>
                        </form>

                        <div className="mt-8 text-center text-sm">
                            <p className="text-gray-500 font-medium">
                                Already have an account? <Link to="/login" className="text-[#4F27E9] font-bold hover:underline">Log in</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
