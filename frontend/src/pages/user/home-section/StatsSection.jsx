import React, { useState, useEffect, useRef, memo } from 'react';

const CounterNumber = memo(function CounterNumber({ value, suffix = '' }) {
    const ref = useRef(null);
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        let animationId = null;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    let start = null;
                    const run = (ts) => {
                        if (!start) start = ts;
                        const p = Math.min((ts - start) / 1600, 1);
                        const eased = 1 - Math.pow(1 - p, 4);
                        setDisplay(Math.round(eased * value));
                        if (p < 1) animationId = requestAnimationFrame(run);
                    };
                    animationId = requestAnimationFrame(run);
                }
            },
            { threshold: 0.1 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => {
            if (animationId) cancelAnimationFrame(animationId);
            observer.disconnect();
        };
    }, [value]);

    return <span ref={ref}>{display}{suffix}</span>;
});

const StatsSection = memo(function StatsSection() {
    return (
        <section className="bg-[#38d091] py-8 md:py-12 pb-12 md:pb-16 overflow-hidden shrink-0 w-full">
            <div className="max-w-[1650px] mx-auto px-6 md:px-16 grid grid-cols-3 gap-4 md:gap-12">
                {[{ value: 10, suffix: '+', label: 'Species' }, { value: 15, suffix: '+', label: 'Plants' }, { value: 100, suffix: '+', label: 'Visitors / Year' }].map((stat, i) => (
                    <div key={i} className="flex flex-col items-start">
                        <span className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#ebebeb] tabular-nums leading-none">
                            <CounterNumber value={stat.value} suffix={stat.suffix} />
                        </span>
                        <span className="text-[#ebebeb]/50 text-[9px] sm:text-[10px] md:text-xs lg:text-sm uppercase tracking-widest mt-2 md:mt-3">{stat.label}</span>
                    </div>
                ))}
            </div>
        </section>
    );
});

export default StatsSection;