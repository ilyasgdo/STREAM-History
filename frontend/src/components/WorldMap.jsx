import { useEffect, useState, useRef } from 'react';
import { MapContainer, GeoJSON, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// We'll fetch GeoJSON from a reliable CDN
const GEOJSON_URL = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';

function WorldMap({ onCountrySelect, selectedCountry }) {
    const [countriesData, setCountriesData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const geoJsonRef = useRef();

    useEffect(() => {
        // Fetch GeoJSON data
        fetch(GEOJSON_URL)
            .then((res) => res.json())
            .then((data) => {
                setCountriesData(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error loading GeoJSON:', err);
                setError('Erreur de chargement de la carte');
                setLoading(false);
            });
    }, []);

    // Style for countries
    const countryStyle = (feature) => {
        const isSelected = selectedCountry &&
            feature.properties.ADMIN === selectedCountry.name;

        return {
            fillColor: isSelected ? '#ee6c4d' : '#3d5a80',
            weight: 1,
            opacity: 1,
            color: '#1b263b',
            fillOpacity: isSelected ? 0.8 : 0.5,
        };
    };

    // Hover style
    const highlightFeature = (e) => {
        const layer = e.target;
        layer.setStyle({
            fillColor: '#ee6c4d',
            fillOpacity: 0.7,
            weight: 2,
        });
        layer.bringToFront();
    };

    // Reset style on mouse out
    const resetHighlight = (e) => {
        if (geoJsonRef.current) {
            geoJsonRef.current.resetStyle(e.target);
        }
    };

    // Click handler
    const onEachCountry = (feature, layer) => {
        // GeoJSON properties can vary - try different common property names
        const props = feature.properties;
        const countryName = props.ADMIN || props.name || props.NAME || props.sovereignt || 'Unknown';
        const countryCode = props.ISO_A3 !== '-99' ? props.ISO_A3 : (props.ISO_A2 || props.iso_a3 || props.iso_a2 || countryName.substring(0, 3).toUpperCase());

        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: () => {
                console.log('Country clicked:', { name: countryName, code: countryCode, props });
                onCountrySelect({
                    name: countryName,
                    code: countryCode,
                });
            },
        });

        // Add tooltip
        layer.bindTooltip(countryName, {
            permanent: false,
            direction: 'center',
            className: 'country-tooltip',
        });
    };

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-surface rounded-xl">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-text-muted">Chargement de la carte...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-surface rounded-xl">
                <div className="text-center text-red-400">
                    <p>{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-accent rounded-lg hover:bg-accent/80"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full rounded-xl overflow-hidden border border-white/10">
            <MapContainer
                center={[20, 0]}
                zoom={2}
                minZoom={2}
                maxZoom={6}
                scrollWheelZoom={true}
                className="w-full h-full"
                style={{ background: '#0d1b2a' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                {countriesData && (
                    <GeoJSON
                        ref={geoJsonRef}
                        data={countriesData}
                        style={countryStyle}
                        onEachFeature={onEachCountry}
                    />
                )}
            </MapContainer>
        </div>
    );
}

export default WorldMap;
