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
        question: 'How do I change the dashboard time range?',
        answer: 'Use the time filter at the top-right of the dashboard. Pick Today, This Week, This Month, or This Year. All main cards and charts reload using the selected range.'
    },
    {
        id: 2,
        category: 'Metrics',
        question: 'How do I interpret the top stat cards quickly?',
        answer: 'Read the five cards from left to right: Total Users, Total Animals, Total Plants, Tickets Sold, and Revenue. The trend text under each number is the comparison against the previous period.'
    },
    {
        id: 3,
        category: 'Charts',
        question: 'How do I compare visitors and revenue in Weekly Overview?',
        answer: 'In the Weekly Overview chart, Visitors and Revenue are shown as separate series by day. Hover on each bar to see exact values and compare peaks between both metrics.'
    },
    {
        id: 4,
        category: 'Charts',
        question: 'How do I find the busiest day on the dashboard?',
        answer: 'Check the summary row below Weekly Overview. The Peak Day value automatically shows which day has the highest visitor count for the selected range.'
    },
    {
        id: 5,
        category: 'Tickets',
        question: 'How do I use the Ticket Types chart?',
        answer: 'The donut chart breaks down ticket distribution by Adult, Children, Senior, and Student. Use it to spot dominant ticket categories and compare percentages at a glance.'
    },
    {
        id: 6,
        category: 'Revenue',
        question: 'How do I read the revenue cards and breakdown bars?',
        answer: 'Use Total Profit to see combined weekly revenue, then use Revenue Breakdown to identify contribution by source such as Ticket Sales, Merchandise, Food and Beverages, and Special Events.'
    },
    {
        id: 7,
        category: 'Users',
        question: 'How do I review new accounts from the dashboard?',
        answer: 'Open Recently Registered Users to view latest signups, role, joined date, and status. Select View All to jump directly to the full user management page.'
    },
    {
        id: 8,
        category: 'Troubleshooting',
        question: 'How do I refresh dashboard data if values look outdated?',
        answer: 'Switch the time filter to another option and back to force a data reload. If values still do not update, refresh the browser and confirm the backend connection is available.'
    },
    {
        id: 9,
        category: 'Troubleshooting',
        question: 'How do I handle empty or zero values in cards and charts?',
        answer: 'Zero values usually mean there is no matching data for the selected period or the endpoint returned empty data. Try This Month or This Year to verify whether records exist.'
    }
];

const categories = ['All', ...new Set(faqs.map((faq) => faq.category))];

const AdminHelpCenter = () => {
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
                <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard Help</h1>
                <p className="text-gray-400 max-w-3xl">
                    Dashboard-only help center with "How do I" answers for metrics, charts, user insights, and quick troubleshooting.
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

export default AdminHelpCenter;
