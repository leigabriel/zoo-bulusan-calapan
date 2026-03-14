import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

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
        <rect x="8" y="24" width="2" height="2" fill="#ffdd44" />
        <rect x="22" y="22" width="2" height="2" fill="#ffdd44" />
    </svg>
);

const PixelPaw = () => (
    <svg viewBox="0 0 24 24" width="36" height="36" fill="none" style={{ imageRendering: 'pixelated' }}>
        <rect x="4" y="0" width="4" height="4" fill="#fff" />
        <rect x="10" y="0" width="4" height="4" fill="#fff" />
        <rect x="16" y="0" width="4" height="4" fill="#fff" />
        <rect x="2" y="4" width="4" height="4" fill="#fff" />
        <rect x="4" y="8" width="16" height="10" fill="#fff" />
        <rect x="2" y="10" width="4" height="6" fill="#fff" />
        <rect x="18" y="10" width="4" height="6" fill="#fff" />
        <rect x="4" y="18" width="4" height="4" fill="#fff" />
        <rect x="16" y="18" width="4" height="4" fill="#fff" />
        <rect x="8" y="20" width="8" height="4" fill="#fff" />
        <rect x="8" y="10" width="2" height="2" fill="#1a1a1a" />
        <rect x="14" y="10" width="2" height="2" fill="#1a1a1a" />
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
        <rect x="16" y="2" width="6" height="4" fill="#ffdd44" />
        <rect x="20" y="4" width="6" height="2" fill="#ffb800" />
        <rect x="8" y="4" width="14" height="8" fill="#4fc3f7" />
        <rect x="6" y="6" width="4" height="4" fill="#4fc3f7" />
        <rect x="2" y="4" width="6" height="2" fill="#4fc3f7" />
        <rect x="0" y="6" width="4" height="4" fill="#4fc3f7" />
        <rect x="2" y="10" width="4" height="2" fill="#4fc3f7" />
        <rect x="18" y="4" width="2" height="2" fill="#1a1a1a" />
        <rect x="19" y="5" width="1" height="1" fill="#fff" />
        <rect x="10" y="12" width="8" height="6" fill="#4fc3f7" />
        <rect x="8" y="14" width="2" height="4" fill="#4fc3f7" />
        <rect x="18" y="14" width="2" height="4" fill="#4fc3f7" />
        <rect x="10" y="18" width="4" height="2" fill="#ffb800" />
        <rect x="14" y="18" width="4" height="2" fill="#ffb800" />
    </svg>
);

const PixelMushroom = () => (
    <svg viewBox="0 0 24 28" width="36" height="42" fill="none" style={{ imageRendering: 'pixelated' }}>
        <rect x="8" y="16" width="8" height="10" fill="#f5deb3" />
        <rect x="6" y="18" width="12" height="6" fill="#f5deb3" />
        <rect x="4" y="8" width="16" height="10" fill="#e63946" />
        <rect x="2" y="10" width="20" height="6" fill="#e63946" />
        <rect x="6" y="6" width="12" height="4" fill="#e63946" />
        <rect x="10" y="4" width="4" height="4" fill="#e63946" />
        <rect x="6" y="10" width="4" height="4" fill="#fff" />
        <rect x="14" y="8" width="4" height="4" fill="#fff" />
        <rect x="10" y="14" width="2" height="2" fill="#fff" />
    </svg>
);

const PixelStar = ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" style={{ imageRendering: 'pixelated' }}>
        <rect x="5" y="0" width="2" height="2" fill="#ffdd44" />
        <rect x="5" y="10" width="2" height="2" fill="#ffdd44" />
        <rect x="0" y="5" width="2" height="2" fill="#ffdd44" />
        <rect x="10" y="5" width="2" height="2" fill="#ffdd44" />
        <rect x="3" y="3" width="2" height="2" fill="#ffdd44" />
        <rect x="7" y="3" width="2" height="2" fill="#ffdd44" />
        <rect x="3" y="7" width="2" height="2" fill="#ffdd44" />
        <rect x="7" y="7" width="2" height="2" fill="#ffdd44" />
        <rect x="4" y="4" width="4" height="4" fill="#ffdd44" />
    </svg>
);

const icons = [
    { comp: <PixelFox />, top: '14%', left: '6%', floatDur: 3.2, delay: 0, side: 'left', bg: '#f9a825' },
    { comp: <PixelTree />, top: '60%', left: '4%', floatDur: 4.1, delay: 0.6, side: 'left', bg: '#1a5c2e' },
    { comp: <PixelBird />, top: '10%', right: '5%', floatDur: 2.8, delay: 0.3, side: 'right', bg: '#0288d1' },
    { comp: <PixelMushroom />, top: '62%', right: '5%', floatDur: 3.6, delay: 0.9, side: 'right', bg: '#c62828' },
    { comp: <PixelPaw />, top: '38%', left: '2%', floatDur: 3.8, delay: 1.1, side: 'left', bg: '#6d4c41' },
    { comp: <PixelLeaf />, top: '36%', right: '3%', floatDur: 2.6, delay: 0.5, side: 'right', bg: '#2e7d32' },
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                className="absolute inset-0 bg-black/70"
                onClick={onCancel}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            />

            <motion.div
                className="relative z-10 flex flex-col items-center"
                initial={{ scale: 0.7, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                style={{
                    background: '#26bc61',
                    border: '4px solid #fff',
                    boxShadow: '8px 8px 0 #157a3c',
                    padding: '32px 28px',
                    maxWidth: '340px',
                    width: '100%',
                    fontFamily: 'monospace',
                }}
            >
                <div style={{ fontSize: '11px', color: '#ffdd44', letterSpacing: '0.2em', marginBottom: '12px' }}>
                    ★ MINIZOO ★
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                    <PixelFox />
                    <PixelBird />
                    <PixelMushroom />
                </div>

                <div
                    style={{
                        fontFamily: 'monospace',
                        fontWeight: 900,
                        fontSize: '18px',
                        color: '#fff',
                        textAlign: 'center',
                        textShadow: '3px 3px 0 #157a3c',
                        lineHeight: 1.3,
                        marginBottom: '8px',
                    }}
                >
                    ENTER THE FOREST?
                </div>

                <div
                    style={{
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        color: 'rgba(255,255,255,0.75)',
                        textAlign: 'center',
                        lineHeight: 1.6,
                        marginBottom: '24px',
                    }}
                >
                    You're about to leave this page<br />
                    and venture into MiniZoo.
                </div>

                <div className="flex gap-3 w-full">
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            fontFamily: 'monospace',
                            fontWeight: 900,
                            fontSize: '12px',
                            letterSpacing: '0.1em',
                            color: '#fff',
                            background: 'transparent',
                            border: '3px solid rgba(255,255,255,0.4)',
                            padding: '10px 0',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            transition: 'border-color 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'}
                    >
                        ✕ STAY
                    </button>

                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1,
                            fontFamily: 'monospace',
                            fontWeight: 900,
                            fontSize: '12px',
                            letterSpacing: '0.1em',
                            color: '#26bc61',
                            background: '#ffdd44',
                            border: '3px solid #ffdd44',
                            padding: '10px 0',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            boxShadow: '4px 4px 0 #a07800',
                            transition: 'transform 0.1s, box-shadow 0.1s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '6px 6px 0 #a07800'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translate(0,0)'; e.currentTarget.style.boxShadow = '4px 4px 0 #a07800'; }}
                    >
                        ▶ PLAY!
                    </button>
                </div>
            </motion.div>
        </motion.div>
    </AnimatePresence>
);

const GameSection = () => {
    const containerRef = useRef(null);
    const [showModal, setShowModal] = useState(false);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end end'],
    });

    const textScale = useTransform(scrollYProgress, [0, 0.3], [1, 7]);
    const textOpacity = useTransform(scrollYProgress, [0.1, 0.28], [1, 0]);
    const textY = useTransform(scrollYProgress, [0, 0.3], ['0%', '-8%']);

    const videoScale = useTransform(scrollYProgress, [0, 0.38], [0.28, 1]);
    const videoRotate = useTransform(scrollYProgress, [0, 0.38], ['-5deg', '0deg']);
    const videoRadius = useTransform(scrollYProgress, [0, 0.38], ['1rem', '0rem']);

    const leftX = useTransform(scrollYProgress, [0, 0.3], ['0%', '-220%']);
    const rightX = useTransform(scrollYProgress, [0, 0.3], ['0%', '220%']);
    const decoOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

    const topY = useTransform(scrollYProgress, [0, 0.25], ['0%', '-280%']);
    const botY = useTransform(scrollYProgress, [0, 0.25], ['0%', '280%']);

    const playBtnOpacity = useTransform(scrollYProgress, [0.34, 0.44], [0, 1]);
    const playBtnY = useTransform(scrollYProgress, [0.34, 0.44], ['20px', '0px']);
    const playBtnPointer = useTransform(scrollYProgress, [0.38, 0.39], [0, 1]);

    return (
        <section
            ref={containerRef}
            className="relative w-full"
            style={{ height: '300vh', backgroundColor: '#26bc61' }}
        >
            <style>{`
                @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
                @keyframes twinkle { 0%,100%{opacity:.3} 50%{opacity:1} }
                .blink { animation: blink 1s step-end infinite; }
                .twinkle { animation: twinkle 2s ease-in-out infinite; }
            `}</style>

            <div
                className="sticky top-0 w-full overflow-hidden flex items-center justify-center"
                style={{ height: '100svh', backgroundColor: '#26bc61' }}
            >
                <div
                    className="absolute inset-0 z-0 pointer-events-none"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)
                        `,
                        backgroundSize: '28px 28px',
                    }}
                />

                {starPositions.map((s, i) => (
                    <div
                        key={i}
                        className="absolute z-10 pointer-events-none twinkle"
                        style={{ top: s.top, left: s.left, right: s.right, animationDelay: `${i * 0.4}s` }}
                    >
                        <PixelStar size={s.size} />
                    </div>
                ))}

                <motion.div
                    className="absolute inset-0 z-20 origin-center flex items-center justify-center overflow-hidden"
                    style={{
                        scale: videoScale,
                        rotate: videoRotate,
                        borderRadius: videoRadius,
                        backgroundColor: '#26bc61',
                    }}
                >
                    <video
                        src="/minizoo.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{
                            minWidth: '100%',
                            minHeight: '100%',
                            width: '120%',
                            height: '120%',
                            objectFit: 'cover',
                            transform: 'scale(1.02)'
                        }}
                    />
                </motion.div>

                <motion.div
                    className="absolute z-40 flex flex-col items-center justify-center w-full h-full pointer-events-none origin-center px-4"
                    style={{ scale: textScale, opacity: textOpacity, y: textY }}
                >
                    <div className="flex flex-col items-center gap-2">
                        <div
                            className="text-center leading-[0.88] select-none"
                            style={{
                                fontFamily: 'monospace',
                                fontSize: 'clamp(2.6rem, 10.5vw, 9rem)',
                                fontWeight: 900,
                                letterSpacing: '-0.01em',
                                color: '#fff',
                                textShadow: '4px 4px 0 #157a3c, 8px 8px 0 rgba(0,0,0,0.2)',
                            }}
                        >
                            <span className="block">play our game</span>
                            <span className="block" style={{ color: '#ffdd44', textShadow: '4px 4px 0 #a07800, 8px 8px 0 rgba(0,0,0,0.2)' }}>
                                called minizoo.
                            </span>
                        </div>
                        <div className="blink mt-2" style={{ fontFamily: 'monospace', fontSize: 'clamp(0.5rem, 1.4vw, 0.8rem)', color: '#fff', letterSpacing: '0.22em', textTransform: 'uppercase', textShadow: '2px 2px 0 #157a3c' }}>
                            ▶ feed &amp; explore ◀
                        </div>
                    </div>
                </motion.div>

                {icons.map((icon, i) => (
                    <motion.div
                        key={i}
                        className="absolute z-30 pointer-events-none"
                        style={{
                            top: icon.top,
                            left: icon.left,
                            right: icon.right,
                            x: icon.side === 'left' ? leftX : rightX,
                            opacity: decoOpacity,
                        }}
                    >
                        <motion.div
                            animate={{ y: [0, -7, 0] }}
                            transition={{ duration: icon.floatDur, delay: icon.delay, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <div style={{ background: icon.bg, padding: '10px', boxShadow: '4px 4px 0 rgba(0,0,0,0.4)' }}>
                                {icon.comp}
                            </div>
                        </motion.div>
                    </motion.div>
                ))}

                <motion.div
                    className="absolute z-30 right-[5vw] bottom-[10vh] pointer-events-none"
                    style={{ y: botY, opacity: decoOpacity }}
                >
                    <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#fff', textAlign: 'right', lineHeight: 1.7, textShadow: '1px 1px 0 #157a3c' }}>
                        <div style={{ color: '#ffdd44', fontWeight: 900 }}>FOOD BAG</div>
                        <div>▓▓▓▓▓▓░░ 75%</div>
                        <div style={{ fontSize: '9px', opacity: 0.7 }}>BERRIES × 12</div>
                    </div>
                </motion.div>

                <motion.div
                    className="absolute z-50 bottom-12 left-1/2"
                    style={{
                        translateX: '-50%',
                        opacity: playBtnOpacity,
                        y: playBtnY,
                        pointerEvents: playBtnPointer,
                    }}
                >
                    <button
                        onClick={() => setShowModal(true)}
                        style={{
                            fontFamily: 'monospace',
                            fontWeight: 900,
                            fontSize: '15px',
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                            color: '#26bc61',
                            background: '#ffdd44',
                            border: '4px solid #fff',
                            padding: '14px 36px',
                            cursor: 'pointer',
                            boxShadow: '6px 6px 0 #157a3c',
                            transition: 'transform 0.1s, box-shadow 0.1s',
                            whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '8px 8px 0 #157a3c'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translate(0,0)'; e.currentTarget.style.boxShadow = '6px 6px 0 #157a3c'; }}
                    >
                        ▶ PLAY GAME
                    </button>
                </motion.div>

                <div
                    className="absolute bottom-5 left-1/2 z-30 pointer-events-none"
                    style={{
                        transform: 'translateX(-50%)',
                        fontFamily: 'monospace',
                        fontSize: '10px',
                        color: 'rgba(255,255,255,0.5)',
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        textShadow: '1px 1px 0 #157a3c',
                        whiteSpace: 'nowrap',
                    }}
                >
                    scroll to enter the forest ↓
                </div>
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