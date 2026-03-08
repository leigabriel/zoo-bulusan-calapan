import React from 'react';
import ArticleGrid from './ArticleGrid';

const animalArticles = [
    { key: 'parrot', num: '01', title: 'Parrot', desc: 'A white parrot is a predominantly white bird, commonly a cockatoo such as the Umbrella Cockatoo or the Sulphur-crested Cockatoo. It has a strong curved beak, zygodactyl feet, and a movable crest used for communication. White parrots are intelligent, social, and capable of vocal mimicry.', className: 'py-16 md:py-24 md:pr-12 lg:pr-16 flex flex-col h-full', link: null },
    { key: 'tiger', num: '02', title: 'Tiger', desc: 'A tiger is a large, powerful wild cat known for its distinctive orange coat with black stripes. It is a top predator, primarily hunting deer, wild boar, and other large mammals. Tigers are solitary, territorial, and highly adaptable to various habitats such as forests, grasslands, and wetlands.', className: 'py-16 md:py-24 md:px-12 lg:px-16 flex flex-col h-full', link: null },
    { key: 'monkey', num: '03', title: 'Monkey', desc: 'A monkey is a primate known for its agility, intelligence, and social behavior. Most species have flexible limbs, prehensile hands or tails, and keen eyesight. Monkeys live in groups and are found in diverse habitats, including forests, savannas, and mountains.', className: 'py-16 md:py-24 md:pl-12 lg:pl-16 flex flex-col h-full', link: '/animals' },
];

const animalHoverImages = {
    parrot: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&h=600&fit=crop',
    tiger: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?w=600&h=600&fit=crop',
    monkey: 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=600&h=600&fit=crop',
};

const WildlifeSection = () => {
    return (
        <section id="animal" className="w-full bg-[#ebebeb] text-[#212631] border-1 border-[#d1d1d1]">
            <ArticleGrid articles={animalArticles} images={animalHoverImages} label="— Wildlife" />
        </section>
    );
};

export default WildlifeSection;