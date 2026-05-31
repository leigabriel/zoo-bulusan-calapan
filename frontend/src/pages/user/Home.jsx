import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { ReactLenis } from 'lenis/react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Draggable } from 'gsap/Draggable';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import '../../App.css';

gsap.registerPlugin(ScrollTrigger, Draggable);

const ticketMaskStyle = {
    WebkitMaskImage: 'radial-gradient(circle at 0px 50%, transparent 4px, black 4.5px), radial-gradient(circle at 100% 50%, transparent 4px, black 4.5px)',
    WebkitMaskSize: '51% 12px',
    WebkitMaskRepeat: 'repeat-y',
    WebkitMaskPosition: 'left, right',
    maskImage: 'radial-gradient(circle at 0px 50%, transparent 4px, black 4.5px), radial-gradient(circle at 100% 50%, transparent 4px, black 4.5px)',
    maskSize: '51% 12px',
    maskRepeat: 'repeat-y',
    maskPosition: 'left, right',
};

const HeroSection = () => {
    const navigate = useNavigate();
    const containerRef = useRef(null);

    useLayoutEffect(() => {
        document.body.style.overflow = 'auto';

        const headerEl = document.querySelector('header');
        if (headerEl) {
            gsap.set(headerEl, { opacity: 1, pointerEvents: 'auto' });
        }

        const ctx = gsap.context(() => {
            const tl = gsap.timeline();

            tl.fromTo('.hero-drag-item',
                { opacity: 0, scale: 0.5, y: 50 },
                { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: 'back.out(1.5)', stagger: 0.15 }, 0
            )
                .fromTo('.hero-title',
                    { opacity: 0, y: 50, skewY: 5 },
                    { opacity: 1, y: 0, skewY: 0, duration: 1.2, ease: 'expo.out' }, 0.2
                )
                .fromTo('.hero-line',
                    { clipPath: 'inset(100% 0% 0% 0%)', y: 50 },
                    { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.5, ease: 'expo.out', stagger: 0.15 }, 0.3
                )
                .fromTo('.hero-btn',
                    { opacity: 0, scale: 0.9, y: 30 },
                    { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: 'elastic.out(1, 0.5)' }, 0.7
                )
                .fromTo('.scroll-hint',
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, 0.9
                );

            gsap.to('.hero-bg-parallax', {
                yPercent: 40,
                scale: 1.1,
                ease: 'none',
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true,
                }
            });

            gsap.to('.hero-content, .hero-images', {
                yPercent: 40,
                opacity: 0,
                ease: 'none',
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true,
                }
            });

            Draggable.create('.hero-drag-item', {
                type: 'x,y',
                bounds: containerRef.current,
                edgeResistance: 0.8,
                onDragStart: function () {
                    gsap.to(this.target, { scale: 1.15, duration: 0.3, ease: 'power2.out', zIndex: 50 });
                },
                onDragEnd: function () {
                    gsap.to(this.target, { x: 0, y: 0, scale: 1, zIndex: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
                }
            });

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="relative w-full min-h-screen overflow-hidden bg-white">
            <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden">
                <div className="hero-bg-parallax absolute inset-0 bg-white -z-10 origin-bottom" />

                <div className="hero-images absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
                    <img
                        src="/pixels/rabbit.png"
                        alt="Rabbit"
                        className="hero-drag-item absolute w-24 md:w-36 lg:w-56 left-[10%] md:left-[15%] top-[70%] md:top-[40%] -rotate-12 pointer-events-auto cursor-grab active:cursor-grabbing"
                    />
                    <img
                        src="/pixels/buffalo.png"
                        alt="Buffalo"
                        className="hero-drag-item absolute w-24 md:w-36 lg:w-56 left-[calc(50%-3.5rem)] md:left-[calc(50%-5.5rem)] lg:left-[calc(50%-7rem)] top-[25%] md:top-[12%] pointer-events-auto cursor-grab active:cursor-grabbing"
                    />
                    <img
                        src="/pixels/turtle.png"
                        alt="Turtle"
                        className="hero-drag-item absolute w-24 md:w-36 lg:w-56 right-[10%] md:right-[15%] top-[70%] md:top-[40%] rotate-12 pointer-events-auto cursor-grab active:cursor-grabbing"
                    />
                </div>

                <div className="hero-content text-center flex flex-col items-center z-10 px-5 pointer-events-none">
                    <h2 className="hero-title opacity-0 font-['Mistral',_cursive] text-[clamp(2.5rem,5vw,5rem)] text-black -mb-2">
                        welcome to
                    </h2>
                    <div className="text-[clamp(3rem,8vw,6rem)] font-semibold text-black leading-none tracking-tight mb-[30px] overflow-hidden py-4">
                        {['BULUSAN ZOO', 'NATURE PARK'].map((line, i) => (
                            <span key={i} className="block overflow-hidden">
                                <span className="hero-line block" style={{ clipPath: 'inset(100% 0% 0% 0%)' }}>{line}</span>
                            </span>
                        ))}
                    </div>
                    <button
                        onClick={() => navigate('/reservations')}
                        className="hero-btn pointer-events-auto opacity-0 bg-[#5dcd5a] text-white py-2.5 px-10 rounded-xl cursor-pointer transition-transform duration-500 ease-out hover:scale-105 active:scale-95 flex items-center justify-center focus:outline-none"
                        style={ticketMaskStyle}
                    >
                        <span className="font-['Mistral',_cursive] text-[2rem] tracking-[1px] block mt-1">
                            Reserved
                        </span>
                    </button>
                </div>

                <div className="scroll-hint opacity-0 absolute bottom-[30px] flex flex-col items-center text-black text-[0.9rem] z-10">
                    <p className="m-0 mb-1 font-medium">scroll to explore</p>
                    <span className="text-[1.2rem]">↓</span>
                </div>
            </section>
        </div>
    );
};

const AboutSection = () => {
    const sectionRef = useRef(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="relative w-full h-[100dvh] md:h-screen bg-white overflow-hidden pointer-events-none">
            <style>{`
                .abs { position: absolute; }
                .txt { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; white-space: nowrap; color: #000; z-index: 20; line-height: 1; }
                .txt-serif { font-family: 'Times New Roman', Times, Baskerville, Georgia, serif; }
                .txt-italic { font-style: italic; }
                .grad-rainbow { background: linear-gradient(90deg, #32cd32, #ff8c00, #1e90ff); }
                .grad-red-blur { background: radial-gradient(circle, rgba(255,69,0,0.85) 0%, rgba(255,69,0,0) 65%); filter: blur(8px); }
                .grad-green-fade { background: linear-gradient(90deg, #32cd32, rgba(255,255,255,0)); }
                .pattern-checkered {
                    background-image: 
                        repeating-linear-gradient(45deg, #ddd 25%, transparent 25%, transparent 75%, #ddd 75%, #ddd),
                        repeating-linear-gradient(45deg, #ddd 25%, #fff 25%, #fff 75%, #ddd 75%, #ddd);
                    background-position: 0 0, 4px 4px;
                    background-size: 8px 8px;
                }
                
                @keyframes float { 0%, 100% { translate: 0 0; } 50% { translate: 0 -15px; } }
                @keyframes float-reverse { 0%, 100% { translate: 0 0; } 50% { translate: 0 15px; } }
                @keyframes spin { from { rotate: 0deg; } to { rotate: 360deg; } }
                @keyframes spin-fast { from { rotate: 0deg; } to { rotate: -360deg; } }
                @keyframes wiggle { 0%, 100% { rotate: -3deg; } 50% { rotate: 3deg; } }
                @keyframes hueShift { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }
                @keyframes patternMove { from { background-position: 0 0, 4px 4px; } to { background-position: 40px 40px, 44px 44px; } }
                @keyframes pulse-blur { 0%, 100% { filter: blur(8px); scale: 1; opacity: 1; } 50% { filter: blur(14px); scale: 1.1; opacity: 0.7; } }
                @keyframes pulse-scale { 0%, 100% { scale: 1; } 50% { scale: 1.1; } }

                .anim-float { animation: float 6s infinite ease-in-out; }
                .anim-float-alt { animation: float-reverse 7s infinite ease-in-out; }
                .anim-spin { animation: spin 12s infinite linear; }
                .anim-spin-fast { animation: spin-fast 8s infinite linear; }
                .anim-wiggle { animation: wiggle 4s infinite ease-in-out; }
                .anim-hue { animation: hueShift 6s infinite linear; }
                .anim-pattern { animation: patternMove 3s infinite linear; }
                .anim-pulse-blur { animation: pulse-blur 4s infinite ease-in-out; }
                .anim-pulse-scale { animation: pulse-scale 3s infinite ease-in-out; }

                .scribble-circle { border-radius: 50%; border: 1px solid #000; }
                .img-placeholder { object-fit: cover; background-color: #ccc; }
            `}</style>

            <svg style={{ width: 0, height: 0, position: 'absolute' }}>
                <defs>
                    <linearGradient id="rainbow-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#32cd32" />
                        <stop offset="50%" stopColor="#ff8c00" />
                        <stop offset="100%" stopColor="#1e90ff" />
                    </linearGradient>
                </defs>
            </svg>

            <div className="abs grad-red-blur anim-pulse-blur right-[-10%] top-[5%] md:left-[70%] md:top-[8%] w-[40%] md:w-[12%] h-[20%] md:h-[15%] z-1"></div>
            <div className="abs grad-rainbow anim-hue left-[5%] top-[14%] md:left-[5%] md:top-[20%] w-[30%] md:w-[12%] h-[2%] md:h-[2.5%] z-5 mix-blend-multiply"></div>
            <div className="abs grad-rainbow anim-hue hidden md:block left-[20.5%] top-[33%] w-[4.5%] h-[9.5%] z-5 mix-blend-multiply"></div>
            <div className="abs grad-rainbow anim-hue right-[5%] top-[54%] md:left-[58.5%] md:top-[58.5%] w-[25%] md:w-[9%] h-[4%] md:h-[3.5%] z-5 mix-blend-multiply"></div>

            <div className="abs pattern-checkered anim-pattern left-[5%] top-[40%] md:left-[6.5%] md:top-[42.5%] w-[20%] md:w-[12%] h-[5%] md:h-[4.5%] z-2"></div>
            <div className="abs grad-green-fade anim-pulse-scale left-[10%] top-[70%] md:left-[9.5%] md:top-[68.5%] w-[20%] md:w-[9%] h-[4%] md:h-[3.5%] z-5"></div>
            <div className="abs pattern-checkered anim-pattern hidden md:block left-[19%] top-[68.5%] w-[10.5%] h-[3.5%] z-5 opacity-60"></div>

            <svg className="abs anim-wiggle hidden md:block left-[30.5%] top-[48.5%] w-[20%] h-[9%] z-1">
                <rect width="100%" height="100%" fill="none" stroke="#000" strokeWidth="1.5" />
                <line x1="0" y1="0" x2="100%" y2="100%" stroke="#000" strokeWidth="1.5" />
            </svg>

            <svg className="abs anim-float hidden md:block left-[56.5%] top-[41%] w-[5.5%] h-[5.5%] z-[15]" viewBox="0 0 100 100">
                <rect x="15" y="35" width="50" height="50" fill="none" stroke="#000" strokeWidth="1.5" />
                <rect x="35" y="15" width="50" height="50" fill="none" stroke="#000" strokeWidth="1.5" />
                <line x1="15" y1="35" x2="35" y2="15" stroke="#000" strokeWidth="1.5" />
                <line x1="65" y1="35" x2="85" y2="15" stroke="#000" strokeWidth="1.5" />
                <line x1="15" y1="85" x2="35" y2="65" stroke="#000" strokeWidth="1.5" />
                <line x1="65" y1="85" x2="85" y2="65" stroke="#000" strokeWidth="1.5" />
            </svg>

            <svg className="abs anim-float-alt hidden md:block left-[70%] top-[61%] w-[20%] h-[7%] z-[15]" viewBox="0 0 250 80">
                <rect x="15" y="35" width="210" height="30" fill="none" stroke="#000" strokeWidth="1.5" />
                <rect x="35" y="15" width="210" height="30" fill="none" stroke="#000" strokeWidth="1.5" />
                <line x1="15" y1="35" x2="35" y2="15" stroke="#000" strokeWidth="1.5" />
                <line x1="225" y1="35" x2="245" y2="15" stroke="#000" strokeWidth="1.5" />
                <line x1="15" y1="65" x2="35" y2="45" stroke="#000" strokeWidth="1.5" />
                <line x1="225" y1="65" x2="245" y2="45" stroke="#000" strokeWidth="1.5" />
            </svg>

            <svg className="abs anim-float hidden md:block left-[42%] top-[81.5%] w-[7.5%] h-[6.5%] z-[15]" viewBox="0 0 100 100">
                <rect x="10" y="40" width="60" height="50" fill="none" stroke="#000" strokeWidth="1.5" />
                <rect x="30" y="20" width="60" height="50" fill="none" stroke="#000" strokeWidth="1.5" />
                <line x1="10" y1="40" x2="30" y2="20" stroke="#000" strokeWidth="1.5" />
                <line x1="70" y1="40" x2="90" y2="20" stroke="#000" strokeWidth="1.5" />
                <line x1="10" y1="90" x2="30" y2="70" stroke="#000" strokeWidth="1.5" />
                <line x1="70" y1="90" x2="90" y2="70" stroke="#000" strokeWidth="1.5" />
            </svg>

            <svg className="abs anim-float-alt hidden md:block left-[81.5%] top-[81%] w-[6.5%] h-[6.5%] z-[15]" viewBox="0 0 100 100">
                <rect x="15" y="35" width="50" height="50" fill="none" stroke="#000" strokeWidth="1.5" />
                <rect x="35" y="15" width="50" height="50" fill="none" stroke="#000" strokeWidth="1.5" />
                <line x1="15" y1="35" x2="35" y2="15" stroke="#000" strokeWidth="1.5" />
                <line x1="65" y1="35" x2="85" y2="15" stroke="#000" strokeWidth="1.5" />
                <line x1="15" y1="85" x2="35" y2="65" stroke="#000" strokeWidth="1.5" />
                <line x1="65" y1="85" x2="85" y2="65" stroke="#000" strokeWidth="1.5" />
            </svg>

            <svg className="abs anim-float left-[20%] top-[12%] md:left-[34%] md:top-[18%] w-[30%] md:w-[14%] h-auto md:h-[16%] z-10" viewBox="0 0 150 100">
                <path d="M30,70 C10,65 15,40 35,40 C40,20 70,15 90,30 C110,15 140,25 140,50 C150,65 140,85 120,85 C100,90 90,85 80,85 C60,95 40,85 30,70 Z" fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>

            <svg className="abs anim-float-alt right-[5%] top-[20%] md:left-[74%] md:top-[20%] w-[35%] md:w-[15%] h-auto md:h-[14%] z-10" viewBox="0 0 150 100">
                <path d="M20,60 C5,50 15,30 35,30 C45,10 75,5 95,25 C115,10 145,25 140,50 C145,65 130,85 110,80 C95,95 70,85 60,80 C40,90 20,80 20,60 Z" fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>

            <svg className="abs anim-float left-[5%] top-[50%] md:left-[10%] md:top-[55%] w-[45%] md:w-[20%] h-auto md:h-[14%] z-12" viewBox="0 0 200 100">
                <path d="M30,60 C10,50 20,30 40,35 C50,15 80,15 100,30 C115,10 150,15 160,35 C180,30 195,50 185,70 C195,85 170,95 150,85 C130,100 100,90 90,85 C70,100 40,90 30,60 Z" fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>

            <svg className="abs anim-float-alt right-[10%] top-[72%] md:left-[52%] md:top-[59%] w-[25%] md:w-[8.5%] h-auto md:h-[13%] z-12" viewBox="0 0 100 100">
                <path d="M20,60 C5,50 15,25 35,30 C45,10 75,10 85,30 C100,35 95,60 80,70 C85,85 60,95 50,85 C35,100 15,85 20,60 Z" fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>

            <svg className="abs anim-wiggle left-[4%] top-[30%] md:left-[4%] md:top-[34%] w-[25%] md:w-[14%] h-[4%] md:h-[6%] z-10" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0,15 Q10,0 20,15 T40,15 T60,15 T80,15 T100,15" fill="none" stroke="url(#rainbow-stroke)" strokeWidth="2.5" strokeLinecap="round" />
            </svg>

            <svg className="abs anim-wiggle hidden md:block left-[26%] top-[43%] w-[16%] h-[5%] z-10 overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0,10 Q10,0 20,10 T40,10 T60,10 T80,10 T98,10" fill="none" stroke="url(#rainbow-stroke)" strokeWidth="2.5" strokeLinecap="round" />
                <polygon points="95,5 105,10 95,15" fill="#1e90ff" />
            </svg>

            <svg className="abs anim-wiggle right-[10%] top-[60%] md:left-[42%] md:top-[59%] w-[25%] md:w-[12%] h-[2%] md:h-[3.5%] z-10" viewBox="0 0 100 20" preserveAspectRatio="none">
                <path d="M0,10 Q10,20 20,10 T40,10 T60,10 T80,10 T100,10" fill="none" stroke="url(#rainbow-stroke)" strokeWidth="3" strokeLinecap="round" />
            </svg>

            <div className="abs scribble-circle anim-spin hidden md:block left-[27%] top-[22%] w-[7.5%] aspect-square rotate-[15deg] z-5"></div>
            <div className="abs scribble-circle anim-spin-fast hidden md:block left-[26.5%] top-[21%] w-[8.5%] aspect-[1.1] rotate-[35deg] border-black/50 z-5"></div>

            <div className="abs scribble-circle anim-spin left-[60%] top-[14%] md:left-[60%] md:top-[9%] w-[20%] md:w-[10%] aspect-[1.3] rotate-[5deg] z-5"></div>
            <div className="abs scribble-circle anim-spin-fast left-[59%] top-[13.5%] md:left-[59.5%] md:top-[8.5%] w-[22%] md:w-[11%] aspect-[1.2] rotate-[15deg] border-black/60 z-5"></div>

            <div className="abs scribble-circle anim-spin hidden md:block left-[23%] top-[72%] w-[9%] aspect-[1.1] rotate-[-10deg] z-5"></div>
            <div className="abs scribble-circle anim-spin-fast hidden md:block left-[23.5%] top-[71.5%] w-[8.5%] aspect-[1.2] rotate-[5deg] border-black/40 z-5"></div>

            <div className="abs anim-pulse-scale hidden md:block left-[1.8%] top-[58.5%] w-[3.2%] aspect-[1.2] bg-black rounded-full z-10"></div>
            <div className="abs anim-pulse-scale hidden md:block left-[5.5%] top-[58.8%] w-[2.2%] aspect-square border-[1.5px] border-black rounded-full z-10"></div>
            <div className="abs anim-pulse-scale hidden md:block left-[61%] top-[63%] w-[3%] aspect-[1.2] bg-black rounded-full z-10"></div>
            <div className="abs anim-pulse-scale hidden md:block left-[18.5%] top-[84%] w-[3.5%] aspect-[1.5] border-[1.5px] border-black rounded-full z-10"></div>

            <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200&q=80" alt="Landscape" className="abs img-placeholder anim-float left-[70%] top-[26%] md:left-[50.5%] md:top-[23%] w-[20%] md:w-[8.5%] h-[8%] md:h-[9.5%] z-11 object-cover" />
            <img src="https://images.unsplash.com/photo-1598974355420-565d752be316?w=200&q=80" alt="Animal" className="abs img-placeholder anim-float-alt hidden md:block left-[49%] top-[68.5%] w-[3.5%] h-[4.5%] grayscale z-11 object-cover" />
            <img src="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&q=80" alt="Clouds" className="abs img-placeholder anim-float hidden md:block left-[63.5%] top-[63%] w-[5.5%] h-[5%] z-11 object-cover" />
            <img src="https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?w=200&q=80" alt="Moon" className="abs img-placeholder anim-pulse-scale left-[75%] top-[87%] md:left-[34%] md:top-[83.5%] w-[10%] md:w-[3%] aspect-square rounded-full grayscale z-11 object-cover" />
            <img src="https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?w=200&q=80" alt="Moon Sliver" className="abs img-placeholder anim-pulse-scale hidden md:block left-[8.5%] top-[58.8%] w-[2%] aspect-[0.8] rounded-full grayscale z-11 object-cover" />

            <div className="abs txt top-[8%] md:top-[10.5%] left-[6%] md:left-[8.5%] text-[14vw] md:text-[7.2vw] font-normal tracking-[-0.02em]">BULUSAN</div>
            <div className="abs txt txt-serif top-[8%] md:top-[10.5%] right-[6%] md:right-[9%] text-[10vw] md:text-[7vw]">ZOO</div>

            <div className="abs txt top-[16%] md:top-[20.5%] left-[20%] md:left-[24.5%] text-[4.5vw] md:text-[1.2vw] tracking-[0.05em]">CALAPAN</div>
            <div className="abs txt top-[16%] md:top-[20.5%] left-[55%] md:left-[58%] text-[4.5vw] md:text-[1.2vw] tracking-[0.08em]">NATURE PARK</div>

            <div className="abs txt txt-italic top-[21%] md:top-[23%] left-[6%] md:left-[9.5%] text-[18vw] md:text-[9vw] font-medium tracking-[-0.07em] scale-y-[1.1] scale-x-[0.95] z-[30]">MORE</div>
            <div className="abs txt txt-italic top-[28%] md:top-[23%] left-[45%] md:left-[59%] text-[18vw] md:text-[9vw] font-medium tracking-[-0.07em] scale-y-[1.1] scale-x-[0.95] z-[30]">THAN</div>

            <div className="abs txt top-[37%] md:top-[36%] left-[10%] md:left-[29%] text-[7vw] md:text-[4.8vw] font-normal">A</div>
            <div className="abs txt top-[36%] md:top-[35.5%] left-[20%] md:left-[49%] text-[9.5vw] md:text-[6vw] tracking-[-0.03em]">DESTINATION;</div>

            <div className="abs txt top-[44%] md:top-[45.5%] left-[10%] md:left-[20.5%] text-[4.5vw] md:text-[2.2vw]">IS</div>
            <div className="abs txt top-[44%] md:top-[45%] left-[22%] md:left-[42.5%] text-[5vw] md:text-[2.8vw] tracking-[-0.01em]">A PLACE</div>
            <div className="abs txt top-[44%] md:top-[45%] left-[60%] md:left-[81%] text-[5vw] md:text-[3vw] tracking-[-0.01em]">WHERE</div>

            <div className="abs txt top-[49%] md:top-[48%] left-[6%] md:left-[5.5%] text-[13vw] md:text-[7vw] font-normal tracking-[-0.03em] z-[25]">NATURE,</div>
            <div className="abs txt txt-serif top-[55%] md:top-[48.5%] left-[15%] md:left-[51.5%] text-[9.5vw] md:text-[6.8vw] tracking-[-0.03em] scale-y-[1.05] z-[25]">WILDLIFE, AND</div>

            <div className="abs txt top-[61%] md:top-[60%] left-[8%] md:left-[29.5%] text-[6vw] md:text-[2.8vw] tracking-[0.01em]">SERENITY</div>
            <div className="abs txt top-[61%] md:top-[60%] left-[55%] md:left-[78%] text-[6vw] md:text-[2.8vw] tracking-[0.01em]">MEET,</div>

            <div className="abs txt top-[66%] md:top-[64%] left-[8%] md:left-[29.5%] text-[5.5vw] md:text-[2.8vw] tracking-[0.01em]">EVERY VISITOR TO</div>

            <div className="abs txt top-[71%] md:top-[69%] left-[15%] md:left-[30.5%] text-[6vw] md:text-[2.8vw] tracking-[0.01em]">SLOW DOWN,</div>
            <div className="abs txt txt-serif top-[75%] md:top-[69%] left-[30%] md:left-[70%] text-[7vw] md:text-[3vw] tracking-[-0.01em]">APPRECIATE,</div>

            <div className="abs txt top-[81%] md:top-[74%] left-[6%] md:left-[10.5%] text-[12vw] md:text-[6.5vw] tracking-[-0.02em]">AND</div>
            <div className="abs txt txt-serif top-[87%] md:top-[74%] left-[15%] md:left-[35.5%] text-[9vw] md:text-[6.2vw] tracking-[-0.02em] scale-y-[1.05] z-[25]">RECONNECT WITH</div>

            <div className="abs txt top-[93%] md:top-[84.5%] left-[6%] md:left-[12.5%] text-[4vw] md:text-[2.6vw] tracking-[0.02em]">THE</div>
            <div className="abs txt top-[93%] md:top-[84.5%] left-[22%] md:left-[22.5%] text-[4vw] md:text-[2.6vw] tracking-[0.02em]">BEAUTY OF</div>
            <div className="abs txt top-[96%] md:top-[84.5%] left-[6%] md:left-[50%] text-[4vw] md:text-[2.6vw] tracking-[0.02em]">THE NATURAL WORLD.</div>
        </section>
    );
};

const Tooltip = ({ title, desc }) => (
    <div className="absolute bottom-[calc(100%+20px)] left-1/2 -translate-x-1/2 z-[999] whitespace-nowrap w-56 bg-black px-5 py-4 rounded-2xl shadow-2xl pointer-events-none tooltip-anim opacity-0 scale-95 origin-bottom">
        <p className="font-['Mistral',_cursive] text-[#5dcd5a] text-2xl mb-1.5 leading-none tracking-wide">{title}</p>
        <p className="text-white/80 text-sm leading-relaxed whitespace-normal font-medium">{desc}</p>
        <div className="absolute -bottom-[8px] left-1/2 -translate-x-1/2 w-4 h-4 bg-black rotate-45" />
    </div>
);

const PurposeSection = () => {
    const sectionRef = useRef(null);
    const [hoveredId, setHoveredId] = useState(null);

    const titleWords = 'Our Purpose'.split(' ');
    const bodyWords = 'This zoo exists to protect wildlife, preserve biodiversity, and provide a safe environment for animals under human care.'.split(' ');

    const animals = [
        { id: 'rescue', src: '/pixels/pixeldeer.png', posClass: 'left-[5%] top-[12%] md:left-[9%] md:top-[16%]', rotate: -5, speed: -100, tooltip: { title: 'Rescue', desc: 'Emergency medical intervention for local species.' } },
        { id: 'habitat', src: '/pixels/pixelhor.png', posClass: 'right-[5%] top-[6%] md:right-[10%] md:top-[11%]', rotate: 7, speed: 150, tooltip: { title: 'Habitat', desc: 'Preservation of native flora and nesting grounds.' } },
        { id: 'sanctuary', src: '/pixels/pixelrab.png', posClass: 'left-[8%] bottom-[10%] md:left-[14%] md:bottom-[14%]', rotate: -8, speed: -120, tooltip: { title: 'Sanctuary', desc: 'Safe haven for animals unable to return to the wild.' } },
        { id: 'education', src: '/pixels/pixelmon.png', posClass: 'right-[7%] bottom-[14%] md:right-[16%] md:bottom-[18%]', rotate: 5, speed: 180, tooltip: { title: 'Education', desc: 'Building awareness for the next generation.' } },
    ];

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.purpose-word',
                { opacity: 0, rotationX: -90, transformOrigin: '50% 50% -50' },
                {
                    opacity: 1, rotationX: 0, duration: 1, ease: 'back.out(1.5)', stagger: 0.05,
                    scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', toggleActions: 'play reverse play reverse' }
                }
            );

            gsap.fromTo('.purpose-line',
                { scaleX: 0, transformOrigin: 'center' },
                { scaleX: 1, duration: 1, ease: 'power3.inOut', scrollTrigger: { trigger: sectionRef.current, start: 'top 65%', toggleActions: 'play reverse play reverse' } }
            );

            gsap.fromTo('.purpose-body-word',
                { opacity: 0, y: 30, rotationY: 45 },
                {
                    opacity: 1, y: 0, rotationY: 0, duration: 0.8, ease: 'power2.out', stagger: 0.015,
                    scrollTrigger: { trigger: sectionRef.current, start: 'top 60%', toggleActions: 'play reverse play reverse' }
                }
            );

            animals.forEach((a, i) => {
                const isLeft = a.posClass.includes('left');
                gsap.fromTo(`.animal-${i}`,
                    { opacity: 0, x: isLeft ? '-100vw' : '100vw', rotation: isLeft ? -90 : 90 },
                    {
                        opacity: 1, x: 0, rotation: a.rotate, ease: 'power3.out',
                        scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', end: 'center center', scrub: 1 }
                    }
                );

                gsap.to(`.animal-${i}`, {
                    yPercent: a.speed, ease: 'none',
                    scrollTrigger: { trigger: sectionRef.current, start: 'top bottom', end: 'bottom top', scrub: true }
                });

                Draggable.create(`.animal-${i}`, {
                    type: 'x,y', bounds: sectionRef.current, edgeResistance: 0.8,
                    onDragStart: function () { gsap.to(this.target, { scale: 1.15, duration: 0.4, ease: 'power3.out' }); },
                    onDragEnd: function () { gsap.to(this.target, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)' }); }
                });
            });

        }, sectionRef);

        return () => ctx.revert();
    }, []);

    useEffect(() => {
        if (hoveredId) {
            gsap.to('.tooltip-anim', { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.5)', overwrite: true });
        }
    }, [hoveredId]);

    return (
        <section
            ref={sectionRef}
            className="relative w-full min-h-screen bg-white px-6 py-16 md:px-16 flex flex-col items-center justify-center overflow-hidden"
        >
            {animals.map((a, i) => (
                <div key={a.id} className={`animal-${i} absolute z-[5] overflow-visible ${a.posClass}`}>
                    <div
                        onMouseEnter={() => setHoveredId(a.id)}
                        onMouseLeave={() => { setHoveredId(null); gsap.to('.tooltip-anim', { opacity: 0, scale: 0.9, duration: 0.2, overwrite: true }); }}
                        className="cursor-grab active:cursor-grabbing relative"
                    >
                        <div className="transition-all duration-500 hover:drop-shadow-[0_0_25px_rgba(93,205,90,0.6)] drop-shadow-[0_8px_20px_rgba(0,0,0,0.15)]">
                            <img src={a.src} alt={a.id} className="w-24 md:w-44 lg:w-52 h-auto pointer-events-none select-none" />
                        </div>
                        {hoveredId === a.id && <Tooltip title={a.tooltip.title} desc={a.tooltip.desc} />}
                    </div>
                </div>
            ))}

            <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center justify-center text-center">
                <h2 className="font-['Mistral',_cursive] text-6xl md:text-8xl text-black mb-6 flex flex-wrap justify-center gap-x-5 py-2 [perspective:800px]">
                    {titleWords.map((word, i) => (
                        <span key={i} className="purpose-word inline-block pointer-events-none opacity-0">
                            {word}
                        </span>
                    ))}
                </h2>
                <div className="purpose-line w-24 h-[3px] bg-[#3db53d] mb-10 opacity-0" />
                <p className="text-[clamp(1.5rem,3.5vw,3.5rem)] leading-[1.2] text-black font-medium max-w-5xl flex flex-wrap justify-center gap-x-3 py-2 [perspective:600px]">
                    {bodyWords.map((word, i) => (
                        <span key={i} className="purpose-body-word inline-block pointer-events-none opacity-0">
                            {word}
                        </span>
                    ))}
                </p>
            </div>
        </section>
    );
};

const ExploreSection = () => {
    const sectionRef = useRef(null);

    const titleWords = 'Explore Habitats'.split(' ');
    const bodyWords = 'Animals are grouped into environments that reflect their natural ecosystems. Each habitat is designed to support natural behavior, from dense forest settings to open grasslands.'.split(' ');

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.explore-text-content',
                { scale: 0.8, opacity: 0, letterSpacing: '2px' },
                {
                    scale: 1, opacity: 1, letterSpacing: 'normal', ease: 'power2.out',
                    scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', end: 'center center', scrub: 1 }
                }
            );
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={sectionRef}
            className="relative w-full min-h-screen px-6 py-16 md:px-16 flex flex-col items-center justify-center overflow-hidden bg-white"
        >
            <div className="explore-text-content relative z-10 w-full max-w-[1500px] mx-auto flex flex-col items-center justify-center text-center opacity-0">
                <h2 className="font-['Mistral',_cursive] text-6xl md:text-8xl text-black mb-8 flex flex-wrap justify-center gap-x-5 py-2">
                    {titleWords.map((word, i) => (
                        <span key={i} className="inline-block pointer-events-none">{word}</span>
                    ))}
                </h2>
                <p className="text-[clamp(2rem,4vw,5.5rem)] leading-[1.15] text-black font-extrabold tracking-tight flex flex-wrap justify-center gap-x-3 py-2">
                    {bodyWords.map((word, i) => (
                        <span key={i} className="inline-block pointer-events-none">{word}</span>
                    ))}
                </p>
            </div>
        </section>
    );
};

const FeaturedSection = () => {
    const containerRef = useRef(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.featured-text span',
                { opacity: 0, z: -500, scale: 0.2 },
                {
                    opacity: 1, z: 0, scale: 1, ease: 'expo.out', stagger: 0.2,
                    scrollTrigger: { trigger: containerRef.current, start: 'top 80%', end: 'center center', scrub: 1 }
                }
            );

            gsap.fromTo('.featured-drag-1',
                { opacity: 0, rotation: -360, x: '50vw', y: '-50vh' },
                {
                    opacity: 1, rotation: 0, x: 0, y: 0, ease: 'power2.out',
                    scrollTrigger: { trigger: containerRef.current, start: 'top 80%', end: 'center center', scrub: 1.5 }
                }
            );

            gsap.fromTo('.featured-drag-2',
                { opacity: 0, rotation: 360, x: '-50vw', y: '50vh' },
                {
                    opacity: 1, rotation: 0, x: 0, y: 0, ease: 'power2.out',
                    scrollTrigger: { trigger: containerRef.current, start: 'top 80%', end: 'center center', scrub: 1.5 }
                }
            );

            gsap.fromTo('.featured-subtext',
                { opacity: 0, y: 40 },
                {
                    opacity: 1, y: 0, duration: 1, ease: 'power3.out',
                    scrollTrigger: { trigger: containerRef.current, start: 'top 70%' }
                }
            );

            gsap.fromTo('.featured-card',
                { opacity: 0, y: 60, scale: 0.9 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 1,
                    ease: 'expo.out',
                    stagger: 0.2,
                    scrollTrigger: { trigger: '.featured-grid', start: 'top 75%' }
                }
            );

            gsap.to('.featured-card', {
                y: -30,
                scrollTrigger: {
                    trigger: '.featured-grid',
                    scrub: true
                }
            });

            Draggable.create('.featured-drag-item', {
                type: 'x,y',
                bounds: containerRef.current,
                edgeResistance: 0.8,
                onDragStart: function () { gsap.to(this.target, { scale: 1.1, duration: 0.3, ease: 'power2.out' }); },
                onDragEnd: function () { gsap.to(this.target, { scale: 1, duration: 0.5, ease: 'back.out(1.5)' }); }
            });

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={containerRef}
            className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white text-black [perspective:1000px]"
        >
            <div className="featured-text-wrap relative z-10 flex flex-col items-center justify-center w-full max-w-7xl mx-auto [transform-style:preserve-3d]">

                <img
                    src="/pixels/pixeldeer.png"
                    alt=""
                    className="featured-drag-1 featured-drag-item absolute -top-12 -right-12 md:-top-24 md:-right-32 w-36 h-36 md:w-60 md:h-60 cursor-grab z-20 drop-shadow-2xl object-contain pointer-events-auto opacity-0"
                />

                <div className="featured-text relative flex flex-col font-black text-[clamp(4.5rem,13vw,14rem)] leading-[0.85] tracking-tighter uppercase pointer-events-none select-none text-center py-4">
                    <span className="block origin-center opacity-0 text-black">BULUSAN</span>
                    <span className="block origin-center text-gray-800 opacity-0">FEATURED</span>
                </div>

                <img
                    src="/pixels/pixelmon.png"
                    alt=""
                    className="featured-drag-2 featured-drag-item absolute -bottom-10 -left-10 md:-bottom-20 md:-left-24 w-32 h-32 md:w-52 md:h-52 cursor-grab z-20 drop-shadow-2xl object-contain pointer-events-auto opacity-0"
                />

                <div className="featured-content mt-10 md:mt-16 relative z-10 w-full max-w-5xl px-8">
                    <p className="featured-subtext text-center text-md md:text-xl tracking-wide text-gray-700 max-w-7xl mx-auto opacity-0">
                        Explore curated wildlife highlights, immersive habitats, and interactive experiences designed for deeper engagement.
                    </p>

                    <div className="featured-grid mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="featured-card opacity-0 p-6 rounded-2xl bg-gray-50 border border-gray-200 shadow-xl">
                            <h3 className="text-lg font-semibold mb-2 text-black">AI Zusan Assistant</h3>
                            <p className="text-sm text-gray-600">
                                Your personal guide for real-time insights and interactive learning.
                            </p>
                        </div>

                        <div className="featured-card opacity-0 p-6 rounded-2xl bg-gray-50 border border-gray-200 shadow-xl">
                            <h3 className="text-lg font-semibold mb-2 text-black">Mini Zoo Game</h3>
                            <p className="text-sm text-gray-600">
                                Design and manage your own virtual zoo with real animal data and behaviors.
                            </p>
                        </div>

                        <div className="featured-card opacity-0 p-6 rounded-2xl bg-gray-50 border border-gray-200 shadow-xl">
                            <h3 className="text-lg font-semibold mb-2 text-black">Conservation Initiatives</h3>
                            <p className="text-sm text-gray-600">
                                Learn about and participate in efforts to protect and preserve wildlife and their habitats.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

const Home = () => {
    return (
        <ReactLenis
            root
            options={{
                lerp: 0.05,
                duration: 1.5,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smoothWheel: true,
                smoothTouch: false,
                wheelMultiplier: 1.05,
                touchMultiplier: 2,
                infinite: false
            }}
        >
            <div className="relative min-h-screen bg-white">
                <Header />
                <AIFloatingButton />

                <main className="relative w-full">
                    <div className="relative z-0">
                        <HeroSection />
                    </div>

                    <div className="relative z-10">
                        <AboutSection />
                    </div>

                    <div className="relative z-20 w-full">
                        <PurposeSection />
                    </div>

                    <div className="relative z-30 w-full">
                        <ExploreSection />
                    </div>

                    <div className="relative z-40 w-full">
                        <FeaturedSection />
                    </div>
                </main>

                <div className="relative z-50 w-full">
                    <Footer />
                </div>
            </div>
        </ReactLenis>
    );
};

export default Home;