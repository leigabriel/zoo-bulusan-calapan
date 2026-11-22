import { useCallback, useRef, useState } from 'react';

/**
 * Guards an edit form against accidental data loss.
 *
 * `reset` stores the values the form opened with. `requestClose` compares the
 * current values against that snapshot, so an untouched form still closes in a
 * single click while edited values go through a discard confirmation.
 */
export default function useUnsavedChanges() {
    const baselineRef = useRef(null);
    const discardHandlerRef = useRef(null);
    const [isDiscardOpen, setIsDiscardOpen] = useState(false);

    const reset = useCallback((snapshot) => {
        baselineRef.current = JSON.stringify(snapshot);
        discardHandlerRef.current = null;
        setIsDiscardOpen(false);
    }, []);

    const isDirty = useCallback((snapshot) => {
        if (baselineRef.current === null) return false;
        return JSON.stringify(snapshot) !== baselineRef.current;
    }, []);

    const requestClose = useCallback((snapshot, close) => {
        if (!isDirty(snapshot)) {
            close();
            return;
        }

        discardHandlerRef.current = close;
        setIsDiscardOpen(true);
    }, [isDirty]);

    const confirmDiscard = useCallback(() => {
        const close = discardHandlerRef.current;
        discardHandlerRef.current = null;
        setIsDiscardOpen(false);
        close?.();
    }, []);

    const cancelDiscard = useCallback(() => {
        discardHandlerRef.current = null;
        setIsDiscardOpen(false);
    }, []);

    return { reset, isDirty, requestClose, confirmDiscard, cancelDiscard, isDiscardOpen };
}
