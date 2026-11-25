// A community post carries at most one video. The wrapper stops click events from reaching
// the surrounding feed card, so using the player controls does not open the post dialog.
const PostVideo = ({
    src,
    className = '',
    videoClassName = 'h-auto max-h-[600px] w-full bg-black object-contain'
}) => {
    if (!src) return null;

    return (
        <div className={`flex items-center justify-center overflow-hidden bg-black ${className}`}>
            <video
                src={src}
                controls
                playsInline
                preload="metadata"
                aria-label="Post video"
                className={videoClassName}
                onClick={(event) => event.stopPropagation()}
            >
                Your browser does not support embedded videos.
            </video>
        </div>
    );
};

export default PostVideo;
