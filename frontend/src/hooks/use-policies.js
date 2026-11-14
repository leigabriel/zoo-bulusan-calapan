import { useCallback, useEffect, useState } from 'react';
import { legalAPI } from '../services/api-client';

// Legal pages are public and rarely change, so the first fetch is shared by
// every page and modal that needs it during the same visit. A failed request
// is not cached, which keeps the retry button meaningful.
let cachedPolicies = null;
let pendingRequest = null;

const loadPolicies = () => {
    if (cachedPolicies) return Promise.resolve(cachedPolicies);

    if (!pendingRequest) {
        pendingRequest = legalAPI.getPolicies()
            .then((response) => {
                if (!response?.success || !response.policies) {
                    throw new Error('Policy content is unavailable.');
                }
                cachedPolicies = response.policies;
                return cachedPolicies;
            })
            .finally(() => {
                pendingRequest = null;
            });
    }

    return pendingRequest;
};

// Called after an administrator saves, so the policy pages opened later in the
// same session show the new text and the new "last updated" date instead of the
// copy that was cached before the save.
export const invalidatePolicies = () => {
    cachedPolicies = null;
};

const usePolicies = (enabled = true) => {
    const [policies, setPolicies] = useState(cachedPolicies);
    const [loading, setLoading] = useState(Boolean(enabled && !cachedPolicies));
    const [error, setError] = useState(null);

    const fetchPolicies = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            setPolicies(await loadPolicies());
        } catch (err) {
            setError(err?.message || 'Policy content is unavailable.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!enabled || cachedPolicies) return;
        fetchPolicies();
    }, [enabled, fetchPolicies]);

    return { policies, loading, error, retry: fetchPolicies };
};

export default usePolicies;
