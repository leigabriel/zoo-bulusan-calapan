import { useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AIFloatingButton from '../../components/common/AIFloatingButton';

const CITY_SOURCE = 'https://cityofcalapan.gov.ph/the-city-economic-enterprise-department-ceed/';
const TOURISM_SOURCE = 'https://www.travelorientalmindoro.ph/place/calapan-nature-park';
const HISTORY_SOURCE = 'https://pia4b.wordpress.com/2013/04/02/zoological-park-sa-calapan-bukas-na-sa-publiko/';
const DIRECTIONS_URL = 'https://www.google.com/maps/dir/?api=1&destination=13.40496178,121.1991656';

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

const facts = [
    { label: 'Formal name', value: 'Calapan City Recreational and Zoological Park' },
    { label: 'Common name', value: 'Bulusan Park' },
    { label: 'Location', value: 'Barangay Bulusan, Calapan City, Oriental Mindoro' },
    { label: 'Administration', value: 'City Economic Enterprise Department, City Government of Calapan' },
];

const AboutUs = () => {
    const description = 'Learn about Bulusan Park, the Calapan City Recreational and Zoological Park in Barangay Bulusan, its history, natural setting, recreation areas, and community role.';
    usePageMetadata('About Bulusan Park | Calapan City', description, 'https://bulusanzoo.com/about');

    return (
        <div className="min-h-screen overflow-x-hidden bg-[#f7f5ef] text-[#212631]">
            <Header />
            <AIFloatingButton />

            <main>
                <section className="mx-auto flex min-h-[92svh] max-w-[1500px] flex-col justify-between px-4 pb-10 pt-28 sm:px-6 md:px-10 md:pb-14 md:pt-32" aria-labelledby="about-title">
                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#212631]/50 sm:text-xs">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        A park of Calapan City
                    </div>

                    <div className="py-16 md:py-20">
                        <h1 id="about-title" className="max-w-6xl text-[clamp(3.4rem,10vw,9rem)] font-medium leading-[0.82] tracking-[-0.06em] text-black">
                            Bulusan<br />Park
                        </h1>
                        <p className="mt-10 max-w-2xl text-base font-medium leading-7 text-[#212631]/65 sm:text-lg sm:leading-8 md:ml-auto md:mt-14">
                            Formally the Calapan City Recreational and Zoological Park, Bulusan Park is a City-managed destination for family recreation, environmental education, leisure, and community gatherings.
                        </p>
                    </div>

                    <div className="grid border-y border-[#212631]/15 sm:grid-cols-2 lg:grid-cols-4">
                        {facts.map((fact) => (
                            <div key={fact.label} className="border-b border-[#212631]/15 py-5 sm:px-5 sm:odd:border-r lg:border-b-0 lg:border-r lg:first:pl-0 lg:last:border-r-0">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#212631]/40">{fact.label}</p>
                                <p className="mt-3 text-sm font-semibold leading-6">{fact.value}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="bg-white px-4 py-20 sm:px-6 sm:py-28 md:px-10" aria-labelledby="park-story-title">
                    <div className="mx-auto grid max-w-[1500px] gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#212631]/40">Park story</p>
                            <h2 id="park-story-title" className="mt-5 text-[clamp(2.7rem,6vw,6rem)] font-medium leading-[0.92] tracking-[-0.055em] text-black">A public park with a documented history.</h2>
                        </div>
                        <div className="lg:pt-16">
                            <p className="text-xl font-medium leading-8 text-[#212631] sm:text-2xl sm:leading-9">
                                A Philippine Information Agency report published on April 2, 2013 described the Calapan Recreational and Zoological Park as newly open to the public in Barangay Bulusan.
                            </p>
                            <p className="mt-7 text-base leading-7 text-[#212631]/60">
                                The report recorded the formal opening by City officials and described the park at that point in time. Its animal and facility details are historical, not a statement of what visitors will find today.
                            </p>
                            <a href={HISTORY_SOURCE} target="_blank" rel="noreferrer" className="mt-8 inline-flex min-h-11 items-center border-b border-black pb-1 text-xs font-bold uppercase tracking-[0.2em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-600">
                                Read the 2013 PIA report
                            </a>
                        </div>
                    </div>
                </section>

                <section className="bg-[#1a211b] px-4 py-20 text-white sm:px-6 sm:py-28 md:px-10" aria-labelledby="nature-title">
                    <div className="mx-auto max-w-[1500px]">
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-green-300">Nature and recreation</p>
                        <h2 id="nature-title" className="mt-5 max-w-5xl text-[clamp(3rem,8vw,7.5rem)] font-medium leading-[0.86] tracking-[-0.06em]">Room to learn,<br />gather, and explore.</h2>

                        <div className="mt-16 grid border-t border-white/15 md:grid-cols-3 md:divide-x md:divide-white/15">
                            <article className="border-b border-white/15 py-8 md:border-b-0 md:pr-8">
                                <span className="text-xs font-bold tracking-[0.2em] text-green-300">01</span>
                                <h3 className="mt-10 text-2xl font-semibold">Natural setting</h3>
                                <p className="mt-4 text-sm leading-6 text-white/58">The provincial tourism portal documents century-old trees, picnic and camping areas, recreation space, and wall-climbing facilities within the park.</p>
                            </article>
                            <article className="border-b border-white/15 py-8 md:border-b-0 md:px-8">
                                <span className="text-xs font-bold tracking-[0.2em] text-green-300">02</span>
                                <h3 className="mt-10 text-2xl font-semibold">Wildlife</h3>
                                <p className="mt-4 text-sm leading-6 text-white/58">The City describes a mini-zoo with various animal species. Because no current official inventory is published, species lists from historical reports are not presented as current.</p>
                            </article>
                            <article className="py-8 md:pl-8">
                                <span className="text-xs font-bold tracking-[0.2em] text-green-300">03</span>
                                <h3 className="mt-10 text-2xl font-semibold">Community space</h3>
                                <p className="mt-4 text-sm leading-6 text-white/58">Landscaped open areas support leisure and recreation, while the multi-purpose pavilion serves events and community gatherings.</p>
                            </article>
                        </div>
                    </div>
                </section>

                <section className="bg-green-400 px-4 py-20 sm:px-6 sm:py-28 md:px-10" aria-labelledby="eco-trail-title">
                    <div className="mx-auto grid max-w-[1500px] gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-24">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.25em] text-black/45">Bulusan eco-trail</p>
                            <h2 id="eco-trail-title" className="mt-5 text-[clamp(3rem,8vw,7rem)] font-medium leading-[0.86] tracking-[-0.06em] text-black">A route from<br />park to shore.</h2>
                        </div>
                        <div className="border-l border-black/25 pl-5 sm:pl-8">
                            <p className="text-xl font-semibold leading-8 text-black/80">The official provincial tourism listing identifies the park as the entry point to the Bulusan eco-trail.</p>
                            <p className="mt-5 text-sm font-medium leading-6 text-black/55">It describes an approximately one-hour route ending at the seashore in Barangay Parang. Visitors should confirm current access, trail conditions, and local guidance before a hike.</p>
                            <a href={TOURISM_SOURCE} target="_blank" rel="noreferrer" className="mt-8 inline-flex min-h-11 items-center border-b border-black pb-1 text-xs font-bold uppercase tracking-[0.2em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">View official tourism information</a>
                        </div>
                    </div>
                </section>

                <section className="bg-[#f7f5ef] px-4 py-20 sm:px-6 sm:py-28 md:px-10" aria-labelledby="visit-title">
                    <div className="mx-auto max-w-[1500px]">
                        <div className="grid gap-12 lg:grid-cols-2 lg:gap-24">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#212631]/40">Visit information</p>
                                <h2 id="visit-title" className="mt-5 text-[clamp(3rem,7vw,6.5rem)] font-medium leading-[0.9] tracking-[-0.055em] text-black">Plan with current information.</h2>
                            </div>
                            <div>
                                <dl className="divide-y divide-[#212631]/15 border-y border-[#212631]/15">
                                    <div className="grid gap-2 py-6 sm:grid-cols-[8rem_1fr]"><dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#212631]/40">Location</dt><dd className="font-semibold leading-6">Barangay Bulusan, Calapan City, Oriental Mindoro</dd></div>
                                    <div className="grid gap-2 py-6 sm:grid-cols-[8rem_1fr]"><dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#212631]/40">Contact</dt><dd><a href="tel:+63432887291" className="font-semibold underline decoration-black/25 underline-offset-4">(043) 288-7291</a><span className="mt-1 block text-sm text-[#212631]/50">City CEED park contact</span></dd></div>
                                    <div className="grid gap-2 py-6 sm:grid-cols-[8rem_1fr]"><dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#212631]/40">Directions</dt><dd><a href={DIRECTIONS_URL} target="_blank" rel="noreferrer" className="font-semibold underline decoration-black/25 underline-offset-4">Open Google Maps directions</a></dd></div>
                                </dl>
                                <p className="mt-6 text-sm leading-6 text-[#212631]/50">Operating schedules, admission arrangements, and available activities may change. Confirm with the City Government of Calapan before visiting.</p>
                            </div>
                        </div>

                        <div className="mt-16 flex flex-col gap-4 border-t border-[#212631]/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
                            <p className="max-w-xl text-sm font-medium leading-6 text-[#212631]/55">Current park information and documentary photographs are available through the official source pages.</p>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <a href={CITY_SOURCE} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full bg-black px-6 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">City Government source</a>
                                <a href={TOURISM_SOURCE} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full border border-black px-6 py-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-black hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">Tourism source</a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default AboutUs;
