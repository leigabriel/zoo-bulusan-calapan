import { Link } from 'react-router-dom';
import { Play, Trophy, Compass, Pet, ChevronLeft } from 'reicon-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import usePageMetadata from '../../hooks/use-page-metadata';

const GAME_URL = 'https://adventuregame.bulusanzoo.com';

const highlights = [
    {
        title: 'Explore the zoo',
        description: 'Wander through a playful take on Bulusan Zoo and see the park from a different point of view.',
        Icon: Compass,
    },
    {
        title: 'Meet the wildlife',
        description: 'Get to know the animals that call the park home as you make your way around.',
        Icon: Pet,
    },
    {
        title: 'Play in your browser',
        description: 'No download and no account needed. The adventure starts with one click.',
        Icon: Trophy,
    },
];

const Game = () => {
    usePageMetadata(
        'Bulusan Zootopia Adventure Game | Bulusan Zoo',
        'Play the Bulusan Zootopia Adventure Game, a free browser game inspired by Bulusan Zoo in Calapan City, Oriental Mindoro.',
        'https://bulusanzoo.com/game'
    );

    return (
        <div className="min-h-screen bg-[#0b1a12] text-white">
            <Header />

            <main>
                <section
                    data-header-theme="dark"
                    className="relative flex min-h-screen items-center overflow-hidden px-4 pb-20 pt-28 sm:px-6 md:px-10"
                >
                    <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(198,254,105,0.16),transparent_45%),radial-gradient(circle_at_85%_75%,rgba(5,223,114,0.14),transparent_50%)]"
                    />
                    <div
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0b1a12] to-transparent"
                    />

                    <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#c6fe69]">
                                Bulusan Zootopia
                            </p>
                            <h1 className="mt-4 max-w-xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                                Adventure Game
                            </h1>
                            <p className="mt-5 max-w-xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
                                Step into a free browser game inspired by Bulusan Zoo. Explore the park, meet the
                                wildlife, and see Calapan&apos;s nature park from a new perspective.
                            </p>

                            <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                                <a
                                    href={GAME_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Play the Bulusan Zootopia Adventure Game (opens in a new tab)"
                                    className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#c6fe69] px-9 py-4 text-sm font-black uppercase tracking-[0.16em] text-[#0b1a12] shadow-[0_18px_45px_-15px_rgba(198,254,105,0.65)] transition-all hover:-translate-y-0.5 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c6fe69]"
                                >
                                    <Play size={18} className="transition-transform group-hover:translate-x-0.5" />
                                    Play
                                </a>
                                <span className="text-xs font-medium text-white/50">
                                    Opens in a new tab at adventuregame.bulusanzoo.com
                                </span>
                            </div>

                            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-white/55">
                                <Link to="/reservations" className="transition-colors hover:text-[#c6fe69]">
                                    Plan a zoo visit
                                </Link>
                                <span aria-hidden="true" className="hidden h-1 w-1 rounded-full bg-white/30 sm:block" />
                                <Link to="/map" className="transition-colors hover:text-[#c6fe69]">
                                    Find the zoo
                                </Link>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-black/40">
                                <div className="flex h-[320px] items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(198,254,105,0.14),transparent_60%)] p-8 sm:h-[420px] lg:h-[500px]">
                                    <img
                                        src="/images/origami/deer.webp"
                                        alt="Origami deer illustration for the Bulusan Zootopia Adventure Game"
                                        loading="eager"
                                        className="h-full w-full object-contain drop-shadow-[0_24px_40px_rgba(0,0,0,0.45)]"
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-4 border-t border-white/10 bg-[#0f2418] px-5 py-4">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/40">
                                            Free to play
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-white">Bulusan Zootopia Adventure</p>
                                    </div>
                                    <Play size={20} className="flex-shrink-0 text-[#c6fe69]" aria-hidden="true" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-[#f4f6f0] px-4 py-16 text-[#1f3328] sm:px-6 sm:py-20 md:px-10" aria-labelledby="game-highlights-title">
                    <div className="mx-auto max-w-6xl">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#6d8572]">What to expect</p>
                                <h2 id="game-highlights-title" className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                                    A different way to visit the park
                                </h2>
                            </div>
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-[#315b37] transition-colors hover:text-[#1f3328]"
                            >
                                <ChevronLeft size={16} aria-hidden="true" />
                                Back to Bulusan Zoo
                            </Link>
                        </div>

                        <div className="mt-8 grid gap-4 sm:grid-cols-3">
                            {highlights.map(({ title, description, Icon }) => (
                                <div key={title} className="rounded-3xl border border-[#dce5dc] bg-white p-6 shadow-sm">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f2e6] text-[#315b37]">
                                        <Icon size={20} aria-hidden="true" />
                                    </span>
                                    <h3 className="mt-4 text-lg font-bold tracking-tight">{title}</h3>
                                    <p className="mt-2 text-sm leading-6 text-[#52675a]">{description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
            <AIFloatingButton />
        </div>
    );
};

export default Game;
