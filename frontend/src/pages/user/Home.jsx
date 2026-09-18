import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ReactLenis } from 'lenis/react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import '../../App.css';

gsap.registerPlugin(ScrollTrigger);

const CITY_SOURCE = 'https://cityofcalapan.gov.ph/the-city-economic-enterprise-department-ceed/';
const CITY_VISITORS_SOURCE = 'https://cityofcalapan.gov.ph/visitors/';
const TOURISM_SOURCE = 'https://www.travelorientalmindoro.ph/place/calapan-nature-park';
const DIRECTIONS_URL = 'https://www.google.com/maps/dir/?api=1&destination=13.40496178,121.1991656';

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

const usePageMetadata = (title, description, canonical) => {
    useEffect(() => {
        const updates = [
            ['meta[name="title"]', title],
            ['meta[name="description"]', description],
            ['meta[property="og:title"]', title],
            ['meta[property="og:description"]', description],
            ['meta[property="og:url"]', canonical],
            ['meta[name="twitter:title"]', title],
            ['meta[name="twitter:description"]', description],
        ];
        const previousTitle = document.title;
        const previousValues = updates.map(([selector, value]) => {
            const element = document.querySelector(selector);
            const previous = element?.getAttribute('content');
            if (element) element.setAttribute('content', value);
            return [element, previous];
        });
        const canonicalElement = document.querySelector('link[rel="canonical"]');
        const previousCanonical = canonicalElement?.getAttribute('href');

        document.title = title;
        if (canonicalElement) canonicalElement.setAttribute('href', canonical);

        return () => {
            document.title = previousTitle;
            previousValues.forEach(([element, value]) => {
                if (element && value !== null && value !== undefined) element.setAttribute('content', value);
            });
            if (canonicalElement && previousCanonical) canonicalElement.setAttribute('href', previousCanonical);
        };
    }, [canonical, description, title]);
};

const HeroSection = () => {
    const navigate = useNavigate();
    const containerRef = useRef(null);

    useLayoutEffect(() => {
        document.body.style.overflow = 'auto';

        const headerElement = document.querySelector('header');
        if (headerElement) gsap.set(headerElement, { opacity: 1, pointerEvents: 'auto' });

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reducedMotion) {
            gsap.set('.hero-deer, .hero-title', { opacity: 1, scale: 1, y: 0 });
            gsap.set('.hero-line', { clipPath: 'inset(0% 0% 0% 0%)', y: 0 });
            gsap.set('.hero-btn', { opacity: 1, scale: 1, y: 0 });
            return undefined;
        }

        const context = gsap.context(() => {
            const timeline = gsap.timeline();

            timeline.fromTo('.hero-deer',
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
                scrollTrigger: { trigger: containerRef.current, start: 'top top', end: 'bottom top', scrub: true }
            });
            gsap.to('.hero-content, .hero-images', {
                yPercent: 40,
                opacity: 0,
                ease: 'none',
                scrollTrigger: { trigger: containerRef.current, start: 'top top', end: 'bottom top', scrub: true }
            });
        }, containerRef);

        return () => context.revert();
    }, []);

    return (
        <div ref={containerRef} className="relative w-full min-h-[100dvh] overflow-hidden bg-white">
            <section className="relative mx-auto max-w-[2000px] w-full min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
                <div className="hero-bg-parallax absolute inset-0 bg-white -z-10 origin-bottom" />
                <div className="hero-images absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <img
                        src="/deer.png"
                        alt=""
                        aria-hidden="true"
                        className="hero-deer absolute bottom-0 left-[-3rem] w-[78vw] max-w-[40rem] origin-bottom-left object-contain object-bottom opacity-0 sm:left-[-2rem] sm:w-[48vw] md:left-0 md:w-[43vw]"
                    />
                </div>
                <div className="hero-content text-center flex flex-col items-center z-10 px-4 sm:px-5 pointer-events-none">
                    <p className="hero-title opacity-0 font-['Mistral',_cursive] text-[clamp(2rem,5vw,5rem)] text-black -mb-1 sm:-mb-2">
                        Welcome to
                    </p>
                    <div className="mb-5 sm:mb-[30px]">
                        <h1 className="text-[clamp(2.5rem,8vw,6rem)] font-semibold text-black leading-none tracking-tight overflow-hidden py-2 sm:py-4">
                            <span className="block overflow-hidden">
                                <span className="hero-line block" style={{ clipPath: 'inset(100% 0% 0% 0%)' }}>BULUSAN ZOO</span>
                            </span>
                        </h1>
                        <div className="overflow-hidden mt-2">
                            <p className="hero-line text-md sm:text-xl md:text-2xl font-semibold text-black/70 tracking-wide" style={{ clipPath: 'inset(100% 0% 0% 0%)' }}>
                                Explore Nature, Learn, and Connect
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/reservations')}
                        className="hero-btn group pointer-events-auto bg-green-400 text-black p-1 sm:p-1.5 rounded-xl cursor-pointer transition-all duration-300 ease-out hover:scale-110 hover:drop-shadow-xl active:scale-95 focus:outline-none drop-shadow-md transform-gpu"
                        style={ticketMaskStyle}
                    >
                        <span className="w-full h-full rounded-lg flex items-center justify-center py-1.5 sm:py-0.5 px-7 sm:px-9 font-['Mistral',_cursive] text-[1.5rem] sm:text-[2rem] tracking-[1px] mt-1 transition-transform duration-300 ease-out group-hover:scale-105">
                            Plan a Visit
                        </span>
                    </button>
                </div>
            </section>
        </div>
    );
};

const AboutSection = () => (
    <section className="relative w-full min-h-[78svh] p-4 sm:p-8 flex items-center justify-center bg-green-400">
        <div className="w-full mx-auto max-w-[1500px] flex flex-col items-center justify-center text-center rounded-[1.5rem] sm:rounded-[2rem] bg-green-400 px-3 py-16 sm:px-10 sm:py-24">
            <p className="mb-7 text-xs font-black uppercase tracking-[0.25em] text-black/55">About Bulusan Park</p>
            <h2 className="max-w-[1300px] text-black text-[clamp(2.15rem,6vw,5.8rem)] font-black leading-[1.02] tracking-[-0.045em]">
                The Calapan City Recreational and Zoological Park, commonly known as Bulusan Park, brings recreation, environmental education, and leisure together in Barangay Bulusan.
            </h2>
            <p className="mt-8 max-w-3xl text-base font-semibold leading-7 text-black/65 sm:text-lg">
                Managed by the City Economic Enterprise Department, the park includes a mini-zoo, landscaped open spaces, and a multi-purpose pavilion for events and community gatherings.
            </p>
        </div>
    </section>
);

const parkFeatures = [
    { number: '01', title: 'Mini-zoo', text: 'The City describes a mini-zoo housing various animal species. A current species inventory is not published, so exhibits may vary.' },
    { number: '02', title: 'Open spaces', text: 'Landscaped areas provide room for family recreation and leisure within the park.' },
    { number: '03', title: 'Pavilion', text: 'A multi-purpose pavilion supports events and community gatherings.' },
    { number: '04', title: 'Outdoor recreation', text: 'The provincial tourism portal documents picnic and camping areas, wall climbing, and routes used for walking and other outdoor activities.' },
];

const ExploreSection = () => (
    <section className="bg-[#f7f5ef] px-4 py-20 sm:px-6 sm:py-28 lg:px-10" aria-labelledby="explore-park-title">
        <div className="mx-auto max-w-[1500px]">
            <div className="grid gap-8 border-b border-black/15 pb-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                <div>
                    <p className="mb-4 text-xs font-black uppercase tracking-[0.24em] text-black/45">Inside the park</p>
                    <h2 id="explore-park-title" className="text-[clamp(2.8rem,7vw,6.5rem)] font-black leading-[0.9] tracking-[-0.055em] text-black">Explore<br />Bulusan</h2>
                </div>
                <p className="max-w-2xl text-base font-semibold leading-7 text-black/60 lg:justify-self-end lg:text-lg">
                    Official City and provincial tourism information presents Bulusan Park as a place for wildlife viewing, recreation, learning, and time outdoors.
                </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4">
                {parkFeatures.map((feature) => (
                    <article key={feature.number} className="border-b border-black/15 py-8 sm:px-6 sm:first:pl-0 lg:min-h-72 lg:border-b-0 lg:border-r lg:last:border-r-0">
                        <span className="text-xs font-black tracking-[0.2em] text-black/35">{feature.number}</span>
                        <h3 className="mt-12 text-2xl font-black tracking-tight text-black">{feature.title}</h3>
                        <p className="mt-4 text-sm font-medium leading-6 text-black/58">{feature.text}</p>
                    </article>
                ))}
            </div>
        </div>
    </section>
);

const activities = [
    { title: 'Trek', note: 'Follow the documented eco-trail from the park toward Barangay Parang.' },
    { title: 'Jog', note: 'Take in the park setting at a comfortable pace.' },
    { title: 'Ride', note: 'The tourism portal lists mountain biking among the park’s outdoor activities.' },
    { title: 'Camp', note: 'Picnic and camping grounds are included in the official tourism listing.' },
];

const ActivitiesSection = () => (
    <section className="overflow-hidden bg-white py-20 sm:py-28" aria-labelledby="activities-title">
        <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10">
            <div className="flex flex-col gap-7 border-b border-black/15 pb-10 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="mb-4 text-xs font-black uppercase tracking-[0.24em] text-black/40">Choose your pace</p>
                    <h2 id="activities-title" className="text-[clamp(3rem,7vw,6.8rem)] font-black leading-[0.88] tracking-[-0.06em] text-black">Ways to move<br />through nature.</h2>
                </div>
                <p className="max-w-md text-sm font-semibold leading-6 text-black/55">Activities documented by the official Oriental Mindoro tourism portal. Availability and site conditions can change.</p>
            </div>
            <div className="divide-y divide-black/15">
                {activities.map((activity, index) => (
                    <article key={activity.title} className="group grid gap-4 py-7 sm:grid-cols-[4rem_0.65fr_1fr] sm:items-center sm:py-9">
                        <span className="text-xs font-black tracking-[0.2em] text-black/30">0{index + 1}</span>
                        <h3 className="text-[clamp(2.2rem,5vw,4.8rem)] font-black leading-none tracking-[-0.05em] transition-transform duration-300 group-hover:translate-x-2">{activity.title}</h3>
                        <p className="max-w-lg text-sm font-medium leading-6 text-black/55 sm:justify-self-end">{activity.note}</p>
                    </article>
                ))}
            </div>
        </div>
    </section>
);

const TrailSection = () => (
    <section className="relative overflow-hidden bg-[#151b16] px-4 py-20 text-white sm:px-6 sm:py-28 lg:px-10" aria-labelledby="trail-title">
        <div className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full border border-green-300/20 sm:h-[32rem] sm:w-[32rem]" />
        <div className="pointer-events-none absolute -right-8 top-28 h-44 w-44 rounded-full bg-green-400/10 blur-2xl sm:h-80 sm:w-80" />
        <div className="relative mx-auto grid max-w-[1500px] gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
                <p className="mb-5 text-xs font-black uppercase tracking-[0.24em] text-green-300">Nature and eco-trail</p>
                <h2 id="trail-title" className="max-w-4xl text-[clamp(3rem,8vw,7.5rem)] font-black leading-[0.88] tracking-[-0.06em]">From old trees<br />to the coast.</h2>
            </div>
            <div className="max-w-xl border-l border-white/20 pl-5 sm:pl-8">
                <p className="text-lg font-semibold leading-8 text-white/80 sm:text-xl">
                    The Oriental Mindoro tourism portal describes century-old trees throughout the park and identifies it as the entry point to the Bulusan eco-trail.
                </p>
                <p className="mt-5 text-sm leading-6 text-white/55">
                    The listed route takes approximately one hour and ends at the seashore in Barangay Parang. Current trail conditions, access arrangements, and safety guidance are not published; confirm locally before setting out.
                </p>
                <a href={TOURISM_SOURCE} target="_blank" rel="noreferrer" className="mt-8 inline-flex min-h-11 items-center border-b border-green-300 pb-1 text-xs font-black uppercase tracking-[0.2em] text-green-300 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-300">
                    Read the tourism listing
                </a>
            </div>
        </div>
    </section>
);

const OfficialRecordsSection = () => (
    <section className="bg-white px-4 py-20 sm:px-6 sm:py-28 lg:px-10" aria-labelledby="official-records-title">
        <div className="mx-auto max-w-[1500px] rounded-[2rem] border border-black/10 p-6 sm:p-10 lg:grid lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:p-14">
            <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-black/40">Documentary sources</p>
                <h2 id="official-records-title" className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black leading-[0.95] tracking-[-0.05em]">See the park through official channels.</h2>
            </div>
            <div className="mt-10 divide-y divide-black/10 border-y border-black/10 lg:mt-0">
                <a href={CITY_SOURCE} target="_blank" rel="noreferrer" className="group flex min-h-24 items-center justify-between gap-5 py-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-600">
                    <span><strong className="block text-lg">City Government of Calapan</strong><span className="mt-1 block text-sm text-black/50">Park description, administration, photographs, and contact</span></span>
                    <span aria-hidden="true" className="text-2xl transition-transform group-hover:translate-x-1">&#8599;</span>
                </a>
                <a href={TOURISM_SOURCE} target="_blank" rel="noreferrer" className="group flex min-h-24 items-center justify-between gap-5 py-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-600">
                    <span><strong className="block text-lg">Travel Oriental Mindoro</strong><span className="mt-1 block text-sm text-black/50">Official destination gallery, recreation details, and directions</span></span>
                    <span aria-hidden="true" className="text-2xl transition-transform group-hover:translate-x-1">&#8599;</span>
                </a>
            </div>
        </div>
    </section>
);

const ArrivalSection = () => (
    <section className="bg-[#f0eee7] px-4 py-20 sm:px-6 sm:py-28 lg:px-10" aria-labelledby="arrival-title">
        <div className="mx-auto max-w-[1500px]">
            <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-24">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-black/40">Arriving in Calapan</p>
                    <h2 id="arrival-title" className="mt-5 text-[clamp(3rem,8vw,7.5rem)] font-black leading-[0.86] tracking-[-0.06em] text-black">Port to park,<br />plan the last mile.</h2>
                </div>
                <div>
                    <p className="text-xl font-bold leading-8 text-black/75">The City identifies Calapan City Port as Oriental Mindoro’s main gateway and the most direct arrival point for destinations in Calapan.</p>
                    <p className="mt-5 text-sm font-medium leading-6 text-black/50">No official source publishes a dedicated public-transport route from the port to Bulusan Park. Use the destination pin for directions and confirm local transport before traveling.</p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <a href={CITY_VISITORS_SOURCE} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full bg-black px-6 py-3 text-center text-xs font-black uppercase tracking-[0.15em] text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">Calapan travel guide</a>
                        <a href={DIRECTIONS_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-black px-6 py-3 text-center text-xs font-black uppercase tracking-[0.15em] text-black hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">Park directions</a>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

const VisitorSection = ({ navigate }) => (
    <section className="bg-green-400 px-4 py-20 sm:px-6 sm:py-28 lg:px-10" aria-labelledby="visitor-info-title">
        <div className="mx-auto max-w-[1500px]">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-black/50">Visitor information</p>
                    <h2 id="visitor-info-title" className="mt-5 text-[clamp(3rem,7vw,6.5rem)] font-black leading-[0.9] tracking-[-0.055em] text-black">Find your way<br />to Bulusan.</h2>
                </div>
                <dl className="divide-y divide-black/20 border-y border-black/20">
                    <div className="grid gap-2 py-6 sm:grid-cols-[8rem_1fr]"><dt className="text-xs font-black uppercase tracking-[0.18em] text-black/45">Location</dt><dd className="font-bold leading-6">Barangay Bulusan, Calapan City, Oriental Mindoro</dd></div>
                    <div className="grid gap-2 py-6 sm:grid-cols-[8rem_1fr]"><dt className="text-xs font-black uppercase tracking-[0.18em] text-black/45">Park contact</dt><dd><a href="tel:+63432887291" className="font-bold underline decoration-black/30 underline-offset-4 hover:decoration-black">(043) 288-7291</a><span className="mt-1 block text-sm text-black/55">Published by the City Economic Enterprise Department</span></dd></div>
                    <div className="grid gap-2 py-6 sm:grid-cols-[8rem_1fr]"><dt className="text-xs font-black uppercase tracking-[0.18em] text-black/45">Directions</dt><dd><a href={DIRECTIONS_URL} target="_blank" rel="noreferrer" className="font-bold underline decoration-black/30 underline-offset-4 hover:decoration-black">Open route in Google Maps</a></dd></div>
                </dl>
            </div>
            <p className="mt-7 max-w-2xl text-sm font-semibold leading-6 text-black/55">Operating schedules, admission arrangements, and available activities may change. Confirm with the City Government of Calapan before visiting.</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <button onClick={() => navigate('/reservations')} className="min-h-12 rounded-full bg-black px-7 py-3 text-sm font-black text-white transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">Plan a visit</button>
                <button onClick={() => navigate('/animals')} className="min-h-12 rounded-full border-2 border-black px-7 py-3 text-sm font-black text-black transition-colors hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">Explore animals</button>
            </div>
        </div>
    </section>
);

const Home = () => {
    const navigate = useNavigate();
    const [reduceMotion, setReduceMotion] = useState(false);
    const description = 'Discover Bulusan Park, formally the Calapan City Recreational and Zoological Park in Barangay Bulusan, with its mini-zoo, open spaces, pavilion, and eco-trail access.';

    usePageMetadata('Bulusan Zoo | Calapan City', description, 'https://bulusanzoo.com/');

    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setReduceMotion(media.matches);
        update();
        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, []);

    return (
        <ReactLenis root options={{ lerp: reduceMotion ? 1 : 0.05, duration: reduceMotion ? 0 : 1.5, smoothWheel: !reduceMotion, smoothTouch: false, wheelMultiplier: 1.05, touchMultiplier: 2, infinite: false }}>
            <div className="relative min-h-[100dvh] bg-white">
                <Header />
                <AIFloatingButton />
                <main className="relative w-full overflow-x-clip">
                    <HeroSection />
                    <AboutSection />
                    <ExploreSection />
                    <ActivitiesSection />
                    <TrailSection />
                    <OfficialRecordsSection />
                    <ArrivalSection />
                    <VisitorSection navigate={navigate} />
                </main>
                <div className="relative z-50 w-full"><Footer /></div>
            </div>
        </ReactLenis>
    );
};

export default Home;
