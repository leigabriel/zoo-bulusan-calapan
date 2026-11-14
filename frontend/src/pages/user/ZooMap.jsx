import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPoint, Phone, Route, Compass } from 'reicon-react';
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
        <div className="min-h-screen bg-[#f4f6f0] text-[#1f3328]">
            <Header />

            <main className="mx-auto max-w-[1500px] px-4 pb-20 pt-28 sm:px-6 sm:pt-32 md:px-10">
                <div className="max-w-3xl">
                    <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-[#6d8572]">
                        <MapPoint size={14} aria-hidden="true" />
                        Plan your visit
                    </p>
                    <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Find Bulusan Zoo</h1>
                    <p className="mt-4 text-base leading-7 text-[#52675a] sm:text-lg sm:leading-8">
                        Bulusan Zoo sits in Barangay Bulusan, Calapan City, Oriental Mindoro. Use the map to see
                        where the park is, then get a driving route from your current location.
                    </p>
                </div>

                <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="relative z-0 h-[420px] overflow-hidden rounded-3xl border border-[#dce5dc] bg-[#e6ece1] shadow-sm sm:h-[500px] lg:h-[580px]">
                        <div
                            ref={mapContainerRef}
                            className="h-full w-full"
                            role="region"
                            aria-label="Interactive map showing the location of Bulusan Zoo in Calapan City"
                        />
                    </div>

                    <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
                        <div className="rounded-3xl border border-[#dce5dc] bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-black tracking-tight">Zoo address</h2>
                            <p className="mt-3 text-base font-semibold leading-7 text-[#315b37]">{ZOO_LOCATION.address}</p>
                            <p className="mt-1 text-xs font-medium uppercase tracking-widest text-[#6d8572]">
                                Plus code {ZOO_LOCATION.plusCode}
                            </p>

                            <a
                                href={ZOO_LOCATION.phoneHref}
                                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#315b37] transition-colors hover:text-[#1f3328]"
                            >
                                <Phone size={16} aria-hidden="true" />
                                {ZOO_LOCATION.phone}
                            </a>

                            <div className="mt-6 flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={findRoute}
                                    disabled={locating}
                                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1f3328] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#315b37] disabled:cursor-not-allowed disabled:bg-[#9aa89a]"
                                >
                                    <Route size={17} aria-hidden="true" />
                                    {locating ? 'Finding your location…' : 'Get directions from my location'}
                                </button>
                                <a
                                    href={ZOO_DIRECTIONS_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#cfdccf] bg-[#f7faf5] px-5 py-3 text-sm font-bold text-[#315b37] transition-colors hover:border-[#315b37] hover:bg-white"
                                >
                                    <Compass size={17} aria-hidden="true" />
                                    Open directions in Google Maps
                                </a>
                            </div>

                            <div aria-live="polite" className="mt-5">
                                {routeInfo ? (
                                    <p className="rounded-2xl border border-[#cfe5cf] bg-[#eef7ec] px-4 py-3 text-sm leading-6 text-[#254c2c]">
                                        <strong>
                                            {formatDistance(routeInfo.distanceKm)} away · about {routeInfo.minutes} min
                                        </strong>{' '}
                                        by car. This estimate does not include traffic or road closures.
                                    </p>
                                ) : null}
                                {locateError ? (
                                    <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                                        {locateError}
                                    </p>
                                ) : null}
                                {!routeInfo && !locateError ? (
                                    <p className="text-xs leading-5 text-[#6d8572]">
                                        Your browser will ask for location access. Your location is used only in
                                        this page to draw the route and is never saved.
                                    </p>
                                ) : null}
                            </div>

                            <a
                                href={OSM_VIEW}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-5 inline-block text-xs font-semibold text-[#6d8572] underline decoration-[#cfdccf] underline-offset-4 transition-colors hover:text-[#315b37]"
                            >
                                View on OpenStreetMap
                            </a>
                        </div>

                        <div className="rounded-3xl border border-[#dce5dc] bg-[#eef3ed] p-5">
                            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#6d8572]">
                                Before you go
                            </p>
                            <p className="mt-2 text-sm leading-6 text-[#52675a]">
                                Admission tickets and event bookings are handled separately. Reserve online before
                                you travel so your slot is ready when you arrive.
                            </p>
                        </div>
                    </aside>
                </div>
            </main>

            <Footer />
            <AIFloatingButton />
        </div>
    );
};

export default ZooMap;
