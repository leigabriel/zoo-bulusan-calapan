import React from 'react';
import { Link } from 'react-router-dom';
import { ReactLenis } from 'lenis/react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AIFloatingButton from '../../components/common/AIFloatingButton';

const AboutUs = () => {
    const journalEntries = [
        {
            id: 1,
            title: "BULUSAN ECO-TRAIL",
            desc: "Discover the 1-hour immersive trek through century-old forests ending at the shores of Brgy. Parang.",
            image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09",
            grid: "col-span-12",
            aspect: "aspect-[4/5] md:aspect-[21/8]",
            isHero: true
        },
        {
            id: 2,
            title: "Native Species Care",
            desc: "Our mini zoo focuses on the rehabilitation of endemic wildlife from the Oriental Mindoro region.",
            image: "https://images.unsplash.com/photo-1631886131312-be57ef8311c0?q=80&w=685&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            grid: "col-span-12 md:col-span-4",
            aspect: "aspect-square"
        },
        {
            id: 3,
            title: "Calapan City Sanctuary",
            desc: "Located just 3km from the city market, providing a lush recreational haven for residents and tourists.",
            image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
            grid: "col-span-12 md:col-span-4",
            aspect: "aspect-square"
        },
        {
            id: 4,
            title: "Join Our Rangers",
            desc: "Help protect the biodiversity of MIMAROPA. We are looking for volunteers for our forest monitoring teams.",
            image: "https://images.unsplash.com/photo-1568437827868-bab780f2f54e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fHpvbyUyMHBhcmt8ZW58MHx8MHx8fDA%3D",
            grid: "col-span-12 md:col-span-4",
            aspect: "aspect-square"
        }
    ];

    return (
        <ReactLenis root>
            <div className="min-h-screen bg-[#ebebeb] text-[#212631] selection:bg-emerald-200 overflow-x-hidden flex flex-col">
                <Header />

                <main className="flex-grow pt-24 md:pt-32">
                    <section className="container mx-auto px-4 md:px-8 max-w-8xl">
                        <div className="flex flex-col lg:flex-row justify-between items-start gap-8 md:gap-12 mt-8 md:mt-24">
                            <div className="w-full lg:w-2/3">
                                <p className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-emerald-600 uppercase mb-4 md:mb-6 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    Preserving Calapan's Green Heart
                                </p>
                                <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-slate-900 leading-[0.9] mb-8 md:mb-12" style={{
                                    fontFamily: '"Segoe Script", "cursive"'
                                }}>
                                    Bulusan <br />
                                    <span className="text-emerald-600">Nature Zoo</span>
                                </h1>
                                <p className="text-lg md:text-4xl text-slate-500 max-w-2xl font-normal leading-relaxed">
                                    A 32-acre sanctuary in Calapan City blending century-old rainforests with wildlife education and sustainable eco-tourism.
                                </p>
                            </div>

                            <div className="w-full lg:w-1/3 flex flex-row gap-8 md:gap-16 pt-8 border-t lg:border-t-0 border-slate-200 lg:pt-0">
                                <div className="border-l border-slate-300 pl-4 md:pl-8">
                                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 md:mb-3">Deflection</p>
                                    <p className="text-4xl md:text-7xl lg:text-8xl font-light text-slate-900 tracking-tighter">98%</p>
                                </div>
                                <div className="border-l border-slate-300 pl-4 md:pl-8">
                                    <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 md:mb-3">Species</p>
                                    <p className="text-4xl md:text-7xl lg:text-8xl font-light text-slate-900 tracking-tighter">10+</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 md:gap-16 mt-24 md:mt-48">
                            {[
                                { title: "Eco-Trail Access", desc: "Access the famous Bulusan Mountain Trail, a prime route for trekking and bird watching." },
                                { title: "Wildlife Rescue", desc: "Our facilities provide temporary shelter and care for displaced native animals in Oriental Mindoro." },
                                { title: "Recreation Area", desc: "Enjoy picnic grounds, camping sites, and wall-climbing facilities within the park's lush interior." }
                            ].map((feature, i) => (
                                <div key={i} className="group">
                                    <h3 className="text-xl md:text-6xl font-bold text-slate-900 mb-3 md:mb-4">{feature.title}</h3>
                                    <p className="text-slate-500 text-base md:text-2xl leading-relaxed font-light">
                                        {feature.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="mt-32 md:mt-64 border-t border-slate-100 pt-16 md:pt-24">
                        <div className="container mx-auto px-4 md:px-8 max-w-[1600px]">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-24 gap-4">
                                <h2 className="text-6xl md:text-8xl lg:text-[10rem] font-bold tracking-tighter leading-none"
                                style={{
                                    fontFamily: '"Segoe Script", "cursive"'
                                }}>Archive</h2>
                                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 md:mb-4">Calapan Chronicles / 2026</p>
                            </div>

                            <div className="grid grid-cols-12 gap-x-0 md:gap-x-8 gap-y-16 md:gap-y-32 mb-32">
                                {journalEntries.map((entry) => (
                                    <div key={entry.id} className={`${entry.grid} group`}>
                                        <div className={`relative overflow-hidden mb-6 md:mb-10 ${entry.aspect} bg-slate-100 rounded-sm`}>
                                            {entry.isHero && (
                                                <div className="absolute inset-0 flex items-center justify-center z-10 p-4">
                                                    <h2 className="text-white text-5xl sm:text-7xl md:text-[8vw] lg:text-[10vw] font-bold tracking-tighter uppercase leading-none text-center">
                                                        {entry.title}
                                                    </h2>
                                                </div>
                                            )}
                                            <img
                                                src={entry.image}
                                                alt={entry.title}
                                                className={`w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 ease-out ${entry.isHero ? 'brightness-50 md:brightness-75' : ''}`}
                                            />
                                        </div>
                                        <div className="max-w-2xl px-2">
                                            <h4 className="text-xl md:text-3xl font-bold mb-3 md:mb-4 tracking-tight uppercase md:normal-case">
                                                {entry.title} {!entry.isHero && `— ${entry.desc.split('.')[0]}`}
                                            </h4>
                                            <p className="text-slate-500 text-base md:text-lg font-light leading-relaxed mb-6">
                                                {entry.desc}
                                            </p>
                                            <div className="flex items-center gap-2 group-hover:gap-4 transition-all cursor-pointer">
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Explore Story</span>
                                                <div className="w-6 md:w-8 h-[1px] bg-slate-900"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </main>

                <Footer />
                <AIFloatingButton />
            </div>
        </ReactLenis>
    );
};

export default AboutUs;