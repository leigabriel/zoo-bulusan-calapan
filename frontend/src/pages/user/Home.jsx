import React, { useRef, useLayoutEffect } from 'react';
import { ReactLenis } from 'lenis/react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import '../../App.css';

gsap.registerPlugin(ScrollTrigger);

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

            tl.fromTo('.hero-deer',
                { opacity: 0, scale: 0.5, y: 50 },
                { opacity: 1, scale: 1, y: 0, duration: 1, ease: 'back.out(1.5)' }, 0
            )
                .fromTo('.hero-title',
                    { opacity: 0, y: 50, skewY: 5 },
                    { opacity: 1, y: 0, skewY: 0, duration: 1, ease: 'expo.out' }, 0.15
                )
                .fromTo('.hero-line',
                    { clipPath: 'inset(100% 0% 0% 0%)', y: 50 },
                    { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 1.25, ease: 'expo.out', stagger: 0.12 }, 0.25
                )
                .fromTo('.hero-btn',
                    { opacity: 0, scale: 0.9, y: 30 },
                    { opacity: 1, scale: 1, y: 0, duration: 1, ease: 'elastic.out(1, 0.5)' }, 0.6
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

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="relative w-full min-h-[100dvh] overflow-hidden bg-white">
            <section className="relative w-full min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
                <div className="hero-bg-parallax absolute inset-0 bg-white -z-10 origin-bottom" />

                <div className="hero-images absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <img
                        src="/deer.png"
                        alt=""
                        aria-hidden="true"
                        className="hero-deer absolute bottom-0 left-[-3rem] w-[78vw] max-w-[38rem] origin-bottom-left object-contain object-bottom opacity-0 sm:left-[-2rem] sm:w-[48vw] md:left-0 md:w-[43vw]"
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
                        className="hero-btn group pointer-events-auto bg-green-400 text-black p-1 sm:p-1.5 rounded-xl cursor-pointer transition-all duration-300 ease-out hover:scale-110 hover:drop-shadow-xl active:scale-95 focus:outline-none drop-shadow-md transform-gpu"
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

const AnimatedPhrase = ({ children, className = '' }) => (
    <span className={className ? `${className}-wrap` : ''} aria-label={children}>
        {children.split('').map((letter, index) => (
            <span key={`${letter}-${index}`} className={`inline-block ${className}`} aria-hidden="true">
                {letter === ' ' ? '\u00A0' : letter}
            </span>
        ))}
    </span>
);

const AboutSection = () => {
    const sectionRef = useRef(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const timeline = gsap.timeline({
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 80%',
                    toggleActions: 'play reverse play reverse',
                    once: false,
                },
            });

            timeline
                .fromTo('.about-copy', { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
                .fromTo('.about-letter',
                    { opacity: 0, y: '0.7em', rotateX: -80 },
                    { opacity: 1, y: 0, rotateX: 0, duration: 0.6, stagger: 0.01, ease: 'power3.out' },
                    '-=0.4'
                );
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="relative w-full h-[100svh] p-4 sm:p-8 overflow-hidden bg-[#fff]">
            <div className="about-copy w-full h-full flex justify-center items-center text-center rounded-[1.5rem] sm:rounded-[2rem] bg-green-400 px-4">
                <h1 className="w-full sm:w-[90%] md:w-[90%] text-[#000] text-3xl sm:text-[2rem] md:text-[5rem] font-black leading-[1.1] md:leading-[1]">
                    <AnimatedPhrase className="about-letter">
                        Bulusan Zoo Nature Park is more than a destination, it is a place where nature, wildlife, and serenity meet, inviting every visitor to slow down, appreciate, and reconnect with the beauty of the natural world.
                    </AnimatedPhrase>
                </h1>
            </div>
        </section>
    );
};

const ProjectSection = () => {
    const navigate = useNavigate();
    const sectionRef = useRef(null);
    const pillars = [
        {
            label: 'Wildlife sanctuary',
            title: 'Meet the species that call Mindoro home.',
            image: 'https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=900&q=85',
            tone: 'bg-[#d9e6cf]',
        },
        {
            label: 'Learning outdoors',
            title: 'Turn a day out into a lasting connection with nature.',
            image: 'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?auto=format&fit=crop&w=900&q=85',
            tone: 'bg-[#ded5f1]',
        },
        {
            label: 'Conservation first',
            title: 'Every visit helps us care for animals and their habitats.',
            image: 'https://images.unsplash.com/photo-1535338454770-8be927b5a00b?auto=format&fit=crop&w=900&q=85',
            tone: 'bg-[#f0d4c4]',
        },
    ];

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const timeline = gsap.timeline({
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 78%',
                    toggleActions: 'play reverse play reverse',
                    once: false,
                },
            });

            timeline
                .fromTo('.project-anim', { opacity: 0, y: 55 }, { opacity: 1, y: 0, duration: 0.65, stagger: 0.08, ease: 'power3.out' })
                .fromTo('.project-letter',
                    { opacity: 0, y: '0.8em', rotateX: -70 },
                    { opacity: 1, y: 0, rotateX: 0, duration: 0.6, stagger: 0.01, ease: 'power3.out' },
                    '-=0.4'
                )
                .fromTo('.project-phrase',
                    { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
                    { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: 'power3.inOut' },
                    '-=0.35'
                );
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="min-h-screen bg-[#f1f0ea] px-4 py-20 text-[#111] sm:px-8 sm:py-28">
            <div className="mx-auto">
                <div className="project-anim mb-16 flex flex-col justify-between gap-8 md:flex-row md:items-end">
                    <div className="max-w-3xl">
                        <p className="mb-5 text-xs font-bold uppercase tracking-[0.25em] text-[#315b37]">What Bulusan Zoo is about</p>
                        <h2 className="text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl md:text-8xl">
                            <AnimatedPhrase className="project-letter">A closer look at the wild.</AnimatedPhrase>
                        </h2>
                    </div>
                    <p className="project-phrase max-w-xs text-sm leading-6 text-black/60">
                        A community nature park in Calapan where discovery, care, and conservation come together.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    {pillars.map((pillar) => (
                        <article key={pillar.label} className={`project-anim overflow-hidden rounded-[1.5rem] ${pillar.tone}`}>
                            <div className="p-5 sm:p-6">
                                <p className="mb-16 text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">{pillar.label}</p>
                                <h3 className="max-w-xs text-2xl font-bold leading-tight sm:text-3xl">{pillar.title}</h3>
                            </div>
                            <img src={pillar.image} alt="" className="h-56 w-full object-cover sm:h-64" loading="lazy" />
                        </article>
                    ))}
                </div>

                <div className="project-anim mt-4 grid overflow-hidden rounded-[1.5rem] border border-black/10 bg-white md:grid-cols-[1fr_1.4fr]">
                    <div className="bg-[#f4d94f] p-7 sm:p-10">
                        <p className="mb-20 text-xs font-bold uppercase tracking-[0.25em] text-black/55">Bulusan Zoo entrance</p>
                            <h3 className="max-w-sm text-4xl font-black leading-none sm:text-6xl"><AnimatedPhrase className="project-letter">Make room for wonder.</AnimatedPhrase></h3>
                    </div>
                    <div className="p-7 sm:p-10">
                        <div className="mb-8 flex items-end justify-between gap-4 border-b border-black/15 pb-5">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/45">Ticket Entrance</p>
                                <p className="mt-2 text-sm text-black/55">Simple access for a full day of discovery.</p>
                            </div>
                            <span className="text-3xl" aria-hidden="true">↗</span>
                        </div>
                        <div className="divide-y divide-black/10">
                            {[
                                ['Adult', '40'],
                                ['Child', '20'],
                                ['Bulusan Resident', 'Free'],
                            ].map(([type, price]) => (
                                <div key={type} className="flex items-center justify-between py-4">
                                    <span className="text-base font-bold">{type}</span>
                                    <span className="text-xl font-black">{price === 'Free' ? price : `₱${price}`}</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => navigate('/reservations')} className="mt-8 w-full rounded-full bg-black px-6 py-4 text-sm font-bold text-white transition-colors hover:bg-[#315b37]">
                            Reserve your entrance
                        </button>
                    </div>
                </div>

                <div className="project-anim mt-4 grid overflow-hidden rounded-[1.5rem] bg-[#315b37] text-white md:grid-cols-[1.1fr_0.9fr]">
                    <div className="flex flex-col justify-between p-7 sm:p-12">
                        <div>
                            <p className="mb-6 text-xs font-bold uppercase tracking-[0.25em] text-green-200">The project in one visit</p>
                            <h3 className="max-w-xl text-4xl font-black leading-none sm:text-6xl"><AnimatedPhrase className="project-letter">Come curious. Leave connected.</AnimatedPhrase></h3>
                        </div>
                        <button onClick={() => navigate('/animals')} className="mt-12 w-fit rounded-full bg-green-300 px-6 py-3 text-sm font-bold text-black transition-transform hover:scale-105">
                            Explore the animals <span aria-hidden="true">↗</span>
                        </button>
                    </div>
                    <img src="https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=85" alt="Lush green forest habitat" className="min-h-72 w-full object-cover md:min-h-full" loading="lazy" />
                </div>

                <div className="project-anim mt-20 grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
                    <div>
                        <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-black/40">Plan your day</p>
                        <h3 className="text-4xl font-black leading-none sm:text-5xl"><AnimatedPhrase className="project-letter">Good to know before you go.</AnimatedPhrase></h3>
                    </div>
                    <div className="divide-y divide-black/15 border-y border-black/15">
                        {[
                            ['What can I see?', 'Explore animals, plants, and spaces designed for learning at your own pace.'],
                            ['How do I visit?', 'Check our visitor information and reserve your spot before heading to the zoo.'],
                            ['Why does my visit matter?', 'Your support helps keep our sanctuary, education, and conservation work moving.'],
                        ].map(([question, answer]) => (
                            <details key={question} className="group py-5">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold">
                                    {question}
                                    <span className="text-2xl font-normal transition-transform group-open:rotate-45">+</span>
                                </summary>
                                <p className="max-w-xl pt-3 text-sm leading-6 text-black/60">{answer}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

const EventsSection = () => {
    const navigate = useNavigate();
    const sectionRef = useRef(null);
    const events = [
        {
            date: 'Every visit',
            title: 'Wildlife discovery',
            description: 'Take a closer look at the animals, plants, and habitats that make Bulusan Zoo a living classroom.',
            tone: 'bg-[#ded5f1]',
        },
        {
            date: 'Seasonal programs',
            title: 'Learn in the wild',
            description: 'Join community activities and educational experiences that turn curiosity into care for nature.',
            tone: 'bg-[#d9e6cf]',
        },
    ];

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const timeline = gsap.timeline({
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 78%',
                    toggleActions: 'play reverse play reverse',
                    once: false,
                },
            });

            timeline
                .fromTo('.events-anim', { opacity: 0, y: 55 }, { opacity: 1, y: 0, duration: 0.65, stagger: 0.08, ease: 'power3.out' })
                .fromTo('.events-letter',
                    { opacity: 0, y: '0.8em', rotateX: -70 },
                    { opacity: 1, y: 0, rotateX: 0, duration: 0.6, stagger: 0.01, ease: 'power3.out' },
                    '-=0.4'
                );
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="min-h-screen bg-[#f4d94f] px-4 py-20 text-[#111] sm:px-8 sm:py-28">
            <div className="mx-auto flex min-h-[calc(100vh-10rem)] flex-col justify-between">
                <div className="events-anim flex flex-col justify-between gap-8 md:flex-row md:items-end">
                    <div>
                        <p className="mb-5 text-xs font-bold uppercase tracking-[0.25em] text-black/55">Events at Bulusan Zoo</p>
                        <h2 className="max-w-4xl text-5xl font-black leading-[0.9] tracking-tight sm:text-7xl md:text-8xl"><AnimatedPhrase className="events-letter">There is always more to discover.</AnimatedPhrase></h2>
                    </div>
                    <p className="max-w-xs text-sm leading-6 text-black/60">From quiet encounters to community learning, find a reason to spend more time outdoors.</p>
                </div>

                <div className="mt-16 grid gap-4 md:grid-cols-2">
                    {events.map((event) => (
                        <article key={event.title} className={`events-anim rounded-[1.5rem] ${event.tone} p-7 sm:p-10`}>
                            <div className="flex items-start justify-between gap-4">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/50">{event.date}</p>
                                <span className="text-2xl" aria-hidden="true">↗</span>
                            </div>
                            <h3 className="mt-20 text-3xl font-black sm:text-5xl"><AnimatedPhrase className="events-letter">{event.title}</AnimatedPhrase></h3>
                            <p className="mt-4 max-w-md text-sm leading-6 text-black/65">{event.description}</p>
                        </article>
                    ))}
                </div>

                <button onClick={() => navigate('/events')} className="events-anim mt-10 w-fit rounded-full bg-black px-7 py-4 text-sm font-bold text-white transition-transform hover:scale-105">
                    View all events <span aria-hidden="true">↗</span>
                </button>
            </div>
        </section>
    );
};

const ZootopiaSection = () => {
    const sectionRef = useRef(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const timeline = gsap.timeline({
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top 78%',
                    toggleActions: 'play reverse play reverse',
                    once: false,
                },
            });

            timeline
                .fromTo('.zootopia-anim', { opacity: 0, y: 55 }, { opacity: 1, y: 0, duration: 0.65, stagger: 0.08, ease: 'power3.out' })
                .fromTo('.zootopia-letter',
                    { opacity: 0, y: '0.8em', rotateX: -70 },
                    { opacity: 1, y: 0, rotateX: 0, duration: 0.6, stagger: 0.01, ease: 'power3.out' },
                    '-=0.4'
                )
                .fromTo('.zootopia-phrase',
                    { opacity: 0, clipPath: 'inset(0 100% 0 0)' },
                    { opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: 'power3.inOut' },
                    '-=0.35'
                );
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="min-h-screen bg-[#315b37] px-4 py-20 text-white sm:px-8 sm:py-28">
            <div className="mx-auto flex min-h-[calc(100vh-10rem)] flex-col justify-between">
                <div className="zootopia-anim flex flex-col justify-between gap-8 md:flex-row md:items-end">
                    <div>
                        <p className="mb-5 text-xs font-bold uppercase tracking-[0.25em] text-green-200">Bulusan Zootopia</p>
                        <h2 className="max-w-4xl text-5xl font-black leading-[0.9] tracking-tight sm:text-7xl md:text-8xl"><AnimatedPhrase className="zootopia-letter">The wild can be playful too.</AnimatedPhrase></h2>
                    </div>
                    <p className="max-w-xs text-sm leading-6 text-white/65">Step into a playful digital world built for curious explorers of every age.</p>
                </div>

                <div className="zootopia-anim mt-16 grid overflow-hidden rounded-[1.5rem] bg-[#d9e6cf] text-[#111] md:grid-cols-[1fr_1fr]">
                    <div className="flex flex-col justify-between p-7 sm:p-12">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/45">Play. Explore. Learn.</p>
                            <h3 className="mt-16 max-w-lg text-4xl font-black leading-none sm:text-6xl"><AnimatedPhrase className="zootopia-letter">Meet Bulusan Zootopia online.</AnimatedPhrase></h3>
                            <p className="zootopia-phrase mt-6 max-w-md text-sm leading-6 text-black/60">Discover another way to connect with the zoo through an interactive experience inspired by the animals and stories around us.</p>
                        </div>
                        <a href="https://bulusanzootopia.vercel.app" target="_blank" rel="noreferrer" className="mt-12 w-fit rounded-full bg-black px-7 py-4 text-sm font-bold text-white transition-transform hover:scale-105">
                            Enter Zootopia <span aria-hidden="true">↗</span>
                        </a>
                    </div>
                    <div className="relative min-h-80 overflow-hidden bg-[#ded5f1]">
                        <img src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=85" alt="Colorful tropical leaves" className="absolute inset-0 h-full w-full object-cover mix-blend-multiply" loading="lazy" />
                        <span className="absolute bottom-6 left-6 rounded-full bg-[#f4d94f] px-4 py-2 text-xs font-bold uppercase tracking-widest text-black">Open the world</span>
                    </div>
                </div>

                <p className="zootopia-anim mt-10 max-w-2xl text-sm leading-6 text-white/60">Bulusan Zootopia is an external experience. It opens in a new tab so you can return to the main zoo website anytime.</p>
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
            <div className="relative min-h-[100dvh] bg-white">
                <Header />
                <AIFloatingButton />

                <main className="relative w-full">
                    <div className="relative z-0">
                        <HeroSection />
                    </div>

                    <div className="relative z-10">
                        <AboutSection />
                        <ProjectSection />
                        <EventsSection />
                        <ZootopiaSection />
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
