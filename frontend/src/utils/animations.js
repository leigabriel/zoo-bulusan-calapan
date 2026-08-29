/**
 * Framer Motion Animation Configurations
 * Reusable animation variants and utilities for scroll-based animations
 */

// Basic fade animation variants
export const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.6, ease: 'easeOut' }
    }
};

// Fade up animation (from bottom to top)
export const fadeInUp = {
    hidden: {
        opacity: 0,
        y: 40
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
    }
};

// Fade down animation (from top to bottom)
export const fadeInDown = {
    hidden: {
        opacity: 0,
        y: -40
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
    }
};

// Fade left animation (from right to left)
export const fadeInLeft = {
    hidden: {
        opacity: 0,
        x: 60
    },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }
    }
};

// Fade right animation (from left to right)
export const fadeInRight = {
    hidden: {
        opacity: 0,
        x: -60
    },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }
    }
};

// Scale up animation
export const scaleIn = {
    hidden: {
        opacity: 0,
        scale: 0.9
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, ease: 'easeOut' }
    }
};

// Stagger children animation container
export const staggerContainer = {
    hidden: { opacity: 1 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.1
        }
    }
};

// Stagger children with longer delays
export const staggerContainerSlow = {
    hidden: { opacity: 1 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.25,
            delayChildren: 0.2
        }
    }
};

// Slide in from bottom for staggered items
export const staggerItem = {
    hidden: { 
        opacity: 0, 
        y: 30 
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: 'easeOut' }
    }
};

// Card hover effect
export const cardHover = {
    rest: {
        scale: 1,
        y: 0,
        transition: { duration: 0.3, ease: 'easeOut' }
    },
    hover: {
        scale: 1.02,
        y: -8,
        transition: { duration: 0.3, ease: 'easeOut' }
    }
};

// Button hover effect
export const buttonHover = {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
};

// Default viewport settings for scroll animations
export const defaultViewport = {
    once: true,
    amount: 0.2,
    margin: '-50px'
};

// Viewport for sections that should trigger earlier
export const earlyViewport = {
    once: true,
    amount: 0.1,
    margin: '-100px'
};

// Viewport for sections that repeat animations
export const repeatViewport = {
    once: false,
    amount: 0.3
};

// Sticky section configuration
export const stickyConfig = {
    // Height multiplier for sticky section container
    containerHeight: 4, // 400vh
    // Progress thresholds for each section
    sections: {
        about: { start: 0, end: 0.25 },
        animals: { start: 0.25, end: 0.5 },
        events: { start: 0.5, end: 0.75 },
        tickets: { start: 0.75, end: 1 }
    }
};

// Create delay-based variants for staggered animations
export const createDelayedVariant = (baseVariant, delay) => ({
    hidden: baseVariant.hidden,
    visible: {
        ...baseVariant.visible,
        transition: {
            ...baseVariant.visible.transition,
            delay
        }
    }
});

// Smooth scroll progress animation for sticky sections
export const createParallaxVariant = (yOffset = 50) => ({
    hidden: { y: yOffset, opacity: 0 },
    visible: { 
        y: 0, 
        opacity: 1,
        transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
    }
});

// Text reveal animation (character by character)
export const textReveal = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.02
        }
    }
};

export const characterReveal = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3 }
    }
};

// Image reveal animation with clip-path
export const imageReveal = {
    hidden: {
        clipPath: 'inset(100% 0 0 0)',
        opacity: 0
    },
    visible: {
        clipPath: 'inset(0% 0 0 0)',
        opacity: 1,
        transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
    }
};

// Page transition variants
export const pageTransition = {
    initial: { opacity: 0, y: 20 },
    animate: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.4, ease: 'easeOut' }
    },
    exit: { 
        opacity: 0, 
        y: -20,
        transition: { duration: 0.3, ease: 'easeIn' }
    }
};
