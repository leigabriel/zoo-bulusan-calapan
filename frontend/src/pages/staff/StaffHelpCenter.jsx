import { useMemo, useState } from 'react';

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
    </svg>
);

const HelpCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

const ChevronDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

const faqs = [
    {
        id: 1,
        category: 'Overview',
        question: 'How do I understand the three top dashboard cards?',
        answer: 'The first row summarizes Total Animals, Total Plants, and Total Reservations. Use these cards for a quick daily snapshot of overall operations.'
    },
    {
        id: 2,
        category: 'Overview',
        question: 'How do I estimate reservations from the dashboard?',
        answer: 'Total Reservations is computed from ticket-related and upcoming event counts. Use it as a quick indicator, then open reservation or event pages for detailed records.'
    },
    {
        id: 3,
        category: 'Activity',
        question: 'How do I read the Activity Summary card?',
        answer: 'Use Today\'s Actions for current progress, This Week for total workload trend, and Last Activity to confirm your latest logged operation.'
    },
    {
        id: 4,
        category: 'Animals',
        question: 'How do I use the Animals Overview table?',
        answer: 'Scan recent rows for animal name, species, and health/status tags. This table is a preview. Select View All to open the complete animals management page.'
    },
    {
        id: 5,
        category: 'Plants',
        question: 'How do I use the Plants Overview table?',
        answer: 'Check latest plant entries and status badges to detect items needing care. For edits and full records, use View All in the Plants Overview header.'
    },
    {
        id: 6,
        category: 'Status',
        question: 'How do I interpret status badge colors in tables?',
        answer: 'Green badges represent active or healthy entries, yellow indicates attention is needed, and gray indicates neutral or uncategorized states.'
    },
    {
        id: 7,
        category: 'Navigation',
        question: 'How do I jump from dashboard previews to full modules?',
        answer: 'Use the View All links in Animals Overview and Plants Overview. These links take you straight to full management pages without searching in the sidebar.'
    },
    {
        id: 8,
        category: 'Troubleshooting',
        question: 'How do I refresh staff dashboard values?',
        answer: 'Refresh the page to request fresh stats, activity summary, and preview tables. If values remain unchanged, check network connectivity and backend API availability.'
    },
    {
        id: 9,
        category: 'Troubleshooting',
        question: 'How do I handle "No animals to display" or "No plants to display"?',
        answer: 'These messages appear when no records are returned. Open the full module using View All and confirm whether records exist or if filters/data sources need updating.'
    }
];

const categories = ['All', ...new Set(faqs.map((faq) => faq.category))];

const StaffHelpCenter = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [expandedFaq, setExpandedFaq] = useState(faqs[0].id);

    const filteredFaqs = useMemo(() => {
        return faqs.filter((faq) => {
            const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
            const query = searchQuery.trim().toLowerCase();

            if (!query) {
                return matchesCategory;
            }

            return (
                matchesCategory &&
                (faq.question.toLowerCase().includes(query) ||
                    faq.answer.toLowerCase().includes(query) ||
                    faq.category.toLowerCase().includes(query))
            );
        });
    }, [activeCategory, searchQuery]);

    return (
        <div className="space-y-6">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-3xl p-6 md:p-8">
                <div className="w-14 h-14 bg-[#8cff65]/10 rounded-2xl flex items-center justify-center text-[#8cff65] mb-5">
                    <HelpCircleIcon />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Staff Dashboard Help</h1>
                <p className="text-gray-400 max-w-3xl">
                    Dashboard-focused "How do I" help for daily tracking, activity monitoring, and quick use of preview tables.
                </p>
            </div>

            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5 md:p-6">
                <div className="relative mb-4">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        placeholder="Search dashboard how-to questions"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#8cff65]"
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    {categories.map((category) => {
                        const isActive = category === activeCategory;

                        return (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                                    isActive
                                        ? 'bg-[#8cff65]/15 text-[#8cff65] border-[#8cff65]/40'
                                        : 'bg-[#1a1a1a] text-gray-300 border-[#2a2a2a] hover:border-[#8cff65]/25'
                                }`}
                            >
                                {category}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5 md:p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-white">How-To Questions</h2>
                    <span className="text-sm text-gray-400">{filteredFaqs.length} results</span>
                </div>

                {filteredFaqs.length === 0 ? (
                    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 text-center text-gray-400">
                        No dashboard help questions matched your search.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredFaqs.map((faq) => {
                            const isExpanded = expandedFaq === faq.id;

                            return (
                                <div key={faq.id} className="border border-[#2a2a2a] rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                                        className="w-full px-4 py-4 text-left hover:bg-[#1a1a1a] transition-colors"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <span className="inline-flex px-2 py-0.5 mb-2 rounded text-xs font-medium bg-[#8cff65]/10 text-[#8cff65]">
                                                    {faq.category}
                                                </span>
                                                <p className="text-white font-medium">{faq.question}</p>
                                            </div>
                                            <span className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                                <ChevronDownIcon />
                                            </span>
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="px-4 pb-4">
                                            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 text-sm text-gray-300 leading-relaxed">
                                                {faq.answer}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffHelpCenter;
