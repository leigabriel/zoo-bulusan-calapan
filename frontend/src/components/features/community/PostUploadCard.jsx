import { getProfileImageUrl } from '../../../services/api-client';

// The Facebook/Instagram pattern: a post becomes visible in the feed the instant it is
// published, carrying a progress bar and a clear "not posted yet" label, and is replaced by
// the real post once the server has it. The card is deliberately inert — none of the normal
// like/comment/report affordances are rendered, because there is nothing on the server to act
// on yet.
const PostUploadCard = ({ item, currentUser }) => {
    const percent = Math.round((item.progress || 0) * 100);
    const failed = item.status === 'failed';
    const done = item.status === 'done';

    const statusLabel = failed
        ? (item.error || "Couldn't upload your post.")
        : done
            ? 'Posted'
            : `Uploading ${percent}%`;

    return (
        <article
            className="min-w-0 overflow-hidden rounded-md border border-gray-600 bg-white"
            aria-busy={!done && !failed}
        >
            <div className="flex items-start gap-4 px-4 py-4 sm:px-5 sm:py-5">
                <img
                    src={getProfileImageUrl(currentUser?.profileImage) || 'https://via.placeholder.com/56x56?text=U'}
                    alt=""
                    aria-hidden="true"
                    className="h-10 w-10 rounded-full object-cover"
                />
                <div className="flex flex-col">
                    <p className="text-sm font-black uppercase tracking-tight text-black">
                        {currentUser?.firstName} {currentUser?.lastName}
                    </p>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-black/50">
                        {failed ? 'Upload failed' : done ? 'Just now' : 'Uploading now'}
                    </p>
                </div>
            </div>

            <div className="px-4 py-2 sm:px-5 sm:py-3">
                <p className="whitespace-pre-wrap text-lg font-medium leading-relaxed tracking-tight text-black md:text-xl">
                    {item.content}
                </p>
            </div>

            {item.previewUrls?.length > 0 && (
                <div className="grid grid-cols-2 gap-1 px-4 pb-1 sm:px-5 sm:grid-cols-3">
                    {item.previewUrls.map((url, index) => (
                        <img
                            key={`${url}-${index}`}
                            src={url}
                            alt=""
                            aria-hidden="true"
                            className="h-32 w-full object-cover"
                        />
                    ))}
                </div>
            )}

            <div className="px-4 py-4 sm:px-5" role="status" aria-live="polite">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
                    <div
                        className={`h-full rounded-full transition-[width] duration-300 ease-out ${failed ? 'bg-red-600' : 'bg-black'}`}
                        // Hold a sliver at the very start so the bar reads as "present but
                        // empty" rather than as a rendering glitch before the first progress event.
                        style={{ width: `${failed ? 100 : Math.max(2, percent)}%` }}
                    />
                </div>
                <p className={`mt-2 text-[10px] font-bold uppercase tracking-[0.18em] ${failed ? 'text-red-600' : 'text-black/50'}`}>
                    {statusLabel}
                </p>
            </div>
        </article>
    );
};

export default PostUploadCard;