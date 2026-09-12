export const browserPrintAdapter = {
    isSupported: () => typeof window !== 'undefined' && typeof window.print === 'function',
    print: async () => {
        if (!browserPrintAdapter.isSupported()) throw new Error('Browser printing is unavailable.');
        if (document.fonts?.ready) await document.fonts.ready;
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        window.print();
    }
};
