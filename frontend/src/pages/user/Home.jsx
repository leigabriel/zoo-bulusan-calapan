import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { ReactLenis } from 'lenis/react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Draggable } from 'gsap/draggable';

import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import '../../App.css';

gsap.registerPlugin(ScrollTrigger, Draggable);

const GRID_SIZE = 36;
const GREEN_PIXELS = ['#3db53d', '#2ea82e', '#4dcc4d', '#6ed86e', '#45bf45'];
const WHITE_PIXELS = ['#ffffff', '#e8f5e8', '#d4f0d4', '#c0ebc0', '#f0faf0'];

const ticketMaskStyle = {
    WebkitMaskImage: 'radial-gradient(circle at 0 50%, transparent 6px, black 7px), radial-gradient(circle at 100% 50%, transparent 6px, black 7px)',
    WebkitMaskSize: '51% 100%',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'left, right',
    maskImage: 'radial-gradient(circle at 0 50%, transparent 6px, black 7px), radial-gradient(circle at 100% 50%, transparent 6px, black 7px)',
    maskSize: '51% 100%',
    maskRepeat: 'no-repeat',
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

            tl.fromTo('.hero-title',
                { opacity: 0, y: 50, skewY: 5 },
                { opacity: 1, y: 0, skewY: 0, duration: 1.2, ease: 'expo.out' }, 0
            )
                .fromTo('.hero-line',
                    { clipPath: 'inset(100% 0% 0% 0%)', y: 50 },
                    { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.5, ease: 'expo.out', stagger: 0.15 }, 0.1
                )
                .fromTo('.hero-btn',
                    { opacity: 0, scale: 0.9, y: 30 },
                    { opacity: 1, scale: 1, y: 0, duration: 1.2, ease: 'elastic.out(1, 0.5)' }, 0.5
                )
                .fromTo('.scroll-hint',
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, 0.7
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

            gsap.to('.hero-content', {
                yPercent: 50,
                opacity: 0,
                ease: 'none',
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true,
                }
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="relative w-full min-h-screen overflow-hidden">
            <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden">
                <div className="hero-bg-parallax absolute inset-0 bg-[url('/background/1000.webp')] bg-cover bg-center bg-no-repeat -z-10 origin-bottom" />
                <div className="hero-content text-center flex flex-col items-center z-10 px-5">
                    <h2 className="hero-title opacity-0 font-['Mistral',_cursive] text-[clamp(2.5rem,5vw,5rem)] text-[#212631] -mb-2">
                        welcome to
                    </h2>
                    <div className="text-[clamp(3rem,8vw,6rem)] font-extrabold text-[#212631] leading-none tracking-tight mb-[30px] overflow-hidden py-4">
                        {['BULUSAN ZOO', 'NATURE PARK'].map((line, i) => (
                            <span key={i} className="block overflow-hidden">
                                <span className="hero-line block" style={{ clipPath: 'inset(100% 0% 0% 0%)' }}>{line}</span>
                            </span>
                        ))}
                    </div>
                    <button
                        onClick={() => navigate('/reservations')}
                        className="hero-btn opacity-0 bg-[#5dcd5a] text-white py-2.5 px-10 rounded-xl cursor-pointer transition-transform duration-500 ease-out hover:scale-105 active:scale-95 flex items-center justify-center focus:outline-none"
                        style={ticketMaskStyle}
                    >
                        <span className="font-['Mistral',_cursive] text-[2rem] tracking-[1px] block mt-1">
                            Reserved
                        </span>
                    </button>
                </div>
                <div className="scroll-hint opacity-0 absolute bottom-[30px] flex flex-col items-center text-[#212631] text-[0.9rem]">
                    <p className="m-0 mb-1 font-medium">scroll to explore</p>
                    <span className="text-[1.2rem]">↓</span>
                </div>
            </section>
        </div>
    );
};

const AboutSection = () => {
    const sectionRef = useRef(null);
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const activePixels = useRef(new Map());
    const isRunning = useRef(false);
    const navigate = useNavigate();

    const titleWords = 'Bulusan'.split(' ');
    const bodyWords = 'Founded in 2015, Bulusan Wildlife & Nature Park began as a small conservation initiative in Calapan City.'.split(' ');

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.about-word',
                { opacity: 0, y: 100, rotateZ: 10, scale: 0.8 },
                {
                    opacity: 1, y: 0, rotateZ: 0, scale: 1, duration: 1, ease: 'back.out(1.7)', stagger: 0.05,
                    scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', toggleActions: 'play reverse play reverse' }
                }
            );

            gsap.fromTo('.about-body-word',
                { opacity: 0, filter: 'blur(10px)', x: -20 },
                {
                    opacity: 1, filter: 'blur(0px)', x: 0, duration: 0.8, ease: 'power2.out', stagger: 0.02,
                    scrollTrigger: { trigger: sectionRef.current, start: 'top 70%', toggleActions: 'play reverse play reverse' }
                }
            );

            gsap.fromTo('.about-btn',
                { opacity: 0, scale: 0.5, rotationX: 90 },
                {
                    opacity: 1, scale: 1, rotationX: 0, duration: 1, ease: 'expo.out',
                    scrollTrigger: { trigger: sectionRef.current, start: 'top 60%', toggleActions: 'play reverse play reverse' }
                }
            );

            gsap.to('.about-drag-1', {
                yPercent: -120, rotation: 45, xPercent: 30,
                ease: 'none',
                scrollTrigger: { trigger: sectionRef.current, start: 'top bottom', end: 'bottom top', scrub: 1.5 }
            });

            gsap.to('.about-drag-2', {
                yPercent: -100, xPercent: -50, rotation: -30,
                ease: 'none',
                scrollTrigger: { trigger: sectionRef.current, start: 'top bottom', end: 'bottom top', scrub: 1.2 }
            });

            gsap.to('.about-blob', {
                yPercent: 30, xPercent: -10, scale: 1.2, ease: 'none',
                scrollTrigger: { trigger: sectionRef.current, start: 'top bottom', end: 'bottom top', scrub: 2 }
            });

            Draggable.create('.about-drag', {
                type: 'x,y',
                bounds: sectionRef.current,
                edgeResistance: 0.8,
                onDragStart: function () { gsap.to(this.target, { scale: 1.2, duration: 0.4, ease: 'power3.out' }); },
                onDragEnd: function () { gsap.to(this.target, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)' }); }
            });

        }, sectionRef);

        return () => ctx.revert();
    }, []);

    const drawLoop = useCallback(() => {
        if (!isRunning.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const now = performance.now();
        let hasActive = false;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const [key, px] of activePixels.current) {
            const t = (now - px.born) / px.life;
            if (t >= 1) { activePixels.current.delete(key); continue; }
            hasActive = true;
            const alpha = t < 0.25 ? t / 0.25 : t > 0.65 ? 1 - (t - 0.65) / 0.35 : 1;
            ctx.globalAlpha = alpha * 0.7;
            ctx.fillStyle = px.color;
            ctx.fillRect(px.col * GRID_SIZE, px.row * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        }

        ctx.globalAlpha = 1;
        if (hasActive || isRunning.current) rafRef.current = requestAnimationFrame(drawLoop);
    }, []);

    const handleMouseMove = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const col = Math.floor((e.clientX - rect.left) / GRID_SIZE);
        const row = Math.floor((e.clientY - rect.top) / GRID_SIZE);

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (Math.random() > 0.45) continue;
                const key = `${col + dc}_${row + dr}_${Math.floor(performance.now() / 80)}`;
                if (activePixels.current.has(key)) continue;
                activePixels.current.set(key, {
                    col: col + dc,
                    row: row + dr,
                    color: GREEN_PIXELS[Math.floor(Math.random() * GREEN_PIXELS.length)],
                    born: performance.now(),
                    life: 500 + Math.random() * 400,
                });
            }
        }
    }, []);

    const handleMouseEnter = useCallback(() => {
        isRunning.current = true;
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(drawLoop);
    }, [drawLoop]);

    const handleMouseLeave = useCallback(() => {
        isRunning.current = false;
        cancelAnimationFrame(rafRef.current);
        const canvas = canvasRef.current;
        if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        activePixels.current.clear();
    }, []);

    const handleCanvasResize = useCallback((node) => {
        if (!node) return;
        canvasRef.current = node;
        const ro = new ResizeObserver(() => {
            node.width = node.offsetWidth;
            node.height = node.offsetHeight;
        });
        ro.observe(node);
    }, []);

    return (
        <section
            ref={sectionRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative w-full min-h-screen bg-[url('/background/1001.webp')] bg-cover bg-center bg-no-repeat px-6 py-16 md:px-16 flex flex-col items-center justify-center overflow-hidden"
        >
            <canvas ref={handleCanvasResize} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />
            <div
                className="absolute inset-0 opacity-25 pointer-events-none mix-blend-overlay z-[2]"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E")' }}
            />
            <div className="absolute inset-0 pointer-events-none z-[2]">
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 55% at 80% 15%, rgba(61,181,61,0.38) 0%, rgba(134,232,134,0.18) 45%, transparent 75%), radial-gradient(ellipse 55% 45% at 15% 85%, rgba(78,204,78,0.28) 0%, rgba(61,181,61,0.12) 50%, transparent 75%)' }} />
            </div>
            <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center justify-center text-center">
                <img
                    src="/pixels/pixelrab.png"
                    alt=""
                    className="about-drag about-drag-1 absolute z-[-1] w-30 md:w-52 lg:w-60 left-0 md:left-[10%] lg:left-[-15%] top-[75%] md:top-[60%] pointer-events-auto cursor-grab active:cursor-grabbing transform -rotate-6"
                />
                <img
                    src="/pixels/pixeldeer.png"
                    alt=""
                    className="about-drag about-drag-2 absolute z-[-1] w-25 md:w-32 lg:w-40 right-0 md:right-[10%] lg:right-[-15%] top-[-20%] md:top-[5%] pointer-events-auto cursor-grab active:cursor-grabbing transform rotate-6"
                />
                <h2 className="font-['Mistral',_cursive] text-6xl md:text-8xl text-[#1c2326] mb-8 flex flex-wrap justify-center gap-x-5 py-2 [perspective:800px]">
                    {titleWords.map((word, i) => (
                        <span key={i} className="about-word inline-block pointer-events-none opacity-0">
                            {word}
                        </span>
                    ))}
                </h2>
                <p className="text-[clamp(2rem,4vw,4.5rem)] leading-[1.15] text-[#1c2326] mb-12 tracking-tight font-medium flex flex-wrap justify-center gap-x-3 py-2 [perspective:600px]">
                    {bodyWords.map((word, i) => (
                        <span key={i} className="about-body-word inline-block pointer-events-none opacity-0">
                            {word}
                        </span>
                    ))}
                </p>
                <button
                    onClick={() => navigate('/about')}
                    onMouseEnter={(e) => gsap.to(e.target, { scale: 1.05, backgroundColor: '#ffffff', duration: 0.4, ease: 'power2.out' })}
                    onMouseLeave={(e) => gsap.to(e.target, { scale: 1, backgroundColor: 'rgba(255,255,255,0.4)', duration: 0.4, ease: 'power2.out' })}
                    className="about-btn opacity-0 font-['Mistral',_cursive] text-4xl md:text-5xl text-[#1c2326] px-10 py-3 rounded-2xl bg-white/40 focus:outline-none cursor-pointer border border-[#1c2326]/10"
                >
                    about us
                </button>
            </div>
        </section>
    );
};

const Tooltip = ({ title, desc }) => (
    <div className="absolute bottom-[calc(100%+20px)] left-1/2 -translate-x-1/2 z-[999] whitespace-nowrap w-56 bg-[#1c2326] px-5 py-4 rounded-2xl shadow-2xl pointer-events-none tooltip-anim opacity-0 scale-95 origin-bottom">
        <p className="font-['Mistral',_cursive] text-[#5dcd5a] text-2xl mb-1.5 leading-none tracking-wide">{title}</p>
        <p className="text-white/80 text-sm leading-relaxed whitespace-normal font-medium">{desc}</p>
        <div className="absolute -bottom-[8px] left-1/2 -translate-x-1/2 w-4 h-4 bg-[#1c2326] rotate-45" />
    </div>
);

const PurposeSection = () => {
    const sectionRef = useRef(null);
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const activePixels = useRef(new Map());
    const isRunning = useRef(false);
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

    const drawLoop = useCallback(() => {
        if (!isRunning.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const now = performance.now();
        let hasActive = false;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const [key, px] of activePixels.current) {
            const t = (now - px.born) / px.life;
            if (t >= 1) { activePixels.current.delete(key); continue; }
            hasActive = true;
            const alpha = t < 0.25 ? t / 0.25 : t > 0.65 ? 1 - (t - 0.65) / 0.35 : 1;
            ctx.globalAlpha = alpha * 0.7;
            ctx.fillStyle = px.color;
            ctx.fillRect(px.col * GRID_SIZE, px.row * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        }

        ctx.globalAlpha = 1;
        if (hasActive || isRunning.current) rafRef.current = requestAnimationFrame(drawLoop);
    }, []);

    const handleMouseMove = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const col = Math.floor((e.clientX - rect.left) / GRID_SIZE);
        const row = Math.floor((e.clientY - rect.top) / GRID_SIZE);

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (Math.random() > 0.45) continue;
                const key = `${col + dc}_${row + dr}_${Math.floor(performance.now() / 80)}`;
                if (activePixels.current.has(key)) continue;
                activePixels.current.set(key, {
                    col: col + dc, row: row + dr,
                    color: GREEN_PIXELS[Math.floor(Math.random() * GREEN_PIXELS.length)],
                    born: performance.now(),
                    life: 500 + Math.random() * 400,
                });
            }
        }
    }, []);

    const handleMouseEnter = useCallback(() => {
        isRunning.current = true;
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(drawLoop);
    }, [drawLoop]);

    const handleMouseLeave = useCallback(() => {
        isRunning.current = false;
        cancelAnimationFrame(rafRef.current);
        const canvas = canvasRef.current;
        if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        activePixels.current.clear();
    }, []);

    const handleCanvasResize = useCallback((node) => {
        if (!node) return;
        canvasRef.current = node;
        const ro = new ResizeObserver(() => { node.width = node.offsetWidth; node.height = node.offsetHeight; });
        ro.observe(node);
    }, []);

    return (
        <section
            ref={sectionRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative w-full min-h-screen bg-[url('/background/1001.webp')] bg-cover bg-center bg-no-repeat px-6 py-16 md:px-16 flex flex-col items-center justify-center overflow-hidden"
        >
            <canvas ref={handleCanvasResize} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />

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
                <h2 className="font-['Mistral',_cursive] text-6xl md:text-8xl text-[#1c2326] mb-6 flex flex-wrap justify-center gap-x-5 py-2 [perspective:800px]">
                    {titleWords.map((word, i) => (
                        <span key={i} className="purpose-word inline-block pointer-events-none opacity-0">
                            {word}
                        </span>
                    ))}
                </h2>
                <div className="purpose-line w-24 h-[3px] bg-[#3db53d] mb-10 opacity-0" />
                <p className="text-[clamp(1.5rem,3.5vw,3.5rem)] leading-[1.2] text-[#1c2326] font-medium max-w-5xl flex flex-wrap justify-center gap-x-3 py-2 [perspective:600px]">
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
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const activePixels = useRef(new Map());
    const isRunning = useRef(false);

    const titleWords = 'Explore Habitats'.split(' ');
    const bodyWords = 'Animals are grouped into environments that reflect their natural ecosystems. Each habitat is designed to support natural behavior, from dense forest settings to open grasslands.'.split(' ');

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.explore-text-content',
                { scale: 0.5, opacity: 0, letterSpacing: '10px' },
                {
                    scale: 1, opacity: 1, letterSpacing: 'normal', ease: 'power2.out',
                    scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', end: 'center center', scrub: 1 }
                }
            );

            gsap.fromTo('.explore-bg',
                { scale: 0.5, borderRadius: '50%' },
                {
                    scale: 1, borderRadius: '0%', ease: 'power2.inOut',
                    scrollTrigger: { trigger: sectionRef.current, start: 'top bottom', end: 'center center', scrub: 1 }
                }
            );

        }, sectionRef);

        return () => ctx.revert();
    }, []);

    const drawLoop = useCallback(() => {
        if (!isRunning.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const now = performance.now();
        let hasActive = false;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const [key, px] of activePixels.current) {
            const t = (now - px.born) / px.life;
            if (t >= 1) { activePixels.current.delete(key); continue; }
            hasActive = true;
            const alpha = t < 0.25 ? t / 0.25 : t > 0.65 ? 1 - (t - 0.65) / 0.35 : 1;
            ctx.globalAlpha = alpha * 0.5;
            ctx.fillStyle = px.color;
            ctx.fillRect(px.col * GRID_SIZE, px.row * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        }

        ctx.globalAlpha = 1;
        if (hasActive || isRunning.current) rafRef.current = requestAnimationFrame(drawLoop);
    }, []);

    const handleMouseMove = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const col = Math.floor((e.clientX - rect.left) / GRID_SIZE);
        const row = Math.floor((e.clientY - rect.top) / GRID_SIZE);

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (Math.random() > 0.45) continue;
                const key = `${col + dc}_${row + dr}_${Math.floor(performance.now() / 80)}`;
                if (activePixels.current.has(key)) continue;
                activePixels.current.set(key, {
                    col: col + dc,
                    row: row + dr,
                    color: WHITE_PIXELS[Math.floor(Math.random() * WHITE_PIXELS.length)],
                    born: performance.now(),
                    life: 500 + Math.random() * 400,
                });
            }
        }
    }, []);

    const handleMouseEnter = useCallback(() => {
        isRunning.current = true;
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(drawLoop);
    }, [drawLoop]);

    const handleMouseLeave = useCallback(() => {
        isRunning.current = false;
        cancelAnimationFrame(rafRef.current);
        const canvas = canvasRef.current;
        if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        activePixels.current.clear();
    }, []);

    const handleCanvasResize = useCallback((node) => {
        if (!node) return;
        canvasRef.current = node;
        const ro = new ResizeObserver(() => { node.width = node.offsetWidth; node.height = node.offsetHeight; });
        ro.observe(node);
    }, []);

    return (
        <section
            ref={sectionRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative w-full min-h-screen px-6 py-16 md:px-16 flex flex-col items-center justify-center overflow-hidden bg-[url('/background/1001.webp')] bg-cover bg-center bg-no-repeat"
        >
            <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
                <div className="explore-bg w-full h-full bg-[url('/background/1002.gif')] bg-cover bg-center bg-no-repeat origin-center" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#212631]/80 via-transparent to-transparent" />
            </div>

            <canvas ref={handleCanvasResize} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />

            <div className="explore-text-content relative z-10 w-full max-w-[1500px] mx-auto flex flex-col items-center justify-center text-center opacity-0">
                <h2 className="font-['Mistral',_cursive] text-6xl md:text-8xl text-white mb-8 flex flex-wrap justify-center gap-x-5 py-2">
                    {titleWords.map((word, i) => (
                        <span key={i} className="inline-block pointer-events-none">{word}</span>
                    ))}
                </h2>
                <p className="text-[clamp(2rem,4vw,5.5rem)] leading-[1.15] text-white font-extrabold tracking-tight flex flex-wrap justify-center gap-x-3 py-2">
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
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const activePixels = useRef(new Map());
    const isRunning = useRef(false);

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

            gsap.fromTo('.featured-cta',
                { opacity: 0, y: 40 },
                {
                    opacity: 1, y: 0, duration: 1, delay: 0.3, ease: 'power2.out',
                    scrollTrigger: { trigger: '.featured-grid', start: 'top 70%' }
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

    const drawLoop = useCallback(() => {
        if (!isRunning.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const now = performance.now();
        let hasActive = false;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const [key, px] of activePixels.current) {
            const t = (now - px.born) / px.life;
            if (t >= 1) {
                activePixels.current.delete(key);
                continue;
            }
            hasActive = true;
            const alpha = t < 0.25 ? t / 0.25 : t > 0.65 ? 1 - (t - 0.65) / 0.35 : 1;
            ctx.globalAlpha = alpha * 0.7;
            ctx.fillStyle = px.color;
            ctx.fillRect(px.col * GRID_SIZE, px.row * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        }

        ctx.globalAlpha = 1;
        if (hasActive || isRunning.current) {
            rafRef.current = requestAnimationFrame(drawLoop);
        }
    }, []);

    const handleMouseMove = useCallback((e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const col = Math.floor((e.clientX - rect.left) / GRID_SIZE);
        const row = Math.floor((e.clientY - rect.top) / GRID_SIZE);

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (Math.random() > 0.45) continue;
                const key = `${col + dc}_${row + dr}_${Math.floor(performance.now() / 80)}`;
                if (activePixels.current.has(key)) continue;
                activePixels.current.set(key, {
                    col: col + dc,
                    row: row + dr,
                    color: GREEN_PIXELS[Math.floor(Math.random() * GREEN_PIXELS.length)],
                    born: performance.now(),
                    life: 500 + Math.random() * 400,
                });
            }
        }
    }, []);

    const handleMouseEnter = useCallback(() => {
        isRunning.current = true;
        cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(drawLoop);
    }, [drawLoop]);

    const handleMouseLeave = useCallback(() => {
        isRunning.current = false;
        cancelAnimationFrame(rafRef.current);
        const canvas = canvasRef.current;
        if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        activePixels.current.clear();
    }, []);

    const handleCanvasResize = useCallback((node) => {
        if (!node) return;
        canvasRef.current = node;
        const ro = new ResizeObserver(() => {
            node.width = node.offsetWidth;
            node.height = node.offsetHeight;
        });
        ro.observe(node);
    }, []);

    return (
        <section
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[url('/background/1003.webp')] bg-cover bg-center bg-no-repeat text-[#212631] [perspective:1000px]"
        >
            <div className="absolute inset-0 bg-gradient-to-b from-[#26bc61]/20 to-transparent pointer-events-none" />
            <canvas ref={handleCanvasResize} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />

            <div className="featured-text-wrap relative z-10 flex flex-col items-center justify-center w-full max-w-7xl mx-auto [transform-style:preserve-3d]">

                <img
                    src="/pixels/pixeldeer.png"
                    alt=""
                    className="featured-drag-1 featured-drag-item absolute -top-12 -right-12 md:-top-24 md:-right-32 w-36 h-36 md:w-60 md:h-60 cursor-grab z-20 drop-shadow-2xl object-contain pointer-events-auto opacity-0"
                />

                <div className="featured-text relative flex flex-col font-black text-[clamp(4.5rem,13vw,14rem)] leading-[0.85] tracking-tighter uppercase pointer-events-none select-none text-center mix-blend-multiply py-4">
                    <span className="block origin-center opacity-0">BULUSAN</span>
                    <span className="block origin-center text-[#1c2326]/80 opacity-0">FEATURED</span>
                </div>

                <img
                    src="/pixels/pixelmon.png"
                    alt=""
                    className="featured-drag-2 featured-drag-item absolute -bottom-10 -left-10 md:-bottom-20 md:-left-24 w-32 h-32 md:w-52 md:h-52 cursor-grab z-20 drop-shadow-2xl object-contain pointer-events-auto opacity-0"
                />

                <div className="featured-content mt-10 md:mt-16 relative z-10 w-full max-w-5xl px-8">
                    <p className="featured-subtext text-center text-md md:text-xl tracking-wide text-[#1c2326]/70 max-w-7xl mx-auto opacity-0">
                        Explore curated wildlife highlights, immersive habitats, and interactive experiences designed for deeper engagement.
                    </p>

                    <div className="featured-grid mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="featured-card opacity-0 p-6 rounded-2xl bg-white/40 backdrop-blur-md border border-white/30 shadow-xl">
                            <h3 className="text-lg font-semibold mb-2">AI Zusan Assistant</h3>
                            <p className="text-sm text-[#1c2326]/70">
                                Your personal guide for real-time insights and interactive learning.
                            </p>
                        </div>

                        <div className="featured-card opacity-0 p-6 rounded-2xl bg-white/40 backdrop-blur-md border border-white/30 shadow-xl">
                            <h3 className="text-lg font-semibold mb-2">Mini Zoo Game</h3>
                            <p className="text-sm text-[#1c2326]/70">
                                Design and manage your own virtual zoo with real animal data and behaviors.
                            </p>
                        </div>

                        <div className="featured-card opacity-0 p-6 rounded-2xl bg-white/40 backdrop-blur-md border border-white/30 shadow-xl">
                            <h3 className="text-lg font-semibold mb-2">Conservation Initiatives</h3>
                            <p className="text-sm text-[#1c2326]/70">
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
            <div className="relative min-h-screen bg-[#26bc61]">
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