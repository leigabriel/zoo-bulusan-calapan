import { useEffect, useRef, useState } from 'react';

// Instagram-style gallery: swipe on touch screens, arrows on desktop, dots show position.
// A single photo renders as a plain image with no controls. Shared by the feed cards and
// the post details dialog so both read galleries the same way.
const PostCarousel = ({
    postId,
    images,
    alt = 'Post photo',
    // Sizing belongs to the caller: the feed lets photos grow to a cap, while the details
    // dialog uses a fixed-height stage so the arrows and dots never jump between slides.
    imageClassName = 'h-auto max-h-[600px] object-cover',
    className = '',
    enableKeyboard = false
}) => {
    const [index, setIndex] = useState(0);
    const touchStartX = useRef(null);

    // A different post starts at its first photo again.
    useEffect(() => {
        setIndex(0);
    }, [postId, images.length]);

    // Only the details dialog opts in. A document-level listener on every feed card would
    // steal the arrow keys from normal page scrolling.
    useEffect(() => {
        if (!enableKeyboard || images.length < 2) return undefined;

        const handleKeyDown = (event) => {
            // Comment fields live inside the same dialog, so caret movement must win there.
            const target = event.target;
            const tag = target?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) return;

            if (event.key === 'ArrowLeft') {
                setIndex((current) => (current - 1 + images.length) % images.length);
            } else if (event.key === 'ArrowRight') {
                setIndex((current) => (current + 1) % images.length);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [enableKeyboard, images.length]);

    if (!images.length) return null;

    const go = (delta) => setIndex((current) => (current + delta + images.length) % images.length);

    if (images.length === 1) {
        return (
            <div className={`flex items-center justify-center overflow-hidden bg-black/[0.03] ${className}`}>
                <img src={images[0]} alt={alt} className={`w-full ${imageClassName}`} />
            </div>
        );
    }

    return (
        <div
            role="group"
            aria-roledescription="carousel"
            aria-label={`${images.length} photos`}
            className={`relative select-none overflow-hidden bg-black/[0.03] ${className}`}
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
                if (touchStartX.current === null) return;
                const delta = e.changedTouches[0].clientX - touchStartX.current;
                if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
                touchStartX.current = null;
            }}
        >
            <div
                className="flex transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${index * 100}%)` }}
            >
                {images.map((src, i) => (
                    <img
                        key={`${src}-${i}`}
                        src={src}
                        alt={`${alt} ${i + 1} of ${images.length}`}
                        aria-hidden={i !== index}
                        className={`w-full shrink-0 ${imageClassName}`}
                        draggable={false}
                    />
                ))}
            </div>

            {/* Keeps the white dots legible over bright photos and over the letterboxed
                edges of contained images in the details dialog. */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />

            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); go(-1); }}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
                <span aria-hidden="true">&#8249;</span>
            </button>
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); go(1); }}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
                <span aria-hidden="true">&#8250;</span>
            </button>

            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
                {images.map((_, i) => (
                    <span
                        key={i}
                        aria-current={i === index}
                        className={`rounded-full transition-all ${i === index ? 'h-2 w-2 bg-white' : 'h-1.5 w-1.5 bg-white/60'}`}
                    />
                ))}
            </div>

            <span
                aria-live="polite"
                className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold text-white"
            >
                {index + 1}/{images.length}
            </span>
        </div>
    );
};

export default PostCarousel;
