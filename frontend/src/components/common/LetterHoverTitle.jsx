import { Children, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

const LetterHoverTitle = ({ children, className = '' }) => {
    const titleRef = useRef(null);
    const title = Children.toArray(children).join('');

    useLayoutEffect(() => {
        const letters = titleRef.current?.querySelectorAll('[data-title-letter]');
        if (!letters?.length) return undefined;

        const ctx = gsap.context(() => {
            gsap.set(letters, { transformOrigin: '50% 100%' });
        }, titleRef);

        return () => ctx.revert();
    }, []);

    const animateLetters = (entering) => {
        const letters = titleRef.current?.querySelectorAll('[data-title-letter]');
        if (!letters?.length) return;

        gsap.to(letters, {
            y: entering ? -10 : 0,
            rotateX: entering ? -25 : 0,
            color: entering ? '#315b37' : '#000000',
            duration: entering ? 0.35 : 0.25,
            stagger: entering ? 0.025 : 0.015,
            ease: entering ? 'power3.out' : 'power2.out',
            overwrite: 'auto',
        });
    };

    return (
        <h1
            ref={titleRef}
            className={className}
            onMouseEnter={() => animateLetters(true)}
            onMouseLeave={() => animateLetters(false)}
            onFocus={() => animateLetters(true)}
            onBlur={() => animateLetters(false)}
            tabIndex="0"
            aria-label={title}
        >
            {title.split('').map((letter, index) => (
                <span key={`${letter}-${index}`} data-title-letter="true" className="inline-block">
                    {letter === ' ' ? '\u00a0' : letter}
                </span>
            ))}
        </h1>
    );
};

export default LetterHoverTitle;