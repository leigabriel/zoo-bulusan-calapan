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
    WebkitMaskSize: '51% 16px',
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
            <section className="relative mx-auto max-w-[1800px] w-full min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
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
            </section>
        </div>
    );
};

const AboutSection = () => {
    return (
        <section className="relative w-full min-h-[100svh] p-4 sm:p-8 flex items-center justify-center bg-white">
            <div className="w-full mx-auto max-w-[1800px] h-full min-h-[80vh] flex justify-center items-center text-center rounded-[1.5rem] sm:rounded-[2rem] bg-green-400 p-6 sm:p-12">
                <h1 className="w-full max-w-5xl text-black text-3xl sm:text-5xl md:text-6xl font-black leading-snug sm:leading-tight">
                    Bulusan Zoo Nature Park is more than a destination, it is a place where nature, wildlife, and serenity meet, inviting every visitor to slow down, appreciate, and reconnect with the beauty of the natural world.
                </h1>
            </div>
        </section>
    );
};

const ProjectSection = () => {
    const navigate = useNavigate();
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

    return (
        <section className="min-h-screen bg-[#f1f0ea] px-4 py-16 text-[#111] sm:px-8 sm:py-24">
            <div className="mx-auto max-w-[1800px]">
                <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end sm:mb-16">
                    <div className="max-w-3xl">
                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#315b37] sm:mb-5">What Bulusan Zoo is about</p>
                        <h2 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl md:text-7xl">
                            A closer look at the wild.
                        </h2>
                    </div>
                    <p className="max-w-xs text-sm leading-6 text-black/60">
                        A community nature park in Calapan where discovery, care, and conservation come together.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {pillars.map((pillar) => (
                        <article key={pillar.label} className={`overflow-hidden rounded-[1.5rem] flex flex-col justify-between ${pillar.tone}`}>
                            <div className="p-5 sm:p-6">
                                <p className="mb-8 text-[10px] font-bold uppercase tracking-[0.2em] text-black/50 sm:mb-16">{pillar.label}</p>
                                <h3 className="max-w-xs text-xl font-bold leading-tight sm:text-2xl md:text-3xl">{pillar.title}</h3>
                            </div>
                            <img src={pillar.image} alt="" className="h-48 w-full object-cover sm:h-56 md:h-64 mt-auto" loading="lazy" />
                        </article>
                    ))}
                </div>

                <div className="mt-4 grid overflow-hidden rounded-[1.5rem] border border-black/10 bg-white lg:grid-cols-[1fr_1.4fr]">
                    <div className="bg-[#f4d94f] p-6 sm:p-10 flex flex-col justify-center">
                        <p className="mb-8 text-xs font-bold uppercase tracking-[0.25em] text-black/55 sm:mb-20">Bulusan Zoo entrance</p>
                        <h3 className="max-w-sm text-4xl font-black leading-tight sm:text-5xl md:text-6xl">Make room for wonder.</h3>
                    </div>
                    <div className="p-6 sm:p-10">
                        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-black/15 pb-5">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/45">Ticket Entrance</p>
                                <p className="mt-2 text-sm text-black/55">Simple access for a full day of discovery.</p>
                            </div>
                            <span className="text-3xl hidden sm:block" aria-hidden="true">↗</span>
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

                <div className="mt-4 grid overflow-hidden rounded-[1.5rem] bg-[#315b37] text-white lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="flex flex-col justify-between p-6 sm:p-12">
                        <div>
                            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-green-200 sm:mb-6">The project in one visit</p>
                            <h3 className="max-w-xl text-3xl font-black leading-tight sm:text-5xl md:text-6xl">Come curious. Leave connected.</h3>
                        </div>
                        <button onClick={() => navigate('/animals')} className="mt-8 w-fit rounded-full bg-green-300 px-6 py-3 text-sm font-bold text-black transition-transform hover:scale-105 sm:mt-12">
                            Explore the animals <span aria-hidden="true">↗</span>
                        </button>
                    </div>
                    <img src="https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1200&q=85" alt="Lush green forest habitat" className="h-64 w-full object-cover lg:h-full lg:min-h-full" loading="lazy" />
                </div>

                <div className="mt-16 grid gap-8 lg:mt-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10">
                    <div>
                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-black/40 sm:mb-4">Plan your day</p>
                        <h3 className="text-3xl font-black leading-tight sm:text-4xl md:text-5xl">Good to know before you go.</h3>
                    </div>
                    <div className="divide-y divide-black/15 border-y border-black/15">
                        {[
                            ['What can I see?', 'Explore animals, plants, and spaces designed for learning at your own pace.'],
                            ['How do I visit?', 'Check our visitor information and reserve your spot before heading to the zoo.'],
                            ['Why does my visit matter?', 'Your support helps keep our sanctuary, education, and conservation work moving.'],
                        ].map(([question, answer]) => (
                            <details key={question} className="group py-4 sm:py-5">
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

    return (
        <section className="min-h-screen bg-[#f4d94f] px-4 py-16 text-[#111] sm:px-8 sm:py-24">
            <div className="mx-auto max-w-[1800px] flex flex-col justify-between">
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end lg:gap-8">
                    <div>
                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-black/55 sm:mb-5">Events at Bulusan Zoo</p>
                        <h2 className="max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-6xl md:text-7xl">There is always more to discover.</h2>
                    </div>
                    <p className="max-w-xs text-sm leading-6 text-black/60">From quiet encounters to community learning, find a reason to spend more time outdoors.</p>
                </div>

                <div className="mt-12 grid gap-4 md:grid-cols-2 lg:mt-16">
                    {events.map((event) => (
                        <article key={event.title} className={`rounded-[1.5rem] flex flex-col justify-between ${event.tone} p-6 sm:p-10`}>
                            <div className="flex items-start justify-between gap-4">
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/50">{event.date}</p>
                                <span className="text-2xl hidden sm:block" aria-hidden="true">↗</span>
                            </div>
                            <div>
                                <h3 className="mt-12 text-3xl font-black sm:mt-20 sm:text-4xl md:text-5xl">{event.title}</h3>
                                <p className="mt-3 max-w-md text-sm leading-6 text-black/65 sm:mt-4">{event.description}</p>
                            </div>
                        </article>
                    ))}
                </div>

                <button onClick={() => navigate('/events')} className="mt-8 w-fit rounded-full bg-black px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-105 sm:mt-10 sm:px-7 sm:py-4">
                    View all events <span aria-hidden="true">↗</span>
                </button>
            </div>
        </section>
    );
};

const ZootopiaSection = () => {
    return (
        <section className="min-h-screen bg-[#315b37] px-4 py-16 text-white sm:px-8 sm:py-24">
            <div className="mx-auto max-w-[1800px] flex flex-col justify-between">
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end lg:gap-8">
                    <div>
                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-green-200 sm:mb-5">Bulusan Zootopia</p>
                        <h2 className="max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-6xl md:text-7xl">The wild can be playful too.</h2>
                    </div>
                    <p className="max-w-xs text-sm leading-6 text-white/65">Step into a playful digital world built for curious explorers of every age.</p>
                </div>

                <div className="mt-12 grid overflow-hidden rounded-[1.5rem] bg-[#d9e6cf] text-[#111] lg:mt-16 lg:grid-cols-[1fr_1fr]">
                    <div className="flex flex-col justify-between p-6 sm:p-12">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/45">Play. Explore. Learn.</p>
                            <h3 className="mt-8 max-w-lg text-3xl font-black leading-tight sm:mt-12 sm:text-5xl md:text-6xl">Meet Bulusan Zootopia online.</h3>
                            <p className="mt-4 max-w-md text-sm leading-6 text-black/60 sm:mt-6">Discover another way to connect with the zoo through an interactive experience inspired by the animals and stories around us.</p>
                        </div>
                        <a href="https://bulusanzootopia.vercel.app" target="_blank" rel="noreferrer" className="mt-8 w-fit rounded-full bg-black px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-105 sm:mt-12 sm:px-7 sm:py-4">
                            Enter Zootopia <span aria-hidden="true">↗</span>
                        </a>
                    </div>
                    <div className="relative h-64 overflow-hidden bg-[#ded5f1] sm:h-80 lg:h-full lg:min-h-[20rem]">
                        <img src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=85" alt="Colorful tropical leaves" className="absolute inset-0 h-full w-full object-cover mix-blend-multiply" loading="lazy" />
                        <span className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 rounded-full bg-[#f4d94f] px-4 py-2 text-xs font-bold uppercase tracking-widest text-black">Open the world</span>
                    </div>
                </div>

                <p className="mt-8 max-w-2xl text-sm leading-6 text-white/60 sm:mt-10">Bulusan Zootopia is an external experience. It opens in a new tab so you can return to the main zoo website anytime.</p>
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