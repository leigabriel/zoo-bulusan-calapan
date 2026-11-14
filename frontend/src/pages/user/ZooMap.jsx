import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ReactLenis } from 'lenis/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Phone, Route, Compass, ChevronRight } from 'reicon-react';
import { PAGE_BG_GRADIENT } from '../../config/page-gradient';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import AIFloatingButton from '../../components/common/AIFloatingButton';
import usePageMetadata from '../../hooks/use-page-metadata';
import { ZOO_LOCATION, ZOO_DIRECTIONS_URL } from '../../config/zoo-location';

const OSM_VIEW = `https://www.openstreetmap.org/?mlat=${ZOO_LOCATION.lat}&mlon=${ZOO_LOCATION.lng}#map=17/${ZOO_LOCATION.lat}/${ZOO_LOCATION.lng}`;

const formatDistance = (kilometers) => (
    kilometers < 1
        ? `${Math.round(kilometers * 1000)} m`
        : `${kilometers.toFixed(kilometers < 10 ? 1 : 0)} km`
);

const ZooMap = () => {
    usePageMetadata(
        'Bulusan Zoo Map & Directions | Calapan City',
        'Find Bulusan Zoo in Barangay Bulusan, Calapan City, Oriental Mindoro, view it on an interactive OpenStreetMap map, and get directions from your current location.',
        'https://bulusanzoo.com/map'
    );

    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const routeLayerRef = useRef(null);
    const userLayerRef = useRef(null);
    const abortRef = useRef(null);
    const mountedRef = useRef(true);

    const [locating, setLocating] = useState(false);
    const [routeInfo, setRouteInfo] = useState(null);
    const [locateError, setLocateError] = useState('');

    useEffect(() => {
        const container = mapContainerRef.current;
        if (!container) return undefined;

        const map = L.map(container, {
            center: [ZOO_LOCATION.lat, ZOO_LOCATION.lng],
            zoom: 16,
            zoomControl: true,
            // The page itself scrolls; wheel zoom only starts after a deliberate click.
            scrollWheelZoom: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        const zooIcon = L.divIcon({
            className: '',
            html: '<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#15803d;border:3px solid #ffffff;box-shadow:0 8px 18px rgba(0,0,0,0.35)"></div>',
            iconSize: [34, 34],
            iconAnchor: [17, 34],
            popupAnchor: [0, -34],
        });

        L.marker([ZOO_LOCATION.lat, ZOO_LOCATION.lng], { icon: zooIcon, title: 'Bulusan Zoo' })
            .addTo(map)
            .bindPopup(`<strong>Bulusan Zoo</strong><br />${ZOO_LOCATION.plusCode}, Calapan City`)
            .openPopup();

        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
            routeLayerRef.current = null;
            userLayerRef.current = null;
        };
    }, []);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            abortRef.current?.abort();
        };
    }, []);

    const findRoute = () => {
        if (!navigator.geolocation) {
            setLocateError(
                'This browser cannot share your location. You can still open directions in Google Maps below.'
            );
            return;
        }

        setLocating(true);
        setLocateError('');
        setRouteInfo(null);

        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                const map = mapRef.current;
                if (!map) return;

                abortRef.current?.abort();
                const controller = new AbortController();
                abortRef.current = controller;

                try {
                    const url = `https://router.project-osrm.org/route/v1/driving/${coords.longitude},${coords.latitude};${ZOO_LOCATION.lng},${ZOO_LOCATION.lat}?overview=full&geometries=geojson`;
                    const response = await fetch(url, { signal: controller.signal });
                    if (!response.ok) throw new Error('Route request failed');

                    const data = await response.json();
                    const route = data?.routes?.[0];
                    const points = route?.geometry?.coordinates;
                    if (!Array.isArray(points) || points.length === 0) throw new Error('No route found');

                    if (routeLayerRef.current) map.removeLayer(routeLayerRef.current);
                    routeLayerRef.current = L.polyline(
                        points.map(([lng, lat]) => [lat, lng]),
                        { color: '#15803d', weight: 5, opacity: 0.9, lineJoin: 'round' }
                    ).addTo(map);

                    if (userLayerRef.current) {
                        userLayerRef.current.setLatLng([coords.latitude, coords.longitude]);
                    } else {
                        userLayerRef.current = L.circleMarker([coords.latitude, coords.longitude], {
                            radius: 7,
                            color: '#ffffff',
                            weight: 3,
                            fillColor: '#0284c7',
                            fillOpacity: 1,
                        }).addTo(map).bindTooltip('You are here');
                    }

                    map.fitBounds(routeLayerRef.current.getBounds(), { padding: [48, 48] });

                    if (!mountedRef.current) return;
                    setRouteInfo({
                        distanceKm: route.distance / 1000,
                        minutes: Math.max(1, Math.round(route.duration / 60)),
                    });
                } catch (error) {
                    if (error.name === 'AbortError' || !mountedRef.current) return;
                    setLocateError(
                        "We couldn't work out a route from your location. Please try again, or open directions in Google Maps below."
                    );
                } finally {
                    if (mountedRef.current) setLocating(false);
                }
            },
            (error) => {
                if (!mountedRef.current) return;
                setLocating(false);

                if (error.code === error.PERMISSION_DENIED) {
                    setLocateError(
                        'Location access is blocked. Allow location access for this site in your browser settings, or open directions in Google Maps below.'
                    );
                } else if (error.code === error.TIMEOUT) {
                    setLocateError(
                        'Finding your location took too long. Please try again, or open directions in Google Maps below.'
                    );
                } else {
                    setLocateError(
                        "We couldn't get your current location. Please try again, or open directions in Google Maps below."
                    );
                }
            },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
        );
    };

    return (
        <ReactLenis root>
            <div className={`min-h-dvh text-black ${PAGE_BG_GRADIENT}`}>
                <Header />

                <section className="flex min-h-[40vh] w-full flex-col items-center justify-center px-4 pb-10 pt-24 md:min-h-[55vh] md:pb-16">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                        Plan your visit
                    </p>
                    <h1 className="mt-4 w-full max-w-full text-center text-[clamp(3.5rem,12vw,11rem)] font-bold leading-[1.05] tracking-tight text-black">
                        Find Us
                    </h1>
                    <p className="mt-6 max-w-2xl text-center text-sm font-medium leading-6 text-gray-600 md:text-lg md:leading-8">
                        Bulusan Zoo sits in Barangay Bulusan, Calapan City, Oriental Mindoro. See the park on the map
                        and get directions from where you are.
                    </p>
                </section>

                <main className="mx-auto w-full max-w-[1500px] px-4 pb-20 md:px-8 md:pb-28">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
                        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
                            <div
                                data-lenis-prevent
                                className="relative z-0 h-[420px] overflow-hidden rounded-xl bg-gray-100 sm:h-[520px] lg:h-[620px]"
                            >
                                <div
                                    ref={mapContainerRef}
                                    className="h-full w-full"
                                    role="region"
                                    aria-label="Interactive map showing the location of Bulusan Zoo in Calapan City"
                                />
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-3 px-3 pb-1 pt-3">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                                    OpenStreetMap · Bulusan Zoo
                                </p>
                                <a
                                    href={OSM_VIEW}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[11px] font-bold uppercase tracking-widest text-black underline decoration-black/20 underline-offset-4 transition-colors hover:decoration-black"
                                >
                                    View larger map
                                </a>
                            </div>
                        </div>

                        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
                            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                                    Bulusan Zoo
                                </p>
                                <h2 className="mt-2 text-2xl font-bold tracking-tight">Zoo address</h2>
                                <p className="mt-3 text-base font-medium leading-7 text-gray-700">
                                    {ZOO_LOCATION.address}
                                </p>
                                <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                                    Plus code {ZOO_LOCATION.plusCode}
                                </p>

                                <a
                                    href={ZOO_LOCATION.phoneHref}
                                    className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-black transition-colors hover:text-green-700"
                                >
                                    <Phone size={16} aria-hidden="true" />
                                    {ZOO_LOCATION.phone}
                                </a>

                                <p className="mt-6 text-[11px] font-bold uppercase tracking-widest text-gray-500">
                                    Directions
                                </p>
                                <div className="mt-3 flex flex-col gap-3">
                                    <button
                                        type="button"
                                        onClick={findRoute}
                                        disabled={locating}
                                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                                    >
                                        <Route size={16} aria-hidden="true" />
                                        {locating ? 'Finding your location…' : 'Directions from my location'}
                                    </button>
                                    <a
                                        href={ZOO_DIRECTIONS_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 border-black px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white"
                                    >
                                        <Compass size={16} aria-hidden="true" />
                                        Open in Google Maps
                                    </a>
                                </div>

                                <div aria-live="polite" className="mt-5">
                                    {routeInfo ? (
                                        <p className="border-l-2 border-green-600 pl-3 text-sm leading-6 text-gray-700">
                                            <strong className="font-bold text-black">
                                                {formatDistance(routeInfo.distanceKm)} away · about{' '}
                                                {routeInfo.minutes} min
                                            </strong>{' '}
                                            by car. This estimate does not include traffic or road closures.
                                        </p>
                                    ) : null}
                                    {locateError ? (
                                        <p className="border-l-2 border-amber-500 pl-3 text-sm leading-6 text-amber-800">
                                            {locateError}
                                        </p>
                                    ) : null}
                                    {!routeInfo && !locateError ? (
                                        <p className="text-xs leading-5 text-gray-500">
                                            Your browser will ask for location access. Your location is used only in
                                            this page to draw the route and is never saved.
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-white p-6">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                                    Before you go
                                </p>
                                <p className="mt-2 text-sm leading-6 text-gray-600">
                                    Admission tickets and event bookings are handled separately. Reserve online
                                    before you travel so your slot is ready when you arrive.
                                </p>
                                <Link
                                    to="/reservations"
                                    className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-black underline decoration-black/25 underline-offset-4 transition-colors hover:decoration-black"
                                >
                                    Reserve a visit
                                    <ChevronRight size={14} aria-hidden="true" />
                                </Link>
                            </div>
                        </aside>
                    </div>
                </main>

                <section className="border-t border-black/10 bg-green-400 px-4 py-16 md:py-24">
                    <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-black/60">
                            Keep exploring
                        </p>
                        <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-5xl">Make a day of it</h2>
                        <p className="mt-4 max-w-xl text-sm leading-7 text-black/70 md:text-base">
                            Reserve a slot before you travel, or see what events are coming up at the park.
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link
                                to="/reservations"
                                className="inline-flex min-h-12 items-center justify-center rounded-full bg-black px-7 py-3 text-[11px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-gray-800"
                            >
                                Reserve a visit
                            </Link>
                            <Link
                                to="/events"
                                className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-black px-7 py-3 text-[11px] font-bold uppercase tracking-widest text-black transition-colors hover:bg-black hover:text-white"
                            >
                                See events
                            </Link>
                        </div>
                    </div>
                </section>

                <Footer />
                <AIFloatingButton />
            </div>
        </ReactLenis>
    );
};

export default ZooMap;
