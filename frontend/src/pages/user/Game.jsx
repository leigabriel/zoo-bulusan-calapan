import { Link } from 'react-router-dom';
import { ReactLenis } from 'lenis/react';
import { Play, Trophy, Compass, Pet, Download } from 'reicon-react';
import { PAGE_BG_GRADIENT } from '../../config/page-gradient';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import usePageMetadata from '../../hooks/use-page-metadata';

const GAME_URL = 'https://adventuregame.bulusanzoo.com';
const ANDROID_APK_URL = 'https://pub-2e54fcfc02914be28064e5210d94f00b.r2.dev/master/Bulusan-Zootopia-Adventure-Game-2.9.apk';

const highlights = [
    {
        title: 'Explore the park',
        description: 'See Bulusan Zoo in a playful new light and discover what makes the park worth visiting.',
        Icon: Compass,
    },
    {
        title: 'Meet the wildlife',
        description: 'Get to know the animals that call the park home as you make your way through the game.',
        Icon: Pet,
    },
    {
        title: 'Start in one click',
        description: 'No download and no account needed. The game runs in your browser, free to play.',
        Icon: Trophy,
    },
];

const Game = () => {
    usePageMetadata(
        'Bulusan Zootopia Adventure Game | Bulusan Zoo',
        'Play the Bulusan Zootopia Adventure Game, a free browser game inspired by Bulusan Zoo in Calapan City, Oriental Mindoro. Also available as an Android mobile download.',
        'https://bulusanzoo.com/game'
    );

    return (
        <ReactLenis root>
            <div className={`min-h-dvh text-black ${PAGE_BG_GRADIENT}`}>
                <Header />

                <section className="flex min-h-[45vh] w-full flex-col items-center justify-center px-4 pb-10 pt-24 md:min-h-[60vh] md:pb-16">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                        Bulusan Zootopia
                    </p>
                    <h1 className="mt-4 w-full max-w-full text-center text-[clamp(3rem,11vw,10rem)] font-bold leading-[1.05] tracking-tight text-black">
                        Adventure Game
                    </h1>
                    <p className="mt-6 max-w-2xl text-center text-sm font-medium leading-6 text-gray-600 md:text-lg md:leading-8">
                        A free browser game inspired by Bulusan Zoo. Explore the park, meet its wildlife, and see
                        Calapan&apos;s nature park from a new perspective.
                    </p>
                </section>

                <main className="mx-auto w-full max-w-[1500px] px-4 pb-20 md:px-8 md:pb-28">
                    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
                            <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                                    Free to play
                                </p>
                                <h2 className="mt-3 max-w-xl text-3xl font-bold leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl">
                                    The zoo, reimagined as an adventure
                                </h2>
                                <p className="mt-5 max-w-xl text-sm leading-7 text-gray-600 md:text-base">
                                    Bulusan Zootopia Adventure Game turns a walk through the park into something you
                                    can play in your browser or install on an Android phone. No account needed.
                                    Just open it, or download the app, and start exploring.
                                </p>

                                <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                                    <a
                                        href={GAME_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Play the Bulusan Zootopia Adventure Game (opens in a new tab)"
                                        className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-black px-8 py-4 text-center text-[11px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black sm:w-auto md:text-xs"
                                    >
                                        <Play size={16} aria-hidden="true" />
                                        Play the game
                                    </a>
                                    <a
                                        href={ANDROID_APK_URL}
                                        aria-label="Download the Bulusan Zootopia Android mobile version (APK file)"
                                        className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full border-2 border-black px-6 py-4 text-center text-[11px] font-bold uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black sm:w-auto md:text-xs"
                                    >
                                        <Download size={16} aria-hidden="true" />
                                        Download Android Mobile Version
                                    </a>
                                </div>
                                <p className="mt-3 max-w-xl text-xs leading-5 text-gray-500">
                                    Browser play opens in a new tab at adventuregame.bulusanzoo.com. The Android
                                    version downloads the APK file so you can install it on your phone.
                                </p>
                            </div>

                            <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden bg-[#64e282] p-8 sm:min-h-[420px]">
                                <img
                                    src="/images/bulusanzootopia_icon.png"
                                    alt="Close-up deer illustration for the Bulusan Zootopia Adventure Game"
                                    loading="eager"
                                    className="relative z-10 h-[260px] w-auto max-w-full object-contain sm:h-[360px] lg:h-[420px]"
                                />
                                <span className="absolute bottom-5 left-5 z-10 rounded-full border border-white/40 bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-600">
                                    Bulusan Zootopia
                                </span>
                            </div>
                        </div>
                    </section>

                    <section className="mt-16 md:mt-24" aria-labelledby="game-highlights-title">
                        <div className="max-w-2xl">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                                What to expect
                            </p>
                            <h2 id="game-highlights-title" className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
                                A different way to visit the park
                            </h2>
                        </div>

                        <div className="mt-8 grid gap-4 md:mt-12 md:grid-cols-3 md:gap-6">
                            {highlights.map(({ title, description, Icon }) => (
                                <article key={title} className="rounded-xl border border-gray-200 bg-white p-6 md:p-8">
                                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-green-800">
                                        <Icon size={20} aria-hidden="true" />
                                    </span>
                                    <h3 className="mt-5 text-xl font-bold tracking-tight">{title}</h3>
                                    <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
                                </article>
                            ))}
                        </div>
                    </section>
                </main>

                <section className="border-t border-black/10 bg-green-400 px-4 py-16 md:py-24">
                    <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-black/60">In person</p>
                        <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">See the real thing</h2>
                        <p className="mt-4 max-w-xl text-sm leading-7 text-black/70 md:text-base">
                            The game is only the beginning. Plan a visit to Bulusan Zoo and meet the animals in
                            person.
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link
                                to="/reservations"
                                className="inline-flex min-h-12 items-center justify-center rounded-full bg-black px-7 py-3 text-[11px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-gray-800"
                            >
                                Plan a visit
                            </Link>
                            <Link
                                to="/map"
                                className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-black px-7 py-3 text-[11px] font-bold uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white"
                            >
                                Find the zoo
                            </Link>
                        </div>
                    </div>
                </section>

                <Footer />
                <AIFloatingButton />
            </div>
        </ReactLenis>
    );
};

export default Game;
