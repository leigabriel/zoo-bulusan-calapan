import React from 'react';
import { Link } from 'react-router-dom';
import { ReactLenis } from 'lenis/react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AIFloatingButton from '../../components/common/AIFloatingButton';

const AboutUs = () => {
    return (
        <ReactLenis root>
            <div className="min-h-screen bg-bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 text-slate-900 selection:bg-emerald-200">
                <Header />

                <main className="container mx-auto px-4 md:px-8 max-w-7xl pt-32">
                    <section className="flex flex-col lg:flex-row justify-between items-start gap-12 mt-12 md:mt-24">
                        <div className="w-full lg:w-2/3">
                            <p className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-emerald-600 uppercase mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                                The Evolution of Conservation
                            </p>
                            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-slate-900 leading-[0.9] mb-12">
                                Bulusan <br />
                                <span className="text-emerald-600">Park Zoo</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-slate-500 max-w-2xl font-normal leading-relaxed">
                                Redefining the sanctuary experience by blending natural habitats with cutting-edge AI to ensure the highest standards of wildlife welfare and visitor education.
                            </p>
                        </div>

                        <div className="w-full lg:w-1/3 flex flex-row lg:flex-row gap-8 md:gap-16 pt-4 border-t lg:border-t-0 border-slate-200 lg:pt-0">
                            <div className="border-l border-slate-300 pl-6 md:pl-8">
                                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Deflection Rate</p>
                                <p className="text-5xl md:text-7xl lg:text-8xl font-light text-slate-900 tracking-tighter">98%</p>
                            </div>
                            <div className="border-l border-slate-300 pl-6 md:pl-8">
                                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">Species</p>
                                <p className="text-5xl md:text-7xl lg:text-8xl font-light text-slate-900 tracking-tighter">99</p>
                            </div>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 md:gap-16 mt-32 md:mt-48">
                        <div className="group">
                            <div className="w-12 h-12 mb-8 text-slate-900 group-hover:text-emerald-600 transition-colors">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M12 3v18M3 12h18" strokeLinecap="round" />
                                    <path d="M5 5l14 14M19 5L5 19" strokeLinecap="round" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Precision Habitats</h3>
                            <p className="text-slate-500 text-lg leading-relaxed font-light">
                                Fine-tune every nuance of enclosure climate, humidity, and terrain to match the exact biological needs of our residents.
                            </p>
                        </div>
                        <div className="group">
                            <div className="w-12 h-12 mb-8 text-slate-900 group-hover:text-emerald-600 transition-colors">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-1.5M12 4h-8a2 2 0 00-2 2v14a2 2 0 00 2 2h14a2 2 0 00 2-2v-8" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Auto Vital Logging</h3>
                            <p className="text-slate-500 text-lg leading-relaxed font-light">
                                Get comprehensive health reports started with just a single interaction transcript from our AI health sensors.
                            </p>
                        </div>
                        <div className="group md:col-span-2 lg:col-span-1">
                            <div className="w-12 h-12 mb-8 text-slate-900 group-hover:text-emerald-600 transition-colors">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 8v4l3 3" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Built-in Bio-Copilot</h3>
                            <p className="text-slate-500 text-lg leading-relaxed font-light">
                                Our AI system helps zookeepers build the ideal support environment for endangered species in real-time.
                            </p>
                        </div>
                    </section>

                    <section className="mt-32 md:mt-48 mb-12 rounded-[2rem] md:rounded-[3rem] overflow-hidden bg-slate-950 text-white shadow-3xl flex flex-col lg:flex-row min-h-[600px] border border-white/5">
                        <aside className="w-full lg:w-[420px] p-8 md:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/5 bg-slate-950/50 backdrop-blur-xl">
                            <div>
                                <div className="flex items-center gap-4 mb-10 md:mb-12">
                                    <div className="grid grid-cols-2 gap-1 w-6 h-6">
                                        <div className="bg-emerald-400 rounded-sm"></div>
                                        <div className="bg-pink-500 rounded-sm"></div>
                                        <div className="bg-indigo-500 rounded-sm"></div>
                                        <div className="bg-amber-400 rounded-sm"></div>
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-bold tracking-tight">Eco Canvas</h2>
                                </div>
                                <p className="text-slate-400 text-base md:text-lg leading-relaxed mb-10 max-w-xs font-light">
                                    The fastest way to build, govern, and scale enterprise-grade wildlife conservation protocols.
                                </p>
                                <Link
                                    to="/tickets"
                                    className="inline-block bg-white/5 hover:bg-white/10 transition-all border border-white/10 px-8 py-3 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest mb-16 md:mb-20"
                                >
                                    Explore Eco Canvas
                                </Link>

                                <nav className="space-y-8 md:space-y-10 hidden sm:block">
                                    <div className="group cursor-pointer">
                                        <p className="text-sm font-medium text-slate-500 group-hover:text-white transition-colors">Register Species</p>
                                    </div>
                                    <div className="group cursor-pointer">
                                        <p className="text-sm font-medium text-slate-500 group-hover:text-white transition-colors">Define Bio-Policies</p>
                                    </div>
                                    <div className="relative pt-2">
                                        <div className="absolute left-0 top-0 h-0.5 w-16 bg-white"></div>
                                        <p className="text-sm md:text-base font-bold text-white mb-4 mt-6">Test and launch</p>
                                        <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-[280px] font-light">
                                            Validate enclosure performance with AI-driven simulations built from real-world behavior data.
                                        </p>
                                    </div>
                                    <div className="group cursor-pointer">
                                        <p className="text-sm font-medium text-slate-500 group-hover:text-white transition-colors">Monitor Wellness</p>
                                    </div>
                                </nav>
                            </div>
                        </aside>

                        <div className="flex-grow relative p-4 md:p-6 bg-slate-900 overflow-hidden min-h-[500px] lg:min-h-full">
                            <div className="absolute inset-0 grayscale opacity-40 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1550358864-518f202c02ba)' }}></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>

                            <div className="relative h-full flex items-center justify-center">
                                <div className="w-full max-w-2xl bg-slate-900/90 backdrop-blur-2xl rounded-2xl border border-white/10 p-6 md:p-10 shadow-4xl transform lg:translate-x-10">
                                    <div className="flex justify-between items-center mb-8 md:mb-10 border-b border-white/5 pb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-400 to-rose-500"></div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bulusan AI Monitor</span>
                                        </div>
                                        <div className="flex gap-4">
                                            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline-block uppercase tracking-wider">Status: Optimal</span>
                                            <span className="text-[10px] text-emerald-400 font-mono">LIVE</span>
                                        </div>
                                    </div>

                                    <h4 className="text-xl md:text-2xl font-medium mb-8 md:mb-10 tracking-tight">Health Diagnostics</h4>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-10 md:mb-12">
                                        <div className="bg-white/[0.03] p-5 md:p-6 rounded-xl border border-white/5">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-bold">Wellness</p>
                                            <p className="text-4xl md:text-5xl font-light tracking-tighter text-emerald-400">90%</p>
                                        </div>
                                        <div className="bg-white/[0.03] p-5 md:p-6 rounded-xl border border-white/5">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-bold">Targets</p>
                                            <p className="text-4xl md:text-5xl font-light tracking-tighter">1,000</p>
                                        </div>
                                        <div className="bg-white/[0.03] p-5 md:p-6 rounded-xl border border-white/5">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-bold">Anomalies</p>
                                            <p className="text-4xl md:text-5xl font-light tracking-tighter">0</p>
                                        </div>
                                    </div>

                                    <div className="space-y-1 overflow-x-auto">
                                        <div className="min-w-[400px]">
                                            <div className="grid grid-cols-3 px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                                                <span>Bio-Metric</span>
                                                <span>Status</span>
                                                <span className="text-right">Confidence</span>
                                            </div>
                                            <div className="grid grid-cols-3 px-6 py-5 items-center hover:bg-white/[0.02] transition-colors rounded-lg">
                                                <span className="text-sm font-medium text-slate-200">Movement Map</span>
                                                <span className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Optimal
                                                </span>
                                                <span className="text-right text-sm font-mono">100%</span>
                                            </div>
                                            <div className="grid grid-cols-3 px-6 py-5 items-center border-t border-white/5 hover:bg-white/[0.02] transition-colors rounded-lg">
                                                <span className="text-sm font-medium text-slate-200">Consumption</span>
                                                <span className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Optimal
                                                </span>
                                                <span className="text-right text-sm font-mono">100%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mt-32 md:mt-48 mb-32 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-slate-900 rounded-[2.5rem] md:rounded-[4rem]"></div>
                        <div className="absolute top-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-emerald-500/10 blur-[80px] md:blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3"></div>
                        <div className="relative z-10 p-12 md:p-32 flex flex-col items-center text-center">
                            <h3 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-8 tracking-tighter">
                                Join Our <br />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200">Conservation Mission</span>
                            </h3>
                            <p className="text-lg md:text-2xl text-slate-400 mb-12 max-w-3xl font-light leading-relaxed">
                                Experience the intersection of nature and technology. Your support fuels our ongoing efforts to protect endangered species and restore natural balance.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto">
                                <Link
                                    to="/tickets"
                                    className="px-12 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-full font-bold text-base transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)] text-center"
                                >
                                    Book Your Experience
                                </Link>
                                <Link
                                    to="/events"
                                    className="px-12 py-5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-full font-bold text-base transition-all text-center"
                                >
                                    Support Our Work
                                </Link>
                            </div>
                        </div>
                    </section>
                </main>

                <div className="mt-20">
                    <Footer />
                </div>
                <AIFloatingButton />
            </div>
        </ReactLenis>
    );
};

export default AboutUs;