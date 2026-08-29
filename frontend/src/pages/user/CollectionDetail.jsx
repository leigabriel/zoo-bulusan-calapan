import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { ReactLenis } from 'lenis/react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import { userAPI } from '../../services/api-client';

const MotionDiv = motion.div;

const collectionConfig = {
    animals: {
        singular: 'animal',
        plural: 'animals',
        eyebrow: 'Wildlife collection',
        endpoint: 'getAnimals',
        detailEndpoint: 'getAnimal',
        responseKey: 'animal',
        map: (item) => ({
            id: item.id ?? item.animal_id,
            name: item.name,
            category: item.species || 'Unknown species',
            location: item.habitat || item.exhibit || 'Zoo Bulusan',
            description: item.animal_information || item.animalInformation || item.description || '',
            imageUrl: item.image_url || null,
            status: item.status || 'healthy',
            lifespan: item.lifespan || null,
            weight: item.weight || null,
            length: item.length || null,
            habitat: item.habitat || null,
            diet: item.diet || null,
        }),
    },
    plants: {
        singular: 'plant',
        plural: 'plants',
        eyebrow: 'Botanical collection',
        endpoint: 'getPlants',
        detailEndpoint: 'getPlant',
        responseKey: 'plant',
        map: (item) => ({
            id: item.id ?? item.plant_id,
            name: item.name,
            category: item.category || 'Flora',
            location: item.location || 'Zoo Bulusan',
            description: item.description || '',
            imageUrl: item.image_url || null,
        }),
    },
};

const statusMap = {
    healthy: { label: 'Healthy', dot: 'bg-green-600' },
    sick: { label: 'Under care', dot: 'bg-red-600' },
    recovering: { label: 'Recovering', dot: 'bg-amber-600' },
};

const getStatus = (status) => statusMap[status?.toLowerCase()] || { label: status || 'Active', dot: 'bg-green-600' };

const ImageFrame = ({ item, className = '' }) => (
    <div className={`overflow-hidden bg-[#e9eee8] ${className}`}>
        {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
        ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#e9eee8]">
                <span className="text-6xl font-black uppercase tracking-[-0.08em] text-[#c8d5c6]">{item.name?.[0]}</span>
            </div>
        )}
    </div>
);

const DetailStat = ({ label, value }) => value ? (
    <div className="border-t border-black/15 pt-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/50">{label}</p>
        <p className="mt-1 text-sm font-semibold text-black">{value}</p>
    </div>
) : null;

const CollectionDetail = ({ type }) => {
    const { id } = useParams();
    const config = collectionConfig[type];
    const titleRef = useRef(null);
    const [items, setItems] = useState([]);
    const [displayItem, setDisplayItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [id]);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');

        const loadItems = async () => {
            try {
                const response = await userAPI[config.endpoint]();
                if (!active) return;

                let mappedItems = [];
                if (response.success && Array.isArray(response[config.plural])) {
                    const seen = new Set();
                    mappedItems = response[config.plural].map(config.map).filter((entry) => {
                        if (seen.has(entry.id)) return false;
                        seen.add(entry.id);
                        return true;
                    });
                    setItems(mappedItems);
                } else {
                    setItems([]);
                }

                const listedItem = mappedItems.find((entry) => String(entry.id) === String(id));
                if (listedItem) {
                    setDisplayItem(listedItem);
                } else {
                    const detailResponse = await userAPI[config.detailEndpoint](id);
                    if (active && detailResponse.success && detailResponse[config.responseKey]) {
                        setDisplayItem(config.map(detailResponse[config.responseKey]));
                    }
                }
            } catch {
                if (active) setError(`We couldn't load this ${config.singular}.`);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadItems();
        return () => { active = false; };
    }, [config, id]);

    const item = displayItem;
    const related = items.filter((entry) => String(entry.id) !== String(item?.id));
    const status = type === 'animals' ? getStatus(item?.status) : null;

    useEffect(() => {
        if (!loading && item) {
            requestAnimationFrame(() => titleRef.current?.focus());
        }
    }, [item, loading]);

    return (
        <ReactLenis root>
            <div className="min-h-screen bg-white text-[#111]">
                <Header />
                <main>
                    {loading && !item && <div className="flex min-h-[65vh] items-center justify-center"><div className="h-7 w-7 animate-spin rounded-full border-2 border-black/10 border-t-[#315b37]" /></div>}

                    {!loading && (error || !item) && (
                        <section className="mx-auto flex min-h-[65vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/45">{error || `${config.singular} not found`}</p>
                            <Link to={`/${config.plural}`} className="mt-6 rounded-full bg-[#315b37] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#24472a]">Back to {config.plural}</Link>
                        </section>
                    )}

                    {!error && item && (
                        <AnimatePresence mode="wait" initial={false}>
                            <MotionDiv
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            >
                            <section className="mx-auto max-w-[1800px] px-4 pb-16 pt-24 sm:px-8 sm:pt-28">
                                <div className="mt-7 grid overflow-hidden rounded-3xl bg-green-400 md:h-[520px] md:grid-cols-[1fr_0.95fr]">
                                    <ImageFrame item={item} className="aspect-[4/3] min-h-[260px] md:h-full md:aspect-auto md:min-h-0" />
                                    <div className="flex flex-col justify-between p-7 sm:p-10">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#315b37]">{config.eyebrow}</p>
                                            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.16em] text-black/60">
                                                {status && <><span className={`h-2 w-2 rounded-full ${status.dot}`} /> {status.label}</>}
                                                <span>{item.category}</span>
                                            </div>
                                            <h1 ref={titleRef} tabIndex="-1" className="mt-5 max-w-lg text-5xl font-black leading-[0.92] tracking-[-0.05em] outline-none sm:text-6xl">{item.name}</h1>
                                            <p className="mt-6 max-w-lg text-base leading-7 text-black/75">{item.description || `Learn more about this ${config.singular} in the Bulusan Zoo collection.`}</p>
                                        </div>
                                        <div className="mt-9 border-t border-black/15 pt-4">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/50">Collection location</p>
                                            <p className="mt-1 text-sm font-semibold">{item.location}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="mx-auto max-w-[1800px] px-4 pb-20 sm:px-8">
                                <div className="grid gap-8 border-t border-black/10 pt-10 lg:grid-cols-[0.75fr_1.25fr]">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#315b37]">Field notes</p>
                                        <h2 className="mt-3 max-w-sm text-3xl font-black leading-tight tracking-[-0.03em] sm:text-4xl">A closer look at the details.</h2>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3">
                                        {type === 'animals' ? <>
                                            <DetailStat label="Species" value={item.category} />
                                            <DetailStat label="Lifespan" value={item.lifespan} />
                                            <DetailStat label="Weight" value={item.weight} />
                                            <DetailStat label="Length" value={item.length} />
                                            <DetailStat label="Habitat" value={item.habitat} />
                                            <DetailStat label="Diet" value={item.diet} />
                                        </> : <DetailStat label="Category" value={item.category} />}
                                    </div>
                                </div>
                            </section>

                            <section className="border-t border-black/10 bg-[#f7f8f4] px-4 py-16 sm:px-8 sm:py-20">
                                <div className="mx-auto max-w-[1800px]">
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#315b37]">Continue exploring</p>
                                    <div className="mt-2 flex items-end justify-between gap-5">
                                        <h2 className="text-3xl font-black tracking-[-0.03em] sm:text-4xl">More {config.plural}</h2>
                                        <Link to={`/${config.plural}`} className="text-sm font-bold text-black/60 transition-colors hover:text-[#315b37]">View all</Link>
                                    </div>
                                    {related.length > 0 ? (
                                        <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                                            {related.map((relatedItem) => (
                                                <Link key={relatedItem.id} to={`/${config.plural}/${relatedItem.id}`} className="group min-w-0">
                                                    <ImageFrame item={relatedItem} className="aspect-square rounded-2xl transition-transform duration-300 group-hover:scale-[1.02]" />
                                                    <h3 className="mt-3 truncate text-base font-bold">{relatedItem.name}</h3>
                                                    <p className="mt-1 truncate text-sm text-black/50">{relatedItem.category}</p>
                                                </Link>
                                            ))}
                                        </div>
                                    ) : <p className="mt-8 text-sm text-black/50">This is the only entry in the collection so far.</p>}
                                </div>
                            </section>
                            </MotionDiv>
                        </AnimatePresence>
                    )}
                </main>
                <AIFloatingButton />
                <Footer />
            </div>
        </ReactLenis>
    );
};

export const AnimalDetail = () => <CollectionDetail type="animals" />;
export const PlantDetail = () => <CollectionDetail type="plants" />;