import { HelpCircle as HelpCircleIcon, Search as SearchIcon, ChevronDown as ChevronDownIcon } from 'reicon-react';
import { useMemo, useState } from 'react';


const faqs = [
    {
        id: 1,
        category: 'Overview',
        question: 'What should I check at the start of my shift?',
        answer: 'Review the staff dashboard summary, daily task list, and latest notifications to see pending animals, plants, reservations, and moderation items.'
    },
    {
        id: 2,
        category: 'Tasks',
        question: 'How do I use the Daily Tasks panel?',
        answer: 'Open the Daily Tasks panel, click a task to jump to the related module, and mark it done after completing the checklist.'
    },
    {
        id: 3,
        category: 'Animals',
        question: 'How do I update animal status or details?',
        answer: 'Go to Staff Animals, select a record, update health status or notes, and save. The changes appear instantly across staff views.'
    },
    {
        id: 4,
        category: 'Plants',
        question: 'How do I update plant care notes?',
        answer: 'Open Staff Plants, edit the plant entry, update care notes or category, and save to keep records current.'
    },
    {
        id: 5,
        category: 'Reservations',
        question: 'How do I verify ticket reservations?',
        answer: 'Open Staff Reservations, review the ticket request, and update the status to confirm or decline.'
    },
    {
        id: 6,
        category: 'Reservations',
        question: 'How do I handle event reservations?',
        answer: 'In Staff Reservations, switch to event requests, review details, and update the confirmation status after verification.'
    },
    {
        id: 7,
        category: 'Community',
        question: 'How do I moderate community posts?',
        answer: 'Use Community Moderation to review posts and reports. Approve or remove content and leave a note for the review log.'
    },
    {
        id: 8,
        category: 'Community',
        question: 'How do I respond to reported comments?',
        answer: 'Open the reported comment, review context, and choose the correct action. If needed, add a brief reason for audit trail.'
    },
    {
        id: 9,
        category: 'Troubleshooting',
        question: 'Why are records missing from the dashboard?',
        answer: 'Refresh the page and confirm the filters are set correctly. If data remains missing, verify the backend connection is active.'
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
            <div className="bg-[#f6fdf8] border border-green-300 rounded-3xl p-6 md:p-8">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center text-green-800 mb-5">
                    <HelpCircleIcon className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-bold text-green-800 mb-2">Staff Help Center</h1>
                <p className="text-green-800 max-w-3xl">
                    Staff help center for daily operations, reservations, moderation, and record updates.
                </p>
            </div>

            <div className="bg-white border border-green-300 rounded-2xl p-5 md:p-6">
                <div className="relative mb-4">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-800">
                        <SearchIcon className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search staff help topics"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="w-full bg-[#f6fdf8] border border-green-300 rounded-xl py-3.5 pl-12 pr-4 text-green-800 placeholder-green-700 focus:outline-none focus:border-green-400"
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
                                        ? 'bg-green-400 text-gray-900 border-green-400'
                                        : 'bg-green-50 text-green-800 border-green-300 hover:border-green-300'
                                }`}
                            >
                                {category}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white border border-green-300 rounded-2xl p-5 md:p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-green-800">How-To Questions</h2>
                    <span className="text-sm text-green-800">{filteredFaqs.length} results</span>
                </div>

                {filteredFaqs.length === 0 ? (
                    <div className="bg-green-50 border border-green-300 rounded-xl p-6 text-center text-green-800">
                        No dashboard help questions matched your search.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredFaqs.map((faq) => {
                            const isExpanded = expandedFaq === faq.id;

                            return (
                                <div key={faq.id} className="border border-green-300 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                                        className="w-full px-4 py-4 text-left hover:bg-green-50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <span className="inline-flex px-2 py-0.5 mb-2 rounded text-xs font-medium bg-green-100 text-green-800">
                                                    {faq.category}
                                                </span>
                                                <p className="text-green-800 font-medium">{faq.question}</p>
                                            </div>
                                            <span className={`text-green-800 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                                <ChevronDownIcon className="w-5 h-5" />
                                            </span>
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="px-4 pb-4">
                                            <div className="bg-green-50 border border-green-300 rounded-lg p-4 text-sm text-green-800 leading-relaxed">
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
