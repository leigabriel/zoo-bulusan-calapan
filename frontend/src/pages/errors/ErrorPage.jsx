// Shared shell for the standalone error routes. Kept deliberately plain: these
// pages must render without the public Header/Footer or any data fetching.
const ErrorPage = ({ code, title, description, children }) => (
    <main className="flex min-h-dvh items-center justify-center bg-white px-4 py-16">
        <div className="w-full max-w-lg text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-gray-400">
                Bulusan Zoo
            </p>
            <p className="mt-6 text-7xl font-bold leading-none tracking-tight text-black sm:text-8xl">
                {code}
            </p>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-black sm:text-3xl">
                {title}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-gray-500">
                {description}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                {children}
            </div>
        </div>
    </main>
);

export default ErrorPage;
