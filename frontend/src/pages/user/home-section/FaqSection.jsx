import React, { useState } from 'react';

const faqData = [
    { question: 'What are the operating hours of Bulusan Zoo?', answer: 'Bulusan Zoo is open daily from 8:00 AM to 5:00 PM. We recommend arriving early to fully experience all our wildlife exhibits and AI-powered features.' },
    { question: 'How can I purchase/reserve tickets for my visit?', answer: "Tickets can be purchased/reserved directly through our website or at the main entrance gate. We accept cash only, there's no digital payment for now." },
    { question: 'Is there a special rate for local residents?', answer: 'Yes, entrance is free for local residents of Bulusan Calapan City. Please bring a valid government-issued ID or proof of residency to avail of this benefit.' },
    { question: 'Are animal feeding sessions open to the public?', answer: "We have scheduled interactive feeding sessions and wildlife shows throughout the day. Check the 'Events' section for the latest daily schedule." },
    { question: 'Is the park accessible for persons with disabilities?', answer: 'Yes, Bulusan Zoo features paved pathways suitable for wheelchairs and priority access for PWDs and senior citizens at all major attractions.' },
    { question: 'Does the zoo support conservation programs?', answer: 'Absolutely. A portion of every ticket sale goes directly toward our local wildlife rescue and rehabilitation initiatives in the region.' },
];

const FaqSection = () => {
    const [activeIndex, setActiveIndex] = useState(null);

    return (
        <section id="faq-section" className="relative py-16 sm:py-20 md:py-24 bg-[#ebebeb] w-full">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1500px]">
                <div className="flex items-center gap-4 mb-6 md:mb-8">
                    <div className="w-8 h-[1px] bg-[#212631]/30" />
                    <span className="text-[10px] tracking-[0.25em] text-[#212631]/40 uppercase">
                        Questions
                    </span>
                </div>
                <div className="overflow-hidden mb-12 md:mb-16">
                    <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-bold text-gray-900 tracking-tight">
                        FAQ
                    </h2>
                </div>
                <div className="border-b border-gray-200">
                    {faqData.map((item, index) => (
                        <div key={index} className="border-t border-gray-200">
                            <button
                                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                                className="w-full py-5 sm:py-6 md:py-9 flex items-center justify-between text-left group transition-all min-h-[44px]"
                            >
                                <span className="text-base sm:text-lg md:text-2xl lg:text-3xl font-medium text-gray-800 pr-4 sm:pr-8 leading-snug break-words">
                                    {item.question}
                                </span>
                                <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 border border-gray-200 rounded-md sm:rounded-lg flex items-center justify-center transition-all duration-300 min-w-[32px] sm:min-w-[40px] ${activeIndex === index ? 'bg-gray-900 border-gray-900' : 'bg-[#ebebeb]'}`}>
                                    <svg className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-300 ${activeIndex === index ? 'text-white rotate-180' : 'text-[#212631]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateRows: activeIndex === index ? '1fr' : '0fr',
                                    transition: 'grid-template-rows 0.45s cubic-bezier(0.16,1,0.3,1)',
                                }}
                            >
                                <div style={{ overflow: 'hidden' }}>
                                    <p className={`text-gray-500 text-sm sm:text-base md:text-xl lg:text-2xl leading-relaxed max-w-4xl pb-6 sm:pb-8 transition-opacity duration-300 ${activeIndex === index ? 'opacity-100' : 'opacity-0'}`}>
                                        {item.answer}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FaqSection;
