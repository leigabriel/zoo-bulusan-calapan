import { Link } from 'react-router-dom';
import { ReactLenis } from 'lenis/react';
import { Play, Download } from 'reicon-react';
import { PAGE_BG_GRADIENT } from '../../config/page-gradient';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import usePageMetadata from '../../hooks/use-page-metadata';

const GAME_URL = 'https://adventuregame.bulusanzoo.com';
const ANDROID_APK_URL = 'https://pub-2e54fcfc02914be28064e5210d94f00b.r2.dev/master/Bulusan-Zootopia-Adventure-Game-4.6.apk';

const screens = [
    {
        image: '/images/bulusan-zootopia-game-images/menu.png',
        alt: 'Bulusan Zootopia Adventure Game main menu with Play, Settings, and Quit options',
        title: 'Start your visit',
        description:
            'The main menu keeps the start simple. Jump into Play, open Settings, or check the Guide, Player, and Credits screens before you head into the park.',
    },
    {
        image: '/images/bulusan-zootopia-game-images/scene1.png',
        alt: 'Park entrance with the Bulusan Zootopia sign and entrance monument',
        title: 'The park entrance',
        description:
            'Arrive at the park entrance and follow the path past the Bulusan Zootopia sign. Your current task stays on screen, with the guide, book, and photo tools within reach.',
    },
    {
        image: '/images/bulusan-zootopia-game-images/scene2.png',
        alt: 'Wooden bridge crossing a river in Bulusan Zootopia',
        title: 'River crossing',
        description:
            'Cross the wooden bridge and follow the river through tree-lined fields. Paths branch off toward flower patches, fences, and quieter corners of the park.',
    },
    {
        image: '/images/bulusan-zootopia-game-images/scene3.png',
        alt: 'Birds flying below clouds and the sun above the treetops',
        title: 'Above the treetops',
        description:
            'Look up from the trails to see clouds, birds, and open sky above the treetops. The low-poly world carries the park atmosphere from the ground to the sky.',
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

                <main>
                    <section className="mx-auto w-full max-w-5xl px-4 pb-16 pt-28 md:px-8 md:pb-24 md:pt-32">
                        <div className="flex flex-col items-center gap-8 md:gap-10 lg:flex-row lg:items-center lg:gap-14">
                            <img
                                src="/images/bulusanzootopia_icon.png"
                                alt="Bulusan Zootopia Adventure Game icon"
                                width={1254}
                                height={1254}
                                loading="eager"
                                className="h-36 w-36 shrink-0 rounded-[2rem] object-cover shadow-xl ring-1 ring-black/10 sm:h-44 sm:w-44 lg:h-56 lg:w-56"
                            />

                            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                                    Bulusan Zootopia
                                </p>
                                <h1 className="mt-3 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                                    Adventure Game
                                </h1>
                                <p className="mt-4 max-w-xl text-sm leading-7 text-gray-600 md:text-base">
                                    A free browser game inspired by Bulusan Zoo. Explore the park, meet its
                                    wildlife, and see the nature park in Calapan from a new perspective.
                                </p>

                                <div className="mt-7 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
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
                                    Browser play opens in a new tab. The Android version downloads the APK file
                                    so you can install it on your phone.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section
                        aria-labelledby="screenshots-title"
                        className="mx-auto w-full max-w-[1500px] px-4 pb-20 md:px-8 md:pb-28"
                    >
                        <div className="max-w-2xl">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                                Screenshots
                            </p>
                            <h2 id="screenshots-title" className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
                                A look inside the game
                            </h2>
                            <p className="mt-4 text-sm leading-7 text-gray-600 md:text-base">
                                Four views from Bulusan Zootopia, from the main menu to the park trails and the
                                sky above.
                            </p>
                        </div>

                        <div className="mt-10 space-y-14 md:mt-16 md:space-y-20">
                            {screens.map((screen, index) => {
                                const reverse = index % 2 === 1;

                                return (
                                    <article
                                        key={screen.image}
                                        className={`grid items-center gap-5 md:gap-8 lg:gap-12 ${
                                            reverse
                                                ? 'lg:grid-cols-[0.8fr_1.2fr]'
                                                : 'lg:grid-cols-[1.2fr_0.8fr]'
                                        }`}
                                    >
                                        <figure
                                            className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ${
                                                reverse ? 'lg:order-2' : ''
                                            }`}
                                        >
                                            <img
                                                src={screen.image}
                                                alt={screen.alt}
                                                width={1642}
                                                height={1013}
                                                loading="lazy"
                                                decoding="async"
                                                className="h-auto w-full"
                                            />
                                        </figure>
                                        <div className={reverse ? 'lg:order-1' : ''}>
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                                                Screenshot {String(index + 1).padStart(2, '0')}
                                            </p>
                                            <h3 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
                                                {screen.title}
                                            </h3>
                                            <p className="mt-3 text-sm leading-7 text-gray-600 md:text-base">
                                                {screen.description}
                                            </p>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>

                    <section className="border-t border-black/10 bg-green-400 px-4 py-16 md:py-24">
                        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-black/60">
                                In person
                            </p>
                            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">
                                See the real thing
                            </h2>
                            <p className="mt-4 max-w-xl text-sm leading-7 text-black/70 md:text-base">
                                The game is only the beginning. Plan a visit to Bulusan Zoo and meet the animals
                                in person.
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
                </main>

                <Footer />
                <AIFloatingButton />
            </div>
        </ReactLenis>
    );
};

export default Game;
