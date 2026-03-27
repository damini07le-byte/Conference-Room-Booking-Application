import React, { useState, useEffect } from 'react';
import { Rocket, CheckCircle, Clock, Shield, Database, Github, Terminal, ArrowRight, RefreshCw, Zap } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Deploy = () => {
    const { showToast } = useToast();
    const [isDeploying, setIsDeploying] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleTriggerDeploy = () => {
        setIsDeploying(true);
        setProgress(0);
        showToast("Initiating production environment deployment...", "info");
        
        let interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsDeploying(false);
                    showToast("Deployment successful! System synchronized with main branch.", "success");
                    return 100;
                }
                return prev + 5;
            });
        }, 150);
    };

    const statusItems = [
        { label: 'Supabase DB', status: 'Online', icon: Database, color: 'text-emerald-500' },
        { label: 'Main Branch', status: 'v2.4.0', icon: Github, color: 'text-indigo-500' },
        { label: 'SSL Protocol', status: 'Active', icon: Shield, color: 'text-[#4F27E9]' },
    ];

    const logs = [
        "[09:42:15] Build environment initialized successfully.",
        "[09:42:18] Dependencies verified and cached.",
        "[09:42:25] Pucho OS aesthetic assets compiled.",
        "[09:43:01] Production bundle size optimized (1.2MB).",
        "[09:43:05] Hot-swapping environment variables.",
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-fade-in text-[#111834] pb-20 px-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white/40 backdrop-blur-xl p-10 rounded-[40px] border border-white/40 shadow-premium">
                <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-white shadow-xl transition-all duration-500 ${isDeploying ? 'bg-orange-500 animate-pulse' : 'bg-[#4F27E9] shadow-indigo-100'}`}>
                        <Rocket className={`w-8 h-8 ${isDeploying ? 'animate-bounce' : ''}`} />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black tracking-tight leading-none">CD/CI Ops</h1>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest">Stable</span>
                        </div>
                        <p className="text-sm font-medium text-gray-500">Monitor system integrity and trigger production handshakes.</p>
                    </div>
                </div>
                <button 
                    onClick={handleTriggerDeploy}
                    disabled={isDeploying}
                    className="group flex items-center gap-3 bg-gray-900 text-white hover:bg-black h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isDeploying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-orange-400 group-hover:scale-125 transition-all" />}
                    {isDeploying ? 'Syncing...' : 'Trigger Deploy'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Deployment Status Cards */}
                {statusItems.map((item, index) => (
                    <div key={index} className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-premium flex items-center justify-between transition-all hover:scale-[1.02]">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center ${item.color}`}>
                                <item.icon size={22} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                                <p className="text-lg font-black text-[#111834]">{item.status}</p>
                            </div>
                        </div>
                        <CheckCircle className="text-emerald-500" size={20} />
                    </div>
                ))}

                {/* Main Deployment Matrix */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-[#111834] rounded-[48px] p-10 shadow-3xl overflow-hidden relative border border-white/5">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                                    <h2 className="text-white text-xl font-black tracking-tight">Active Matrix Console</h2>
                                </div>
                                <span className="text-white/40 text-[10px] font-black uppercase tracking-widest">Protocol 12.0</span>
                            </div>

                            {isDeploying ? (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end">
                                        <p className="text-white/60 font-bold text-sm">Deployment Progress</p>
                                        <p className="text-white text-2xl font-black">{progress}%</p>
                                    </div>
                                    <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                                        <div 
                                            className="h-full bg-gradient-to-r from-[#4F27E9] to-indigo-400 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(79,39,233,0.5)]" 
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-white/40 font-mono text-xs">Ready for next deployment instruction...</p>
                                    <div className="flex items-center gap-6">
                                        <div className="flex-1 h-[1px] bg-white/5"></div>
                                        <Rocket className="text-white/10 w-12 h-12" />
                                        <div className="flex-1 h-[1px] bg-white/5"></div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-10 p-6 bg-black/40 rounded-3xl border border-white/5 font-mono text-[11px] text-white/50 space-y-2">
                                {logs.map((log, i) => (
                                    <p key={i} className="hover:text-indigo-400 transition-colors cursor-default select-none">{log}</p>
                                ))}
                                {isDeploying && <p className="animate-pulse text-[#4F27E9]">[SYNCING] Synchronizing production nodes...</p>}
                            </div>
                        </div>
                        {/* Decorative background element */}
                        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[#4F27E9] opacity-10 blur-[100px] rounded-full"></div>
                    </div>
                </div>

                {/* Right Column: Insights */}
                <div className="space-y-8">
                    <div className="bg-emerald-500 rounded-[48px] p-8 text-white relative overflow-hidden group">
                        <div className="relative z-10 flex flex-col h-full justify-between gap-10">
                            <div>
                                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Infrastructure Health</p>
                                <h3 className="text-4xl font-black">99.9%</h3>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold leading-relaxed">System is performing optimally. Global latency in normal range <span className="opacity-60">(12ms)</span>.</p>
                                <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:translate-x-2 transition-transform mt-4">
                                    View Analytics <ArrowRight size={12} />
                                </button>
                            </div>
                        </div>
                        <Zap className="absolute top-8 right-8 text-white/10 w-32 h-32 group-hover:scale-125 transition-transform" />
                    </div>

                    <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-premium">
                        <div className="flex items-center gap-3 mb-6">
                            <Terminal size={18} className="text-gray-400" />
                            <h4 className="font-bold text-gray-900">Version History</h4>
                        </div>
                        <div className="space-y-6">
                            {[
                                { v: '2.4.0', type: 'Design Overhaul', date: 'Mar 24' },
                                { v: '2.3.1', type: 'Supabase Patch', date: 'Mar 22' },
                                { v: '2.2.0', type: 'Calendar Sync', date: 'Mar 15' },
                            ].map((v, i) => (
                                <div key={i} className="flex items-center justify-between group cursor-pointer">
                                    <div>
                                        <p className="text-[11px] font-black text-[#4F27E9]">v{v.v}</p>
                                        <p className="text-xs font-bold text-gray-500">{v.type}</p>
                                    </div>
                                    <p className="text-[9px] font-black text-gray-300 group-hover:text-gray-900 transition-colors uppercase">{v.date}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Deploy;
