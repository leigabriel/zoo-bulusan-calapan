// The keys match POST_REPORT_REASONS in backend/utils/post-report-rules.js exactly; only
// the key is ever persisted, never the label. Shared by the visitor report modal and the
// moderation queue so staff never see a raw key like "hate_speech" on screen.
export const POST_REPORT_REASONS = [
    { value: 'spam', label: 'Spam or advertising' },
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'hate_speech', label: 'Hate speech or discrimination' },
    { value: 'inappropriate', label: 'Inappropriate or offensive content' },
    { value: 'misinformation', label: 'False or misleading information' },
    { value: 'personal_info', label: 'Sharing personal information' },
    { value: 'other', label: 'Other (specify)' }
];

export const POST_REPORT_REASON_LABELS = Object.fromEntries(
    POST_REPORT_REASONS.map((option) => [option.value, option.label])
);
