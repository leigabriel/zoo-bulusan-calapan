import React from 'react';
import ArticleGrid from './ArticleGrid';

const plantArticles = [
    { key: 'sunflower', num: '01', title: 'Sunflower', desc: "A sunflower is a tall, fast-growing plant known for its large, bright yellow flower heads that track the sun's movement. Native to North America, it produces edible seeds rich in oil and nutrients. Sunflowers are widely cultivated for food, agriculture, and ornamental purposes.", className: 'py-16 md:py-24 md:pr-12 lg:pr-16 flex flex-col h-full', link: null },
    { key: 'rose', num: '02', title: 'Rose', desc: 'A rose is a woody perennial flowering plant of the genus Rosa, celebrated for its layered petals and rich fragrance. It comes in hundreds of varieties and colors, each carrying symbolic meaning. Roses are among the most cultivated flowers globally, prized in gardens, perfumery, and culture.', className: 'py-16 md:py-24 md:px-12 lg:px-16 flex flex-col h-full', link: null },
    { key: 'sampaguita', num: '03', title: 'Sampaguita', desc: 'Sampaguita is a small, star-shaped white flower and the national flower of the Philippines. Known for its intense, sweet fragrance, it is commonly strung into garlands used in religious offerings, ceremonies, and as a symbol of purity and devotion. It blooms year-round in tropical climates.', className: 'py-16 md:py-24 md:pl-12 lg:pl-16 flex flex-col h-full', link: '/plants' },
];

const plantHoverImages = {
    sunflower: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=600&h=600&fit=crop',
    rose: 'https://images.unsplash.com/photo-1455582916367-25f75bfc6710?w=600&h=600&fit=crop',
    sampaguita: 'https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=600&h=600&fit=crop',
};

const FloraSection = () => {
    return (
        <section id="plant" className="w-full bg-[#ebebeb] text-[#212631] border-1 border-[#d1d1d1]">
            <ArticleGrid articles={plantArticles} images={plantHoverImages} label="— Flora" />
        </section>
    );
};

export default FloraSection;