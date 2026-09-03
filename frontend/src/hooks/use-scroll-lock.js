import { useEffect } from 'react';
import { useLenis } from 'lenis/react';

let activeLocks = 0;
let originalStyles = null;
let lockedLenis = null;
let shouldRestartLenis = false;

const lockPageScroll = (lenis) => {
    if (activeLocks === 0) {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        originalStyles = {
            bodyOverflow: document.body.style.overflow,
            bodyPaddingRight: document.body.style.paddingRight,
            htmlOverflow: document.documentElement.style.overflow,
            htmlOverscrollBehavior: document.documentElement.style.overscrollBehavior,
        };

        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.overscrollBehavior = 'none';
        if (scrollbarWidth > 0) {
            const currentPadding = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
            document.body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
        }

        lockedLenis = lenis || null;
        shouldRestartLenis = Boolean(lockedLenis && !lockedLenis.isStopped);
        lockedLenis?.stop();
    }

    activeLocks += 1;
};

const unlockPageScroll = () => {
    activeLocks = Math.max(0, activeLocks - 1);
    if (activeLocks !== 0 || !originalStyles) return;

    document.body.style.overflow = originalStyles.bodyOverflow;
    document.body.style.paddingRight = originalStyles.bodyPaddingRight;
    document.documentElement.style.overflow = originalStyles.htmlOverflow;
    document.documentElement.style.overscrollBehavior = originalStyles.htmlOverscrollBehavior;
    if (shouldRestartLenis) lockedLenis?.start();
    lockedLenis = null;
    shouldRestartLenis = false;
    originalStyles = null;
};

const useScrollLock = (locked) => {
    const lenis = useLenis();

    useEffect(() => {
        if (!locked) return undefined;

        lockPageScroll(lenis);
        return unlockPageScroll;
    }, [lenis, locked]);
};

export default useScrollLock;
