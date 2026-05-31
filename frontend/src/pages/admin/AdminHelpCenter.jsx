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
        category: 'Dashboard',
        question: 'How do I refresh dashboard KPIs and charts?',
        answer: 'Use the time range filter at the top of the dashboard or refresh the page. The cards and charts update automatically based on the selected range.'
    },
    {
        id: 2,
        category: 'Animals',
        question: 'How do I add or edit an animal record?',
        answer: 'Open the Animals module, select Add Animal for new entries, or Edit on an existing record. Upload the image, update details, and save changes.'
    },
    {
        id: 3,
        category: 'Plants',
        question: 'How do I update plant information?',
        answer: 'Go to Plants, choose a record, and edit the details. Save updates to keep descriptions, status, and images current.'
    },
    {
        id: 4,
        category: 'Events',
        question: 'How do I publish or update an event?',
        answer: 'Open Events, add the event details, upload an image, and save. Use Edit to update schedules, tags, or status for existing events.'
    },
    {
        id: 5,
        category: 'Reservations',
        question: 'How do I approve ticket or event reservations?',
        answer: 'Go to Reservations and update each request status to Confirmed or Declined. Status updates are reflected in the user reservation list.'
    },
    {
        id: 6,
        category: 'Users',
        question: 'How do I manage user accounts?',
        answer: 'Open Users to review profiles, roles, and activity. Use the actions menu to update account status or review recent registrations.'
    },
    {
        id: 7,
        category: 'Community',
        question: 'How do I moderate community posts and reports?',
        answer: 'Open Community moderation to review flagged posts or reports. Approve, remove, or document actions based on policy.'
    },
    {
        id: 8,
        category: 'Monitoring',
        question: 'Where can I review monitoring alerts?',
        answer: 'Use the Monitoring module to track AI detections, alerts, or system notices. Review timestamps to verify recent activity.'
    },
    {
        id: 9,
        category: 'Reports',
        question: 'How do I export analytics reports?',
        answer: 'Visit Analytics or Reports, select a date range, and use export actions for summaries. Reports reflect the same filters as dashboard metrics.'
    },
    {
        id: 10,
        category: 'Troubleshooting',
        question: 'Why are charts or cards showing zero values?',
        answer: 'Confirm the selected date range includes data, then refresh the page. If values stay empty, verify the backend connection is available.'
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
            <div className="bg-[#f6fdf8] border border-emerald-200 rounded-3xl p-6 md:p-8">
                <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 mb-5">
                    <HelpCircleIcon />
                </div>
                <h1 className="text-3xl font-bold text-emerald-900 mb-2">Admin Help Center</h1>
                <p className="text-emerald-900/70 max-w-3xl">
                    Admin help center for managing animals, plants, events, reservations, analytics, and moderation workflows.
                </p>
            </div>

            <div className="bg-white border border-emerald-200 rounded-2xl p-5 md:p-6">
                <div className="relative mb-4">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600">
                        <SearchIcon />
                    </div>
                    <input
                        type="text"
                        placeholder="Search admin help topics"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="w-full bg-[#f6fdf8] border border-emerald-200 rounded-xl py-3.5 pl-12 pr-4 text-emerald-900 placeholder-emerald-700/50 focus:outline-none focus:border-emerald-500"
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
                                        ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                        : 'bg-emerald-50 text-emerald-900/70 border-emerald-200 hover:border-emerald-300'
                                }`}
                            >
                                {category}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white border border-emerald-200 rounded-2xl p-5 md:p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-emerald-900">How-To Questions</h2>
                    <span className="text-sm text-emerald-900/60">{filteredFaqs.length} results</span>
                </div>

                {filteredFaqs.length === 0 ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center text-emerald-900/60">
                        No dashboard help questions matched your search.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredFaqs.map((faq) => {
                            const isExpanded = expandedFaq === faq.id;

                            return (
                                <div key={faq.id} className="border border-emerald-200 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                                        className="w-full px-4 py-4 text-left hover:bg-emerald-50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <span className="inline-flex px-2 py-0.5 mb-2 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                                                    {faq.category}
                                                </span>
                                                <p className="text-emerald-900 font-medium">{faq.question}</p>
                                            </div>
                                            <span className={`text-emerald-700/60 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                                <ChevronDownIcon />
                                            </span>
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="px-4 pb-4">
                                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-900/70 leading-relaxed">
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
