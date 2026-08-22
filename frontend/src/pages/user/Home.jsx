import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { ReactLenis } from 'lenis/react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Draggable } from 'gsap/Draggable';
import * as THREE from 'three';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import '../../App.css';

gsap.registerPlugin(ScrollTrigger, Draggable);

const ticketMaskStyle = {
    WebkitMaskImage: 'radial-gradient(circle at 0px 50%, transparent 5px, black 6px), radial-gradient(circle at 100% 50%, transparent 5px, black 6px)',
    WebkitMaskSize: '51% 16px', // 16px dictates the vertical spacing between holes
    WebkitMaskRepeat: 'repeat-y',
    WebkitMaskPosition: 'left, right',
    maskImage: 'radial-gradient(circle at 0px 50%, transparent 5px, black 6px), radial-gradient(circle at 100% 50%, transparent 5px, black 6px)',
    maskSize: '51% 16px',
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
        <div ref={containerRef} className="relative w-full min-h-[100dvh] overflow-hidden bg-white">
            <section className="relative w-full min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
                <div className="hero-bg-parallax absolute inset-0 bg-white -z-10 origin-bottom" />

                {/* <div className="hero-images absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
                    <img
                        src="/pixels/deer.png"
                        alt="Rabbit"
                        className="hero-drag-item absolute w-20 sm:w-24 md:w-36 lg:w-56 left-[5%] sm:left-[10%] md:left-20%] top-[55%] sm:top-[70%] md:top-[40%] -rotate-12 pointer-events-auto cursor-grab active:cursor-grabbing"
                    />
                    <img
                        src="/pixels/rabbit.png"
                        alt="Turtle"
                        className="hero-drag-item absolute w-20 sm:w-24 md:w-36 lg:w-56 right-[5%] sm:right-[10%] md:right-[14%] top-[57%] sm:top-[70%] md:top-[45%] rotate-12 pointer-events-auto cursor-grab active:cursor-grabbing"
                    />
                </div> */}

                <div className="hero-content text-center flex flex-col items-center z-10 px-4 sm:px-5 pointer-events-none">
                    <h2 className="hero-title opacity-0 font-['Mistral',_cursive] text-[clamp(2rem,5vw,5rem)] text-black -mb-1 sm:-mb-2">
                        Welcome to
                    </h2>
                    <div className="mb-[20px] sm:mb-[30px]">
                        <div className="text-[clamp(2.5rem,8vw,6rem)] font-semibold text-black leading-none tracking-tight overflow-hidden py-2 sm:py-4">
                            <span className="block overflow-hidden">
                                <span
                                    className="hero-line block"
                                    style={{ clipPath: 'inset(100% 0% 0% 0%)' }}
                                >
                                    BULUSAN ZOO
                                </span>
                            </span>
                        </div>

                        <div className="overflow-hidden mt-2">
                            <p
                                className="hero-line text-md sm:text-xl md:text-2xl font-semibold text-black/70 tracking-wide"
                                style={{ clipPath: 'inset(100% 0% 0% 0%)' }}
                            >
                                Explore Nature, Learn, and Connect
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/reservations')}
                        className="hero-btn group pointer-events-auto bg-[#c6fe69] text-black p-1 sm:p-1.5 rounded-xl cursor-pointer transition-all duration-300 ease-out hover:scale-110 hover:drop-shadow-xl active:scale-95 focus:outline-none drop-shadow-md transform-gpu"
                        style={ticketMaskStyle}
                    >
                        <div className="w-full h-full rounded-lg flex items-center justify-center py-1.5 sm:py-0.5 px-7 sm:px-9">
                            <span className="font-['Mistral',_cursive] text-[1.5rem] sm:text-[2rem] tracking-[1px] block mt-1 transition-transform duration-300 ease-out group-hover:scale-105">
                                Plan a Visit
                            </span>
                        </div>
                    </button>
                </div>

                {/* <div className="scroll-hint opacity-0 absolute bottom-[20px] sm:bottom-[30px] flex flex-col items-center text-black text-[0.8rem] sm:text-[0.9rem] z-10">
                    <p className="m-0 mb-1 font-medium text-2xl">scroll to explore</p>
                    <span className="text-[1rem] sm:text-[2.2rem] animate-bounce">↓</span>
                </div> */}
            </section>
        </div>
    );
};

const AboutSection = () => (
    <section className="relative w-full h-[100svh] p-4 sm:p-8 overflow-hidden bg-[#fff]">
        <div className="w-full h-full flex justify-center items-center text-center rounded-[1.5rem] sm:rounded-[2rem] bg-[#c6fe69] px-4">
            <h1 className="w-full sm:w-[90%] md:w-[90%] text-[#000] text-3xl sm:text-[2rem] md:text-[5rem] font-black leading-[1.1] md:leading-[1]">
                Bulusan Zoo Nature Park is more than a destination, it is a place where nature,
                wildlife, and serenity meet, inviting every visitor to slow down, appreciate,
                and reconnect with the beauty of the natural world.            
            </h1>
        </div>
    </section>
);

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
            <div className="relative min-h-[100dvh] bg-white">
                <Header />
                <AIFloatingButton />

                <main className="relative w-full">
                    <div className="relative z-0">
                        <HeroSection />
                    </div>

                    <div className="relative z-10">
                        <AboutSection />
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