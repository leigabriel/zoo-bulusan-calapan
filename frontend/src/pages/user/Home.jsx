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
        <div ref={containerRef} className="relative w-full min-h-[100dvh] overflow-hidden bg-white">
            <section className="relative w-full min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
                <div className="hero-bg-parallax absolute inset-0 bg-white -z-10 origin-bottom" />

                <div className="hero-images absolute inset-0 z-0 flex items-center justify-center overflow-hidden pointer-events-none">
                    <img
                        src="/pixels/pixeldeer.png"
                        alt="Rabbit"
                        className="hero-drag-item absolute w-15 sm:w-24 md:w-36 lg:w-46 left-[5%] sm:left-[10%] md:left-[18%] top-[55%] sm:top-[70%] md:top-[40%] -rotate-12 pointer-events-auto cursor-grab active:cursor-grabbing"
                    />
                    <img
                        src="/pixels/pixelrab.png"
                        alt="Turtle"
                        className="hero-drag-item absolute w-20 sm:w-24 md:w-36 lg:w-56 right-[5%] sm:right-[10%] md:right-[18%] top-[57%] sm:top-[70%] md:top-[45%] rotate-12 pointer-events-auto cursor-grab active:cursor-grabbing"
                    />
                </div>

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

// const Tooltip = ({ title, desc }) => (
//     <div className="absolute bottom-[calc(100%+20px)] left-1/2 -translate-x-1/2 z-[999] whitespace-nowrap w-48 sm:w-56 bg-black px-4 sm:px-5 py-3 sm:py-4 rounded-2xl shadow-2xl pointer-events-none tooltip-anim opacity-0 scale-95 origin-bottom">
//         <p className="font-['Mistral',_cursive] text-[#5dcd5a] text-xl sm:text-2xl mb-1 sm:mb-1.5 leading-none tracking-wide">{title}</p>
//         <p className="text-white/80 text-xs sm:text-sm leading-relaxed whitespace-normal font-medium">{desc}</p>
//         <div className="absolute -bottom-[6px] sm:-bottom-[8px] left-1/2 -translate-x-1/2 w-3 sm:w-4 h-3 sm:h-4 bg-black rotate-45" />
//     </div>
// );

// const PurposeSection = () => {
//     const sectionRef = useRef(null);
//     const [hoveredId, setHoveredId] = useState(null);

//     const titleWords = 'Our Purpose'.split(' ');
//     const bodyWords = 'This zoo exists to protect wildlife, preserve biodiversity, and provide a safe environment for animals under human care.'.split(' ');

//     const animals = [
//         { id: 'rescue', src: '/pixels/pixeldeer.png', posClass: 'left-[2%] sm:left-[5%] top-[10%] sm:top-[12%] md:left-[9%] md:top-[16%]', rotate: -5, speed: -100, tooltip: { title: 'Rescue', desc: 'Emergency medical intervention for local species.' } },
//         { id: 'habitat', src: '/pixels/pixelhor.png', posClass: 'right-[2%] sm:right-[5%] top-[4%] sm:top-[6%] md:right-[10%] md:top-[11%]', rotate: 7, speed: 150, tooltip: { title: 'Habitat', desc: 'Preservation of native flora and nesting grounds.' } },
//         { id: 'sanctuary', src: '/pixels/pixelrab.png', posClass: 'left-[5%] sm:left-[8%] bottom-[8%] sm:bottom-[10%] md:left-[14%] md:bottom-[14%]', rotate: -8, speed: -120, tooltip: { title: 'Sanctuary', desc: 'Safe haven for animals unable to return to the wild.' } },
//         { id: 'education', src: '/pixels/pixelmon.png', posClass: 'right-[4%] sm:right-[7%] bottom-[10%] sm:bottom-[14%] md:right-[16%] md:bottom-[18%]', rotate: 5, speed: 180, tooltip: { title: 'Education', desc: 'Building awareness for the next generation.' } },
//     ];

//     useLayoutEffect(() => {
//         const ctx = gsap.context(() => {
//             gsap.fromTo('.purpose-word',
//                 { opacity: 0, rotationX: -90, transformOrigin: '50% 50% -50' },
//                 {
//                     opacity: 1, rotationX: 0, duration: 1, ease: 'back.out(1.5)', stagger: 0.05,
//                     scrollTrigger: { trigger: sectionRef.current, start: 'top 75%', toggleActions: 'play reverse play reverse' }
//                 }
//             );

//             gsap.fromTo('.purpose-line',
//                 { scaleX: 0, transformOrigin: 'center' },
//                 { scaleX: 1, duration: 1, ease: 'power3.inOut', scrollTrigger: { trigger: sectionRef.current, start: 'top 65%', toggleActions: 'play reverse play reverse' } }
//             );

//             gsap.fromTo('.purpose-body-word',
//                 { opacity: 0, y: 30, rotationY: 45 },
//                 {
//                     opacity: 1, y: 0, rotationY: 0, duration: 0.8, ease: 'power2.out', stagger: 0.015,
//                     scrollTrigger: { trigger: sectionRef.current, start: 'top 60%', toggleActions: 'play reverse play reverse' }
//                 }
//             );

//             animals.forEach((a, i) => {
//                 const isLeft = a.posClass.includes('left');
//                 gsap.fromTo(`.animal-${i}`,
//                     { opacity: 0, x: isLeft ? '-100vw' : '100vw', rotation: isLeft ? -90 : 90 },
//                     {
//                         opacity: 1, x: 0, rotation: a.rotate, ease: 'power3.out',
//                         scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', end: 'center center', scrub: 1 }
//                     }
//                 );

//                 gsap.to(`.animal-${i}`, {
//                     yPercent: a.speed, ease: 'none',
//                     scrollTrigger: { trigger: sectionRef.current, start: 'top bottom', end: 'bottom top', scrub: true }
//                 });

//                 Draggable.create(`.animal-${i}`, {
//                     type: 'x,y', bounds: sectionRef.current, edgeResistance: 0.8,
//                     onDragStart: function () { gsap.to(this.target, { scale: 1.15, duration: 0.4, ease: 'power3.out' }); },
//                     onDragEnd: function () { gsap.to(this.target, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)' }); }
//                 });
//             });

//         }, sectionRef);

//         return () => ctx.revert();
//     }, []);

//     useEffect(() => {
//         if (hoveredId) {
//             gsap.to('.tooltip-anim', { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.5)', overwrite: true });
//         }
//     }, [hoveredId]);

//     return (
//         <section
//             ref={sectionRef}
//             className="relative w-full min-h-[100dvh] bg-white px-4 sm:px-6 py-12 sm:py-16 md:px-16 flex flex-col items-center justify-center overflow-hidden"
//         >
//             {animals.map((a, i) => (
//                 <div key={a.id} className={`animal-${i} absolute z-[5] overflow-visible ${a.posClass}`}>
//                     <div
//                         onMouseEnter={() => setHoveredId(a.id)}
//                         onMouseLeave={() => { setHoveredId(null); gsap.to('.tooltip-anim', { opacity: 0, scale: 0.9, duration: 0.2, overwrite: true }); }}
//                         className="cursor-grab active:cursor-grabbing relative"
//                     >
//                         <div className="transition-all duration-500 hover:drop-shadow-[0_0_25px_rgba(93,205,90,0.6)] drop-shadow-[0_8px_20px_rgba(0,0,0,0.15)]">
//                             <img src={a.src} alt={a.id} className="w-16 sm:w-24 md:w-44 lg:w-52 h-auto pointer-events-none select-none" />
//                         </div>
//                         {hoveredId === a.id && <Tooltip title={a.tooltip.title} desc={a.tooltip.desc} />}
//                     </div>
//                 </div>
//             ))}

//             <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center justify-center text-center">
//                 <h2 className="font-['Mistral',_cursive] text-4xl sm:text-6xl md:text-8xl text-black mb-4 sm:mb-6 flex flex-wrap justify-center gap-x-3 sm:gap-x-5 py-2 [perspective:800px]">
//                     {titleWords.map((word, i) => (
//                         <span key={i} className="purpose-word inline-block pointer-events-none opacity-0">
//                             {word}
//                         </span>
//                     ))}
//                 </h2>
//                 <div className="purpose-line w-16 sm:w-24 h-[2px] sm:h-[3px] bg-[#3db53d] mb-6 sm:mb-10 opacity-0" />
//                 <p className="text-[clamp(1.2rem,3.5vw,3.5rem)] leading-[1.3] md:leading-[1.2] text-black font-medium max-w-5xl flex flex-wrap justify-center gap-x-2 sm:gap-x-3 py-2 [perspective:600px]">
//                     {bodyWords.map((word, i) => (
//                         <span key={i} className="purpose-body-word inline-block pointer-events-none opacity-0">
//                             {word}
//                         </span>
//                     ))}
//                 </p>
//             </div>
//         </section>
//     );
// };

const ExploreSection = () => {
    const sectionRef = useRef(null);

    const paragraphs = [
        "Bulusan Zoo Nature Park in Calapan City is a vibrant sanctuary for wildlife enthusiasts who value nature and build with intent. It is more than a destination it is where bold ideas turn into living habitats, powered by conservation and care.",
        "We believe great preservation starts with clarity and expression. That is why Bulusan is built to amplify your interactive experience. From the first step to the final view, it is a space where storytelling takes shape and your vision for nature comes to life."
    ];

    const keywords = ['vibrant', 'living', 'clarity', 'expression', 'shape', 'intuitive', 'storytelling', 'interactive', 'vision'];
    const wordHighlightBgColor = '60, 60, 60';

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const containers = document.querySelectorAll('.anime-text-container-explore');
            containers.forEach(container => {
                ScrollTrigger.create({
                    trigger: container,
                    pin: container,
                    start: 'top top',
                    end: `+=${window.innerHeight * 4}`,
                    pinSpacing: true,
                    onUpdate: self => {
                        const progress = self.progress;
                        const words = Array.from(container.querySelectorAll('.word'));
                        const totalWords = words.length;

                        words.forEach((word, index) => {
                            const wordText = word.querySelector('span');
                            if (!wordText) return;

                            if (progress <= 0.7) {
                                const revealProgress = progress / 0.7;
                                const overlapWords = 15;
                                const wordStart = index / totalWords;
                                const wordEnd = wordStart + overlapWords / totalWords;

                                let wordProgress = 0;
                                if (revealProgress <= wordStart) wordProgress = 0;
                                else if (revealProgress >= wordEnd) wordProgress = 1;
                                else wordProgress = (revealProgress - wordStart) / (wordEnd - wordStart);

                                word.style.opacity = wordProgress;
                                const bgOpacity = wordProgress >= 0.9 ? 1 - (wordProgress - 0.9) / 0.1 : 1;
                                word.style.backgroundColor = `rgba(${wordHighlightBgColor}, ${bgOpacity})`;

                                const textProgress = wordProgress >= 0.9 ? (wordProgress - 0.9) / 0.1 : 0;
                                wordText.style.opacity = textProgress;
                            } else {
                                const reverseProgress = (progress - 0.7) / 0.3;
                                const reverseOverlap = 5;
                                const wordStart = index / totalWords;
                                const wordEnd = wordStart + reverseOverlap / totalWords;

                                let wordProgress = 0;
                                if (reverseProgress <= wordStart) wordProgress = 0;
                                else if (reverseProgress >= wordEnd) wordProgress = 1;
                                else wordProgress = (reverseProgress - wordStart) / (wordEnd - wordStart);

                                wordText.style.opacity = 1 - wordProgress;
                                word.style.backgroundColor = `rgba(${wordHighlightBgColor}, ${wordProgress})`;
                            }
                        });
                    }
                });
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    const renderWords = (text) => {
        const words = text.split(/\s+/);
        return words.map((word, i) => {
            if (!word.trim()) return null;
            const normalizedWord = word.toLowerCase().replace(/[.,!?;:"]/g, '');
            const isKeyword = keywords.includes(normalizedWord);

            return (
                <div
                    key={i}
                    className={`word inline-block relative mr-1 mb-1 px-1 sm:px-2 py-0.5 sm:py-1 rounded-3xl will-change-[background-color,opacity] opacity-0 ${isKeyword ? 'keyword-wrapper !m-[0_0.2rem_0.1rem_0.1rem] sm:!m-[0_0.4rem_0.2rem_0.2rem]' : ''}`}
                >
                    <span
                        className={`relative opacity-0 ${isKeyword ? `keyword ${normalizedWord} rounded-3xl inline-block w-full h-full py-0 sm:py-0.5 text-[#000] z-10` : 'text-'}`}
                    >
                        {word}
                        {isKeyword && (
                            <span className={`absolute invert top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%+0.5rem)] sm:w-[calc(100%+1rem)] h-[calc(100%+0.2rem)] sm:h-[calc(100%+0.4rem)] rounded-3xl -z-10 ${['vibrant', 'shape', 'interactive'].includes(normalizedWord) ? 'bg-[#7a78ff]' :
                                ['living', 'expression', 'storytelling'].includes(normalizedWord) ? 'bg-[#fe6d38]' :
                                    ['clarity', 'intuitive', 'vision'].includes(normalizedWord) ? 'bg-[#c6fe69]' : 'bg-white'
                                }`}></span>
                        )}
                    </span>
                </div>
            );
        });
    };

    return (
        <section ref={sectionRef} className="invert anime-text-container-explore relative w-full h-[100dvh] p-4 sm:p-8 overflow-hidden bg-[#000]">
            <div className="copy-container w-full h-full flex justify-center items-center text-center rounded-2xl sm:rounded-3xl border-2 border-dashed border-[rgb(60,60,60)] px-4">
                <div className="anime-text w-[95%] sm:w-[90%] md:w-[70%]">
                    {paragraphs.map((p, idx) => (
                        <p key={idx} className="text-center mb-6 sm:mb-8 text-[1.25rem] sm:text-2xl md:text-4xl font-black leading-tight sm:leading-tight text-white">
                            {renderWords(p)}
                        </p>
                    ))}
                </div>
            </div>
        </section>
    );
};

const PromoHeroSection = () => (
    <section className="relative w-full h-[100svh] p-4 sm:p-8 overflow-hidden bg-[#fff]">
        <div className="w-full h-full flex justify-center items-center text-center rounded-[1.5rem] sm:rounded-[2rem] bg-[#fe6d38] px-4">
            <h1 className="w-full sm:w-[90%] md:w-[70%] text-[#000] text-3xl sm:text-[2rem] md:text-[5rem] font-black leading-[1.1] md:leading-[1]">
                Playground for wild ideas and natural habitats.
            </h1>
        </div>
    </section>
);

const FeaturesSection = () => {
    const sectionRef = useRef(null);

    const paragraphs = [
        "Bulusan brings nature, structure, and clarity together in one intuitive space. Engage with our AI Assistant, manage virtual habitats, and explore rich storytelling visuals. All for a vibrant and living ecosystem.",
        "With built-in support for interactive features, our conservation initiatives let you build with expression. It is the fastest way to bring your creative vision to life and shape a sustainable future."
    ];

    const keywords = ['vibrant', 'living', 'clarity', 'expression', 'shape', 'intuitive', 'storytelling', 'interactive', 'vision'];
    const wordHighlightBgColor = '60, 60, 60';

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const containers = document.querySelectorAll('.anime-text-container-featured');
            containers.forEach(container => {
                ScrollTrigger.create({
                    trigger: container,
                    pin: container,
                    start: 'top top',
                    end: `+=${window.innerHeight * 4}`,
                    pinSpacing: true,
                    onUpdate: self => {
                        const progress = self.progress;
                        const words = Array.from(container.querySelectorAll('.word'));
                        const totalWords = words.length;

                        words.forEach((word, index) => {
                            const wordText = word.querySelector('span');
                            if (!wordText) return;

                            if (progress <= 0.7) {
                                const revealProgress = progress / 0.7;
                                const overlapWords = 15;
                                const wordStart = index / totalWords;
                                const wordEnd = wordStart + overlapWords / totalWords;

                                let wordProgress = 0;
                                if (revealProgress <= wordStart) wordProgress = 0;
                                else if (revealProgress >= wordEnd) wordProgress = 1;
                                else wordProgress = (revealProgress - wordStart) / (wordEnd - wordStart);

                                word.style.opacity = wordProgress;
                                const bgOpacity = wordProgress >= 0.9 ? 1 - (wordProgress - 0.9) / 0.1 : 1;
                                word.style.backgroundColor = `rgba(${wordHighlightBgColor}, ${bgOpacity})`;

                                const textProgress = wordProgress >= 0.9 ? (wordProgress - 0.9) / 0.1 : 0;
                                wordText.style.opacity = textProgress;
                            } else {
                                const reverseProgress = (progress - 0.7) / 0.3;
                                const reverseOverlap = 5;
                                const wordStart = index / totalWords;
                                const wordEnd = wordStart + reverseOverlap / totalWords;

                                let wordProgress = 0;
                                if (reverseProgress <= wordStart) wordProgress = 0;
                                else if (reverseProgress >= wordEnd) wordProgress = 1;
                                else wordProgress = (reverseProgress - wordStart) / (wordEnd - wordStart);

                                wordText.style.opacity = 1 - wordProgress;
                                word.style.backgroundColor = `rgba(${wordHighlightBgColor}, ${wordProgress})`;
                            }
                        });
                    }
                });
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    const renderWords = (text) => {
        const words = text.split(/\s+/);
        return words.map((word, i) => {
            if (!word.trim()) return null;
            const normalizedWord = word.toLowerCase().replace(/[.,!?;:"]/g, '');
            const isKeyword = keywords.includes(normalizedWord);

            return (
                <div
                    key={i}
                    className={`word inline-block relative mr-1 mb-1 px-1 sm:px-2 py-0.5 sm:py-1 rounded-3xl will-change-[background-color,opacity] opacity-0 ${isKeyword ? 'keyword-wrapper !m-[0_0.2rem_0.1rem_0.1rem] sm:!m-[0_0.4rem_0.2rem_0.2rem]' : ''}`}
                >
                    <span
                        className={`relative opacity-0 ${isKeyword ? `keyword ${normalizedWord} rounded-3xl inline-block w-full h-full py-0 sm:py-0.5 text-[#000] z-10` : 'text-'}`}
                    >
                        {word}
                        {isKeyword && (
                            <span className={`absolute invert top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%+0.5rem)] sm:w-[calc(100%+1rem)] h-[calc(100%+0.2rem)] sm:h-[calc(100%+0.4rem)] rounded-3xl -z-10 ${['vibrant', 'shape', 'interactive'].includes(normalizedWord) ? 'bg-[#7a78ff]' :
                                ['living', 'expression', 'storytelling'].includes(normalizedWord) ? 'bg-[#fe6d38]' :
                                    ['clarity', 'intuitive', 'vision'].includes(normalizedWord) ? 'bg-[#c6fe69]' : 'bg-white'
                                }`}></span>
                        )}
                    </span>
                </div>
            );
        });
    };

    return (
        <section ref={sectionRef} className="anime-text-container-featured invert relative w-full h-[100dvh] p-4 sm:p-8 overflow-hidden bg-[#000]">
            <div className="copy-container w-full h-full flex justify-center items-center text-center rounded-2xl sm:rounded-3xl border-2 border-dashed border-[rgb(60,60,60)] px-4">
                <div className="anime-text w-[95%] sm:w-[90%] md:w-[70%]">
                    {paragraphs.map((p, idx) => (
                        <p key={idx} className="text-center mb-6 sm:mb-8 text-[1.25rem] sm:text-2xl md:text-4xl font-black leading-tight sm:leading-tight text-white">
                            {renderWords(p)}
                        </p>
                    ))}
                </div>
            </div>
        </section>
    );
};

const CTASection = () => (
    <section className="relative w-full h-[100svh] p-4 sm:p-8 overflow-hidden bg-[#fff]">
        <div className="w-full h-full flex justify-center items-center text-center rounded-[1.5rem] sm:rounded-[2rem] bg-[#c6fe69] px-4">
            <h1 className="w-full sm:w-[90%] md:w-[70%] text-[#000] text-3xl sm:text-[2rem] md:text-[5rem] font-black leading-[1.1] md:leading-[1]">
                Join Bulusan Zoo now to explore interactive habitats.
            </h1>
        </div>
    </section>
);

const PricingSection = () => {
    const workRef = useRef(null);
    const gridCanvasRef = useRef(null);
    const lettersCanvasRef = useRef(null);
    const textContainerRef = useRef(null);
    const cardsRef = useRef(null);
    const stProgressRef = useRef(0);

    const cards = [
        {
            label: 'Adult Ticket Entry',
            price: '₱40',
            color: '#ebebeb',
            textColor: '#111111',
            borderColor: '#e5e5e5',
            features: ['Ages 18-60', 'All Exhibits', 'Weekend Entry'],
        },
        {
            label: 'Child Ticket Entry',
            price: '₱20',
            color: '#c6fe69',
            textColor: '#111111',
            borderColor: '#e5e5e5',
            features: ['Ages 5–17', 'All Exhibits', 'Weekend Entry'],
        },
        {
            label: 'Free Ticket for Bulusan Residents',
            price: '₱0',
            color: '#111111',
            textColor: '#ffffff',
            borderColor: '#111111',
            features: ['All Ages', 'Valid ID Required', 'All Exhibits'],
        },
    ];

    const isMobile = () => window.innerWidth < 768;

    const getCardW = () => isMobile() ? window.innerWidth * 0.72 : window.innerWidth * 0.30;
    const getCardGap = () => isMobile() ? window.innerWidth * 0.08 : window.innerWidth * 0.05;
    const getMoveDistance = () => {
        const cw = getCardW();
        const gap = getCardGap();
        return window.innerWidth + cards.length * (cw + gap) + gap;
    };

    const moveDistanceRef = useRef(getMoveDistance());

    useLayoutEffect(() => {
        const work = workRef.current;
        const gridCanvas = gridCanvasRef.current;
        const textContainer = textContainerRef.current;
        const cardsContainer = cardsRef.current;
        if (!work || !gridCanvas || !textContainer || !cardsContainer) return;

        const gridCtx = gridCanvas.getContext('2d');
        const lerp = (s, e, t) => s + (e - s) * t;
        let currentXPosition = 0;

        const resizeGridCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            gridCanvas.width = window.innerWidth * dpr;
            gridCanvas.height = window.innerHeight * dpr;
            gridCanvas.style.width = `${window.innerWidth}px`;
            gridCanvas.style.height = `${window.innerHeight}px`;
            gridCtx.scale(dpr, dpr);
        };
        resizeGridCanvas();

        const drawGrid = (progress = 0) => {
            gridCtx.fillStyle = '#f7f7f7';
            gridCtx.fillRect(0, 0, gridCanvas.width, gridCanvas.height);
            gridCtx.fillStyle = '#d1d1d1';
            const dotSize = 1;
            const spacing = isMobile() ? 20 : 30;
            const rows = Math.ceil(window.innerHeight / spacing);
            const cols = Math.ceil(window.innerWidth / spacing) + 15;
            const offset = (progress * spacing * 10) % spacing;

            for (let y = 0; y < rows; y++) {
                for (let x = 0; x < cols; x++) {
                    gridCtx.beginPath();
                    gridCtx.arc(x * spacing - offset, y * spacing, dotSize, 0, Math.PI * 2);
                    gridCtx.fill();
                }
            }
        };

        const lettersScene = new THREE.Scene();
        const lettersCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        lettersCamera.position.z = 20;
        const lettersRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas: lettersCanvasRef.current });
        lettersRenderer.setSize(window.innerWidth, window.innerHeight);
        lettersRenderer.setClearColor(0x000000, 0);
        lettersRenderer.setPixelRatio(window.devicePixelRatio);

        const createPath = (yPos, amplitude) => {
            const points = Array.from({ length: 21 }, (_, i) => {
                const t = i / 20;
                return new THREE.Vector3(
                    -25 + 50 * t,
                    yPos + Math.sin(t * Math.PI) * -amplitude,
                    (1 - Math.pow(Math.abs(t - 0.5) * 2, 2)) * -5
                );
            });
            const curve = new THREE.CatmullRomCurve3(points);
            const line = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(curve.getPoints(100)),
                new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 })
            );
            line.curve = curve;
            return line;
        };

        const paths = [
            createPath(10, 2),
            createPath(3.5, 1),
            createPath(-3.5, -1),
            createPath(-10, -2),
        ];
        paths.forEach(l => lettersScene.add(l));

        const letterPositions = new Map();
        const lineSpeedMultipliers = [0.8, 1, 0.7, 0.9];

        const updateLetterSize = () => {
            const fs = isMobile() ? 'clamp(3rem, 20vw, 7rem)' : 'clamp(5rem, 12vw, 14rem)';
            textContainer.querySelectorAll('.pricing-letter').forEach(el => {
                el.style.fontSize = fs;
            });
        };

        paths.forEach((line, i) => {
            line.letterElements = Array.from({ length: 15 }, () => {
                const el = document.createElement('div');
                el.className = 'pricing-letter';
                el.textContent = ['P', 'R', 'I', 'C'][i];
                textContainer.appendChild(el);
                letterPositions.set(el, { current: { x: 0, y: 0 }, target: { x: 0, y: 0 } });
                return el;
            });
        });
        updateLetterSize();

        const updateTargetPositions = (progress = 0) => {
            paths.forEach((line, li) => {
                line.letterElements.forEach((el, i) => {
                    const point = line.curve.getPoint((i / 14 + progress * lineSpeedMultipliers[li]) % 1);
                    const vec = point.clone().project(lettersCamera);
                    const pos = letterPositions.get(el);
                    pos.target = {
                        x: (-vec.x * 0.5 + 0.5) * window.innerWidth,
                        y: (-vec.y * 0.5 + 0.5) * window.innerHeight,
                    };
                });
            });
        };

        const updateLetterPositions = () => {
            letterPositions.forEach((pos, el) => {
                const dx = pos.target.x - pos.current.x;
                if (Math.abs(dx) > window.innerWidth * 0.7) {
                    pos.current.x = pos.target.x;
                    pos.current.y = pos.target.y;
                } else {
                    pos.current.x = lerp(pos.current.x, pos.target.x, 0.07);
                    pos.current.y = lerp(pos.current.y, pos.target.y, 0.07);
                }
                el.style.transform = `translate(-50%, -50%) translate3d(${pos.current.x}px, ${pos.current.y}px, 0px)`;
            });
        };

        const updateCardsPosition = () => {
            const targetX = -moveDistanceRef.current * stProgressRef.current;
            currentXPosition = lerp(currentXPosition, targetX, 0.07);
            gsap.set(cardsContainer, { x: currentXPosition });
        };

        let rafId;
        const tick = () => {
            updateLetterPositions();
            updateCardsPosition();
            lettersRenderer.render(lettersScene, lettersCamera);
            rafId = requestAnimationFrame(tick);
        };

        const st = ScrollTrigger.create({
            trigger: work,
            start: 'top top',
            end: '+=700%',
            pin: true,
            pinSpacing: true,
            scrub: 1,
            onUpdate: self => {
                stProgressRef.current = self.progress;
                updateTargetPositions(self.progress);
                drawGrid(self.progress);
            },
        });

        drawGrid(0);
        updateTargetPositions(0); // Calculate initial targets

        // FIX: Snap current positions directly to initial targets
        // This prevents them from starting at 0,0 (top left) and sliding in
        letterPositions.forEach((pos, el) => {
            pos.current.x = pos.target.x;
            pos.current.y = pos.target.y;
            el.style.transform = `translate(-50%, -50%) translate3d(${pos.current.x}px, ${pos.current.y}px, 0px)`;
        });

        tick(); // Start the loop cleanly

        const onResize = () => {
            moveDistanceRef.current = getMoveDistance();
            resizeGridCanvas();
            drawGrid(stProgressRef.current);
            lettersCamera.aspect = window.innerWidth / window.innerHeight;
            lettersCamera.updateProjectionMatrix();
            lettersRenderer.setSize(window.innerWidth, window.innerHeight);
            updateTargetPositions(stProgressRef.current);
            updateLetterSize();
        };
        window.addEventListener('resize', onResize);

        return () => {
            cancelAnimationFrame(rafId);
            st.kill();
            window.removeEventListener('resize', onResize);
            lettersRenderer.dispose();
            textContainer.querySelectorAll('.pricing-letter').forEach(el => el.remove());
        };
    }, []);

    const cardW = `clamp(260px, 72vw, 30vw)`;
    const cardH = `clamp(340px, 65vh, 70vh)`;
    const cardGap = `clamp(20px, 5vw, 8vw)`;
    const cardPad = `clamp(1.5rem, 3vw, 2.5rem)`;

    return (
        <>
            <style>{`
                .pricing-letter {
                    position: absolute;
                    top: 0;
                    left: 0;
                    font-size: clamp(5rem, 12vw, 14rem);
                    font-weight: 200; 
                    color: rgba(0, 0, 0, 0); 
                    z-index: 2;
                    transform-origin: center;
                    will-change: transform;
                    pointer-events: none;
                    user-select: none;
                    line-height: 1;
                    letter-spacing: -0.02em;
                }
                .pricing-intro-h1, .pricing-outro-h1 {
                    font-size: clamp(2.5rem, 6vw, 7rem);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    color: #111;
                    margin: 0;
                }
                .pricing-card-label {
                    font-size: clamp(0.6rem, 1vw, 0.75rem);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    opacity: 0.5;
                    margin: 0 0 1rem 0;
                }
                .pricing-card-tier {
                    font-size: clamp(1rem, 2vw, 1.25rem);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin: 0 0 0.5rem 0;
                }
                .pricing-card-price {
                    font-size: clamp(2.5rem, 6vw, 5rem);
                    font-weight: 600;
                    line-height: 1;
                    letter-spacing: -0.05em;
                    margin: 0;
                }
                .pricing-card-feature {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: clamp(0.7rem, 1.1vw, 0.85rem);
                    font-weight: 600;
                    letter-spacing: 0.02em;
                    opacity: 0.7;
                }
                .pricing-card-dot {
                    width: 4px;
                    height: 4px;
                    border-radius: 50%;
                    flex-shrink: 0;
                    opacity: 0.4;
                }
                .pricing-card-divider {
                    height: 1px;
                    opacity: 0.1;
                    margin: clamp(1rem, 3vh, 1.5rem) 0;
                }
            `}</style>

            <section style={{
                position: 'relative', width: '100vw', height: '100vh',
                overflow: 'hidden', display: 'flex',
                justifyContent: 'center', alignItems: 'center',
                backgroundColor: '#ffffff',
            }}>
                <h1 className="pricing-intro-h1">Pricing</h1>
            </section>

            <section
                ref={workRef}
                style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#f7f7f7' }}
            >
                <canvas ref={gridCanvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }} />
                <canvas ref={lettersCanvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }} />

                <div
                    ref={textContainerRef}
                    style={{
                        position: 'absolute', top: 0, left: 0,
                        width: '100%', height: '100%',
                        zIndex: 2, pointerEvents: 'none',
                        perspective: '2500px', perspectiveOrigin: 'center',
                    }}
                />

                <div
                    ref={cardsRef}
                    style={{
                        position: 'absolute', top: 0, left: 0,
                        width: 'max-content',
                        height: '100vh',
                        paddingLeft: '100vw',
                        paddingRight: 'clamp(20px, 8vw, 12vw)',
                        display: 'flex',
                        gap: cardGap,
                        alignItems: 'center',
                        zIndex: 10,
                    }}
                >
                    {cards.map((card, i) => (
                        <div
                            key={i}
                            style={{
                                flexShrink: 0,
                                width: cardW,
                                height: cardH,
                                backgroundColor: card.color,
                                border: `1px solid ${card.borderColor}`,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                padding: cardPad,
                                boxSizing: 'border-box',
                            }}
                        >
                            <div>
                                <p className="pricing-card-label" style={{ color: card.textColor }}>
                                    Ticket
                                </p>
                                <p className="pricing-card-tier" style={{ color: card.textColor }}>
                                    {card.label}
                                </p>
                                <p className="pricing-card-price" style={{ color: card.textColor }}>
                                    {card.price}
                                </p>
                            </div>

                            <div>
                                <div className="pricing-card-divider" style={{ backgroundColor: card.textColor }} />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.5rem, 1.5vh, 0.8rem)' }}>
                                    {card.features.map((f, fi) => (
                                        <div key={fi} className="pricing-card-feature" style={{ color: card.textColor }}>
                                            <span className="pricing-card-dot" style={{ backgroundColor: card.textColor }} />
                                            {f}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section style={{
                position: 'relative', width: '100vw', height: '100vh',
                overflow: 'hidden', display: 'flex',
                justifyContent: 'center', alignItems: 'center',
                backgroundColor: '#ffffff', top: '-0.125em',
            }}>
                <h1 className="pricing-outro-h1">Bulusan Zoo</h1>
            </section>
        </>
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

                    {/* <div className="relative z-20 w-full">
                        <PurposeSection />
                    </div> */}

                    <div className="relative z-30 w-full">
                        <ExploreSection />
                    </div>

                    <div className="relative z-40 w-full">
                        <PromoHeroSection />
                        <FeaturesSection />
                        <CTASection />
                        <PricingSection />
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