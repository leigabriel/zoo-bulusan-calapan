import React, { useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const PixelFox = () => (
    <svg viewBox="0 0 32 32" width="48" height="48" fill="none" style={{ imageRendering: 'pixelated' }}>
        <rect x="2" y="4" width="4" height="6" fill="#e8631a" />
        <rect x="26" y="4" width="4" height="6" fill="#e8631a" />
        <rect x="4" y="2" width="4" height="4" fill="#e8631a" />
        <rect x="24" y="2" width="4" height="4" fill="#e8631a" />
        <rect x="6" y="0" width="2" height="2" fill="#fff" />
        <rect x="24" y="0" width="2" height="2" fill="#fff" />
        <rect x="6" y="6" width="20" height="14" fill="#e8631a" />
        <rect x="4" y="8" width="24" height="10" fill="#e8631a" />
        <rect x="10" y="12" width="4" height="4" fill="#1a1a1a" />
        <rect x="18" y="12" width="4" height="4" fill="#1a1a1a" />
        <rect x="11" y="13" width="2" height="2" fill="#fff" />
        <rect x="19" y="13" width="2" height="2" fill="#fff" />
        <rect x="12" y="18" width="8" height="2" fill="#c04a10" />
        <rect x="14" y="16" width="4" height="4" fill="#ffb8a0" />
        <rect x="6" y="20" width="4" height="2" fill="#ffb8a0" />
        <rect x="22" y="20" width="4" height="2" fill="#ffb8a0" />
        <rect x="4" y="22" width="6" height="4" fill="#e8631a" />
        <rect x="22" y="22" width="6" height="4" fill="#e8631a" />
        <rect x="10" y="22" width="12" height="6" fill="#e8631a" />
        <rect x="2" y="24" width="4" height="2" fill="#e8631a" />
        <rect x="26" y="24" width="4" height="2" fill="#e8631a" />
        <rect x="28" y="20" width="4" height="6" fill="#e8631a" />
        <rect x="30" y="18" width="2" height="4" fill="#ffb8a0" />
    </svg>
);

const PixelTree = () => (
    <svg viewBox="0 0 32 40" width="44" height="56" fill="none" style={{ imageRendering: 'pixelated' }}>
        <rect x="12" y="28" width="8" height="12" fill="#7a4a1e" />
        <rect x="10" y="30" width="12" height="2" fill="#5c3410" />
        <rect x="8" y="16" width="16" height="14" fill="#1a8c3a" />
        <rect x="6" y="18" width="20" height="10" fill="#1a8c3a" />
        <rect x="4" y="20" width="24" height="6" fill="#1a8c3a" />
        <rect x="10" y="8" width="12" height="10" fill="#22b84e" />
        <rect x="8" y="10" width="16" height="8" fill="#22b84e" />
        <rect x="12" y="4" width="8" height="6" fill="#22b84e" />
        <rect x="14" y="2" width="4" height="4" fill="#22b84e" />
        <rect x="6" y="20" width="4" height="4" fill="#2ed460" />
        <rect x="20" y="16" width="4" height="4" fill="#2ed460" />
        <rect x="12" y="12" width="4" height="4" fill="#2ed460" />
    </svg>
);

const PixelPaw = () => (
    <svg viewBox="0 0 24 24" width="36" height="36" fill="none" style={{ imageRendering: 'pixelated' }}>
        <rect x="4" y="0" width="4" height="4" fill="#212631" />
        <rect x="10" y="0" width="4" height="4" fill="#212631" />
        <rect x="16" y="0" width="4" height="4" fill="#212631" />
        <rect x="2" y="4" width="4" height="4" fill="#212631" />
        <rect x="4" y="8" width="16" height="10" fill="#212631" />
        <rect x="2" y="10" width="4" height="6" fill="#212631" />
        <rect x="18" y="10" width="4" height="6" fill="#212631" />
        <rect x="4" y="18" width="4" height="4" fill="#212631" />
        <rect x="16" y="18" width="4" height="4" fill="#212631" />
        <rect x="8" y="20" width="8" height="4" fill="#212631" />
        <rect x="8" y="10" width="2" height="2" fill="#ebebeb" />
        <rect x="14" y="10" width="2" height="2" fill="#ebebeb" />
    </svg>
);

const PixelLeaf = () => (
    <svg viewBox="0 0 20 24" width="28" height="34" fill="none" style={{ imageRendering: 'pixelated' }}>
        <rect x="8" y="0" width="4" height="2" fill="#22b84e" />
        <rect x="6" y="2" width="8" height="2" fill="#22b84e" />
        <rect x="4" y="4" width="12" height="4" fill="#2ed460" />
        <rect x="2" y="8" width="16" height="4" fill="#2ed460" />
        <rect x="4" y="12" width="12" height="4" fill="#22b84e" />
        <rect x="6" y="16" width="8" height="4" fill="#1a8c3a" />
        <rect x="8" y="20" width="4" height="2" fill="#7a4a1e" />
        <rect x="10" y="4" width="4" height="6" fill="#3dff7a" />
    </svg>
);

const PixelBird = () => (
    <svg viewBox="0 0 28 24" width="42" height="36" fill="none" style={{ imageRendering: 'pixelated' }}>
        <rect x="16" y="2" width="6" height="4" fill="#26bc61" />
        <rect x="20" y="4" width="6" height="2" fill="#1a8c3a" />
        <rect x="8" y="4" width="14" height="8" fill="#212631" />
        <rect x="6" y="6" width="4" height="4" fill="#212631" />
        <rect x="2" y="4" width="6" height="2" fill="#212631" />
        <rect x="0" y="6" width="4" height="4" fill="#212631" />
        <rect x="2" y="10" width="4" height="2" fill="#212631" />
        <rect x="18" y="4" width="2" height="2" fill="#ebebeb" />
        <rect x="10" y="12" width="8" height="6" fill="#212631" />
        <rect x="8" y="14" width="2" height="4" fill="#212631" />
        <rect x="18" y="14" width="2" height="4" fill="#212631" />
        <rect x="10" y="18" width="4" height="2" fill="#26bc61" />
        <rect x="14" y="18" width="4" height="2" fill="#26bc61" />
    </svg>
);

const PixelMushroom = () => (
    <svg viewBox="0 0 24 28" width="36" height="42" fill="none" style={{ imageRendering: 'pixelated' }}>
        <rect x="8" y="16" width="8" height="10" fill="#d4c9b0" />
        <rect x="6" y="18" width="12" height="6" fill="#d4c9b0" />
        <rect x="4" y="8" width="16" height="10" fill="#212631" />
        <rect x="2" y="10" width="20" height="6" fill="#212631" />
        <rect x="6" y="6" width="12" height="4" fill="#212631" />
        <rect x="10" y="4" width="4" height="4" fill="#212631" />
        <rect x="6" y="10" width="4" height="4" fill="#ebebeb" />
        <rect x="14" y="8" width="4" height="4" fill="#ebebeb" />
        <rect x="10" y="14" width="2" height="2" fill="#ebebeb" />
    </svg>
);

const PixelStar = ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" style={{ imageRendering: 'pixelated' }}>
        <rect x="5" y="0" width="2" height="2" fill="#ffdd45" />
        <rect x="5" y="10" width="2" height="2" fill="#ffdd45" />
        <rect x="0" y="5" width="2" height="2" fill="#ffdd45" />
        <rect x="10" y="5" width="2" height="2" fill="#ffdd45" />
        <rect x="3" y="3" width="2" height="2" fill="#ffdd45" />
        <rect x="7" y="3" width="2" height="2" fill="#ffdd45" />
        <rect x="3" y="7" width="2" height="2" fill="#ffdd45" />
        <rect x="7" y="7" width="2" height="2" fill="#ffdd45" />
        <rect x="4" y="4" width="4" height="4" fill="#ffdd45" />
    </svg>
);

/* icon label shown on hover */
const ICON_LABELS = ['Fox', 'Tree', 'Bird', 'Mushroom', 'Paw', 'Leaf'];

const icons = [
    { comp: <PixelFox />, top: '14%', left: '6%', dur: '3.2s', delay: '0s', side: 'left', bg: 'bg-[#212631]', hbg: 'hover:bg-[#ffdd45]' },
    { comp: <PixelTree />, top: '60%', left: '4%', dur: '4.1s', delay: '0.6s', side: 'left', bg: 'bg-[#26bc61]', hbg: 'hover:bg-[#ffdd45]' },
    { comp: <PixelBird />, top: '10%', right: '5%', dur: '2.8s', delay: '0.3s', side: 'right', bg: 'bg-[#26bc61]', hbg: 'hover:bg-[#ffdd45]' },
    { comp: <PixelMushroom />, top: '62%', right: '5%', dur: '3.6s', delay: '0.9s', side: 'right', bg: 'bg-[#212631]', hbg: 'hover:bg-[#ffdd45]' },
    { comp: <PixelPaw />, top: '38%', left: '2%', dur: '3.8s', delay: '1.1s', side: 'left', bg: 'bg-[#ebebeb] border-2 border-[#212631]/20', hbg: 'hover:bg-[#ffdd45] hover:border-[#ffdd45]' },
    { comp: <PixelLeaf />, top: '36%', right: '3%', dur: '2.6s', delay: '0.5s', side: 'right', bg: 'bg-[#26bc61]', hbg: 'hover:bg-[#ffdd45]' },
];

const starPositions = [
    { top: '5%', left: '18%', size: 10 },
    { top: '7%', right: '20%', size: 8 },
    { top: '88%', left: '22%', size: 8 },
    { top: '90%', right: '18%', size: 10 },
    { top: '50%', left: '1%', size: 6 },
    { top: '48%', right: '1%', size: 6 },
];

const ConfirmModal = ({ onConfirm, onCancel }) => (
    <AnimatePresence>
        <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
            <motion.div
                className="absolute inset-0 bg-black/60"
                onClick={onCancel}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            />
            <motion.div
                className="relative z-10 flex flex-col items-center w-full max-w-sm p-6 sm:p-8
                           bg-[#ebebeb] border-4 border-[#212631]
                           shadow-[8px_8px_0_#212631] font-mono"
                initial={{ scale: 0.7, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            >
                {/* label */}
                <p className="text-[11px] font-black tracking-[0.2em] text-[#ffdd45] mb-1 uppercase
                               [text-shadow:1px_1px_0_#212631]">
                    ★ MiniZoo ★
                </p>
                {/* sub-label */}
                <p className="text-[9px] font-bold tracking-[0.15em] text-[#26bc61] mb-3 uppercase">
                    Wildlife Adventure
                </p>
                <div className="flex gap-2.5 mb-4">
                    <PixelFox /><PixelBird /><PixelMushroom />
                </div>
                <h3 className="text-base sm:text-lg font-black text-[#212631] text-center leading-tight mb-2 uppercase tracking-tight">
                    Enter the forest?
                </h3>
                <p className="text-[11px] text-[#212631]/50 text-center leading-relaxed mb-6">
                    You're about to leave this page<br />and venture into MiniZoo.
                </p>
                <div className="flex gap-3 w-full">
                    <button
                        onClick={onCancel}
                        className="flex-1 font-mono font-black text-xs tracking-widest uppercase
                                   text-[#212631] bg-transparent
                                   border-[3px] border-[#212631]/30 py-2.5
                                   hover:border-[#212631] transition-colors cursor-pointer"
                    >
                        ✕ Stay
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 font-mono font-black text-xs tracking-widest uppercase
                                   text-[#212631] bg-[#ffdd45]
                                   border-[3px] border-[#ffdd45] py-2.5
                                   shadow-[4px_4px_0_#212631]
                                   hover:-translate-x-0.5 hover:-translate-y-0.5
                                   hover:shadow-[6px_6px_0_#212631]
                                   transition-all duration-100 cursor-pointer"
                    >
                        ▶ Play!
                    </button>
                </div>
            </motion.div>
        </motion.div>
    </AnimatePresence>
);

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const prog = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
const lerp = (a, b, t) => a + (b - a) * t;

const GameSection = () => {
    const containerRef = useRef(null);
    const stickyRef = useRef(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const sticky = stickyRef.current;
        if (!sticky) return;
        let raf = null, prev = -1;

        const update = () => {
            const el = containerRef.current;
            if (!el) return;
            const { top, height } = el.getBoundingClientRect();
            const p = clamp(-top / (height - window.innerHeight), 0, 1);
            if (Math.abs(p - prev) < 0.001) return;
            prev = p;

            sticky.style.setProperty('--text-op', 1 - prog(p, 0, 0.28));
            sticky.style.setProperty('--vid-sc', lerp(0.28, 1, prog(p, 0, 0.38)));
            sticky.style.setProperty('--deco-op', 1 - prog(p, 0, 0.22));
            sticky.style.setProperty('--lx', `${lerp(0, -220, prog(p, 0, 0.3))}%`);
            sticky.style.setProperty('--rx', `${lerp(0, 220, prog(p, 0, 0.3))}%`);
            sticky.style.setProperty('--play-op', prog(p, 0.34, 0.44));
            sticky.style.setProperty('--play-y', `${lerp(20, 0, prog(p, 0.34, 0.44))}px`);
            sticky.style.setProperty('--play-ptr', prog(p, 0.34, 0.44) > 0.5 ? 'auto' : 'none');
        };

        const onScroll = () => {
            if (raf) return;
            raf = requestAnimationFrame(() => { raf = null; update(); });
        };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
    }, []);

    return (
        <section
            ref={containerRef}
            className="relative w-full bg-[#ebebeb]"
            style={{ height: '300vh' }}
        >
            <style>{`
                @keyframes blink   { 0%,100%{opacity:1}   50%{opacity:0} }
                @keyframes twinkle { 0%,100%{opacity:.15} 50%{opacity:.7} }
                @keyframes float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
                .gs-blink   { animation: blink   1s  step-end    infinite; }
                .gs-twinkle { animation: twinkle 2s  ease-in-out infinite; }
                .gs-float   { animation: float var(--fdur,3s) var(--fdel,0s) ease-in-out infinite; }
                .gs-text    { opacity: var(--text-op,1); will-change: opacity; }
                .gs-vid     { transform: scale(var(--vid-sc,0.28)); will-change: transform; transform-origin: center; }
                .gs-deco    { opacity: var(--deco-op,1); will-change: opacity,transform; }
                .gs-deco-l  { transform: translateX(var(--lx,0%)); }
                .gs-deco-r  { transform: translateX(var(--rx,0%)); }
                .gs-play    {
                    opacity: var(--play-op,0);
                    transform: translateX(-50%) translateY(var(--play-y,20px));
                    pointer-events: var(--play-ptr,none);
                    will-change: opacity,transform;
                }
                /* icon hover — pause float, lift, label reveal */
                .gs-icon-wrap:hover .gs-float { animation-play-state: paused; }
                .gs-icon-wrap:hover .gs-icon-box {
                    transform: translateY(-4px) scale(1.08);
                    box-shadow: 6px 6px 0 rgba(33,38,49,0.28);
                }
                .gs-icon-box { transition: transform 0.15s, box-shadow 0.15s; }
                .gs-icon-label {
                    opacity: 0;
                    transform: translateY(4px);
                    transition: opacity 0.15s, transform 0.15s;
                    pointer-events: none;
                }
                .gs-icon-wrap:hover .gs-icon-label {
                    opacity: 1;
                    transform: translateY(0);
                }
                /* hide side icons on very small screens to avoid clutter */
                @media (max-width: 360px) {
                    .gs-deco { display: none; }
                }
            `}</style>

            <div
                ref={stickyRef}
                className="sticky top-0 w-full h-svh overflow-hidden flex items-center justify-center bg-[#ebebeb]"
            >
                {/* dot grid */}
                <div
                    className="absolute inset-0 z-0 pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(circle, rgba(33,38,49,0.1) 1px, transparent 1px)',
                        backgroundSize: '28px 28px',
                    }}
                />

                {/* twinkle stars — hidden on xs */}
                {starPositions.map((s, i) => (
                    <div
                        key={i}
                        className="absolute z-10 pointer-events-none gs-twinkle hidden sm:block"
                        style={{ top: s.top, left: s.left, right: s.right, animationDelay: `${i * 0.4}s` }}
                    >
                        <PixelStar size={s.size} />
                    </div>
                ))}

                {/* video reveal */}
                <div className="gs-vid absolute inset-0 z-20 overflow-hidden bg-[#ebebeb]">
                    <video
                        src="/minizoo.mp4"
                        autoPlay loop muted playsInline
                        className="min-w-full min-h-full w-[130%] h-[130%] object-cover scale-[1.02]"
                    />
                </div>

                {/* headline */}
                <div className="gs-text absolute z-40 flex flex-col items-center justify-center w-full h-full pointer-events-none px-4">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <div
                            className="font-mono font-black tracking-tight leading-[0.88] select-none"
                            style={{ fontSize: 'clamp(2rem, 10.5vw, 9rem)' }}
                        >
                            <span
                                className="block text-[#212631]"
                                style={{ textShadow: '4px 4px 0 rgba(38,188,97,0.25), 8px 8px 0 rgba(33,38,49,0.06)' }}
                            >
                                play our game
                            </span>
                            <span
                                className="block text-[#26bc61]"
                                style={{ textShadow: '4px 4px 0 rgba(33,38,49,0.12), 8px 8px 0 rgba(33,38,49,0.05)' }}
                            >
                                called minizoo.
                            </span>
                        </div>
                        {/* yellow accent tag line */}
                        <p
                            className="font-mono font-black text-[#ffdd45] uppercase tracking-[0.2em] mt-1 text-[10px] sm:text-xs
                                       [text-shadow:1px_1px_0_rgba(33,38,49,0.25)]"
                        >
                            ★ Wildlife · Feed · Explore ★
                        </p>
                        <p
                            className="gs-blink font-mono text-[#212631]/40 uppercase tracking-[0.22em] text-[9px] sm:text-[11px]"
                        >
                            ▶ feed &amp; explore ◀
                        </p>
                    </div>
                </div>

                {/* floating pixel icons — pointer-events enabled for hover */}
                {icons.map((icon, i) => (
                    <div
                        key={i}
                        className={`absolute z-30 gs-deco gs-icon-wrap cursor-pointer
                                    ${icon.side === 'left' ? 'gs-deco-l' : 'gs-deco-r'}
                                    hidden sm:block`}
                        style={{ top: icon.top, left: icon.left, right: icon.right }}
                    >
                        <div className="gs-float" style={{ '--fdur': icon.dur, '--fdel': icon.delay }}>
                            {/* box */}
                            <div className={`gs-icon-box ${icon.bg} ${icon.hbg} p-2.5 shadow-[4px_4px_0_rgba(33,38,49,0.18)]`}>
                                {icon.comp}
                            </div>
                            {/* hover label */}
                            <p className="gs-icon-label text-center font-mono font-black text-[9px] uppercase
                                          tracking-widest text-[#ffdd45] mt-1
                                          [text-shadow:1px_1px_0_#212631]">
                                {ICON_LABELS[i]}
                            </p>
                        </div>
                    </div>
                ))}

                {/* food bag HUD */}
                <div
                    className="gs-deco absolute z-30 right-[5vw] bottom-[10vh] pointer-events-none text-right font-mono hidden sm:block"
                    style={{ opacity: 'var(--deco-op,1)' }}
                >
                    <p className="text-[11px] font-black text-[#ffdd45] leading-snug [text-shadow:1px_1px_0_rgba(33,38,49,0.3)]">
                        FOOD BAG
                    </p>
                    <p className="text-[11px] text-[#212631]/60 leading-snug">▓▓▓▓▓▓░░ 75%</p>
                    <p className="text-[9px]  text-[#212631]/35 leading-snug">BERRIES × 12</p>
                </div>

                {/* play button */}
                <div className="gs-play absolute z-50 bottom-10 sm:bottom-12 left-1/2">
                    <button
                        onClick={() => setShowModal(true)}
                        className="font-mono font-black text-sm sm:text-[15px] tracking-[0.18em] uppercase
                                   text-[#ebebeb] bg-[#212631]
                                   border-4 border-[#212631] px-7 sm:px-9 py-3 sm:py-3.5 whitespace-nowrap
                                   shadow-[6px_6px_0_#26bc61] cursor-pointer
                                   hover:-translate-x-0.5 hover:-translate-y-0.5
                                   hover:shadow-[8px_8px_0_#26bc61]
                                   transition-all duration-100"
                    >
                        ▶ PLAY GAME
                    </button>
                </div>

                {/* scroll hint */}
                <p className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-none
                              font-mono text-[9px] sm:text-[10px] text-[#212631]/35
                              tracking-[0.15em] uppercase whitespace-nowrap">
                    scroll to enter the forest ↓
                </p>
            </div>

            {showModal && (
                <ConfirmModal
                    onConfirm={() => window.open('https://minizoo.vercel.app', '_blank')}
                    onCancel={() => setShowModal(false)}
                />
            )}
        </section>
    );
};

export default GameSection;