import { useEffect } from 'react';

// Sets the document title, description, social tags and canonical URL for the current
// page and restores the previous values on unmount.
const usePageMetadata = (title, description, canonical) => {
    useEffect(() => {
        const updates = [
            ['meta[name="title"]', title],
            ['meta[name="description"]', description],
            ['meta[property="og:title"]', title],
            ['meta[property="og:description"]', description],
            ['meta[property="og:url"]', canonical],
            ['meta[name="twitter:title"]', title],
            ['meta[name="twitter:description"]', description],
        ];
        const previousTitle = document.title;
        const previousValues = updates.map(([selector, value]) => {
            const element = document.querySelector(selector);
            const previous = element?.getAttribute('content');
            if (element) element.setAttribute('content', value);
            return [element, previous];
        });
        const canonicalElement = document.querySelector('link[rel="canonical"]');
        const previousCanonical = canonicalElement?.getAttribute('href');

        document.title = title;
        if (canonicalElement) canonicalElement.setAttribute('href', canonical);

        return () => {
            document.title = previousTitle;
            previousValues.forEach(([element, value]) => {
                if (element && value !== null && value !== undefined) element.setAttribute('content', value);
            });
            if (canonicalElement && previousCanonical) canonicalElement.setAttribute('href', previousCanonical);
        };
    }, [canonical, description, title]);
};

export default usePageMetadata;
