import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function ArticleCard({ a, onMove, setHovered, onTap }) {
    return (
        <article
            className={a.className}
            onMouseMove={(e) => onMove(e, a.key)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onTap(a.key)}
        >
            <div>
                <div className="text-[#212631]/40 text-xs md:text-sm font-medium tracking-widest mb-6 lg:mb-8">
                    <span className="text-[#212631]/25 mr-2">•</span>{a.num}
                </div>
            </div>
            <div className="overflow-hidden mb-4 lg:mb-6">
                <h3 className="text-[1.75rem] md:text-3xl lg:text-4xl font-bold text-[#212631] tracking-tight">
                    {a.title}
                </h3>
            </div>
            <p className="text-base md:text-lg lg:text-xl text-[#212631]/70 leading-relaxed mb-8 lg:mb-12">
                {a.desc}
            </p>
            <span className="md:hidden text-[10px] tracking-widest text-[#212631]/40 uppercase">Tap to view image</span>
            {a.link && (
                <div className="mt-auto pt-12">
                    <Link to={a.link} className="self-end border border-[#212631]/30 text-[#212631] text-xs md:text-sm font-bold tracking-widest uppercase px-6 py-3 md:px-8 md:py-4 hover:bg-[#212631] hover:text-[#ebebeb] transition-all duration-300 inline-block">
                        View All
                    </Link>
                </div>
            )}
        </article>
    );
}

const ArticleGrid = ({ articles, images, label }) => {
    const [hovered, setHovered] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [popup, setPopup] = useState(null);

    const onMove = (e, key) => { setHovered(key); setMousePos({ x: e.clientX, y: e.clientY }); };
    const onTap = (key) => { if (window.matchMedia('(hover: none)').matches) setPopup(key); };

    return (
        <div className="relative">
            <div className="max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16">
                <div className="relative mb-0 pt-8 md:pt-12">
                    <div className="h-[1px] bg-[#d1d1d1] w-full" />
                    <div className="absolute top-8 md:top-12 left-0 h-[1px] bg-[#212631] w-full" />
                    <span className="inline-block mt-3 text-[10px] font-bold tracking-[0.25em] text-[#212631]/40 uppercase">
                        {label}
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#d1d1d1]">
                    {articles.map((a) => (
                        <ArticleCard key={a.key} a={a} onMove={onMove} setHovered={setHovered} onTap={onTap} />
                    ))}
                </div>
            </div>
            {hovered && (
                <div
                    className="hidden md:block fixed z-50 pointer-events-none"
                    style={{ left: mousePos.x + 22, top: mousePos.y - 130 }}
                >
                    <div className="w-56 h-56 overflow-hidden shadow-2xl border border-[#d1d1d1]">
                        <img src={images[hovered]} alt={hovered} className="w-full h-full object-cover" />
                    </div>
                </div>
            )}
            {popup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#212631]/70 backdrop-blur-sm md:hidden" onClick={() => setPopup(null)}>
                    <div className="bg-[#ebebeb] mx-6 overflow-hidden shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="w-full aspect-[4/3]"><img src={images[popup]} alt={popup} className="w-full h-full object-cover" /></div>
                        <div className="p-6">
                            <h3 className="text-2xl font-bold text-[#212631] tracking-tight capitalize mb-4">{popup}</h3>
                            <button onClick={() => setPopup(null)} className="w-full border border-[#212631]/30 text-[#212631] text-xs font-bold tracking-widest uppercase py-3 hover:bg-[#212631] hover:text-[#ebebeb] transition-all duration-300">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ArticleGrid;