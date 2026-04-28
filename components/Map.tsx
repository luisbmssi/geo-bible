"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker
} from "react-simple-maps";
import { geoCentroid } from "d3-geo";

export type SoldCitiesMap = Record<string, boolean>;


export type CityIndex = Record<string, string[]>;

export interface SoldCityData {
    city: string;
    uf: string;
    bible_id: string;
    reference: string;
    name?: string;
    date?: string;
}

export type SoldCitiesDataMap = Record<string, SoldCityData>;

interface MapChartProps {
    soldCities?: SoldCitiesMap;
    soldCitiesData?: SoldCitiesDataMap;
    cityIndex?: CityIndex;
    onStateSelect?: (uf: string | null) => void;
    onSoldCityClick?: (data: SoldCityData) => void;
}

interface MapChartProps {
    soldCities?: SoldCitiesMap;
    cityIndex?: CityIndex;
    onStateSelect?: (uf: string | null) => void;
}

const BRAZIL_PROJECTION = {
    scale: 540,
    center: [-54, -22] as [number, number],
};

function getStateProjection(uf: string): { scale: number; center: [number, number] } {
    const centers: Record<string, [number, number]> = {
        sp: [-48.5, -23.5], rj: [-43.2, -22.52], mg: [-44.5, -20.22],
        rs: [-53.0, -31.68], pr: [-51.5, -25.8], sc: [-50.5, -28.4],
        ba: [-41.5, -15.5], go: [-49.5, -17.4], mt: [-55.0, -15.0],
        ms: [-54.5, -22.5], pa: [-52.0, -6.5], am: [-64.0, -9.5],
        ce: [-39.5, -6.5], pe: [-37.9, -9.5], ma: [-44.5, -7.5],
        pi: [-42.5, -8.5], to: [-48.5, -11.0], ro: [-62.5, -12.0],
        rr: [-61.0, -2.0], ap: [-51.5, -0.0], ac: [-70.0, -12.5],
        rn: [-36.5, -6.8], pb: [-36.8, -8.2], al: [-36.5, -10.0],
        se: [-37.2, -10.9], es: [-40.5, -20.3], df: [-47.8, -16.0],
    };
    const scales: Record<string, number> = {
        df: 20000, se: 10000, al: 10000, rj: 8000, rn: 7000,
        pb: 6500, pe: 5000, es: 6000, sp: 3700, pr: 4000,
        sc: 5500, rs: 3000, mg: 2500, ba: 2000, go: 3000,
        ms: 2500, mt: 1800, pa: 1500, am: 1200, to: 2600,
        ma: 2400, pi: 2500, ce: 4000, ro: 3200, rr: 2000,
        ap: 3000, ac: 2000,
    };
    return {
        scale: scales[uf] ?? 3000,
        center: centers[uf] ?? [-50, -15],
    };
}

function normalize(str: string): string {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

interface SearchResult {
    name: string;
    uf: string;
    sold?: boolean;
}

export default function MapChart({ soldCities = {}, soldCitiesData = {}, cityIndex = {}, onStateSelect, onSoldCityClick }: MapChartProps) {
    const [geoData, setGeoData] = useState<object | null>(null);
    const [selectedState, setSelectedState] = useState<string | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [visible, setVisible] = useState(true);
    const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
    const [tooltip, setTooltip] = useState<{ name: string; sold: boolean; x: number; y: number } | null>(null);
    const [highlightedCity, setHighlightedCity] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Computa quais estados têm TODOS os municípios vendidos
    const soldStates = useMemo(() => {
        const result: Record<string, boolean> = {};
        // Agrupa todos os municípios por UF usando o cityIndex
        const citiesByUF: Record<string, string[]> = {};
        for (const [cityName, ufs] of Object.entries(cityIndex)) {
            for (const uf of ufs) {
                if (!citiesByUF[uf]) citiesByUF[uf] = [];
                citiesByUF[uf].push(cityName);
            }
        }
        // Verifica se todos os municípios de cada UF estão vendidos
        for (const [uf, cities] of Object.entries(citiesByUF)) {
            if (cities.length === 0) continue;
            result[uf] = cities.every((city) => !!soldCities[`${city}_${uf}`]);
        }
        return result;
    }, [cityIndex, soldCities]);

    const isStateView = !!selectedState;
    const projectionConfig = isStateView ? getStateProjection(selectedState) : BRAZIL_PROJECTION;

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(e.target as Node))
                setShowSuggestions(false);
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            setShowSuggestions(false);
            return;
        }
        const q = normalize(searchQuery);
        const results: SearchResult[] = [];

        for (const [name, ufs] of Object.entries(cityIndex)) {
            if (!normalize(name).includes(q)) continue;

            for (const uf of ufs) {
                results.push({ name, uf, sold: soldCities[`${name}_${uf}`] });
                if (results.length >= 10) break; // limite total de sugestões
            }
            if (results.length >= 10) break;
        }

        setSearchResults(results);
        setShowSuggestions(results.length > 0);
    }, [searchQuery, cityIndex, soldCities]);

    const loadGeoData = useCallback((state: string | null) => {
        setIsTransitioning(true);
        setVisible(false);
        const url = state ? `/geojson/municipalities/${state}.json` : "/geojson/estados.json";
        setTimeout(() => {
            fetch(url)
                .then((res) => res.json())
                .then((data) => {
                    setGeoData(data);
                    setTimeout(() => { setVisible(true); setIsTransitioning(false); }, 50);
                })
                .catch(() => { setIsTransitioning(false); setVisible(true); });
        }, 220);
    }, []);

    useEffect(() => { loadGeoData(selectedState); }, [selectedState, loadGeoData]);

    const handleStateClick = (uf: string) => {
        if (!selectedState) { setSelectedState(uf); onStateSelect?.(uf); }
    };

    const handleMunicipalityClick = (name: string, uf: string, isSold: boolean) => {
        if (isSold && onSoldCityClick) {
            const data = soldCitiesData[`${name}_${uf}`];
            if (data) onSoldCityClick(data);
        }
    };

    const handleBack = () => {
        setSelectedState(null);
        onStateSelect?.(null);
        setTooltip(null);
        setHighlightedCity(null);
        setSearchQuery("");
    };

    const handleSelectCity = (name: string, uf: string) => {
        const hasDuplicates = (cityIndex[name]?.length ?? 0) > 1;
        setSearchQuery(hasDuplicates ? `${name} · ${uf.toUpperCase()}` : name);
        setShowSuggestions(false);
        setHighlightedCity(name);
        if (selectedState !== uf) { setSelectedState(uf); onStateSelect?.(uf); }
    };

    const handleClearSearch = () => {
        setSearchQuery("");
        setHighlightedCity(null);
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const getRegionName = (geo: { properties: Record<string, string> }) =>
        geo.properties.name || geo.properties.NM_MUN || geo.properties.NOME || geo.properties.NM_ESTADO || "";

    const getUF = (geo: { properties: Record<string, string> }) =>
        (geo.properties.UF || geo.properties.SIGLA_UF || "").toLowerCase();

    if (!geoData) {
        return (
            <div className="map-loading">
                <div className="loading-ornament">✦</div>
                <p>Carregando mapa…</p>
            </div>
        );
    }

    return (
        <div className="map-wrapper">

            {/* ── Barra de busca ── */}
            <div className="search-bar-container" ref={searchRef}>
                <div className="search-input-wrap">
                    <span className="search-icon">⌕</span>
                    <input
                        ref={inputRef}
                        type="text"
                        className="search-input"
                        placeholder="Buscar município…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => searchResults.length > 0 && setShowSuggestions(true)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && searchResults.length > 0)
                                handleSelectCity(searchResults[0].name, searchResults[0].uf);
                            if (e.key === "Escape") setShowSuggestions(false);
                        }}
                    />
                    {searchQuery && (
                        <button className="search-clear" onClick={handleClearSearch}>×</button>
                    )}
                </div>

                {showSuggestions && (
                    <ul className="search-suggestions">
                        {searchResults.map((r, i) => {
                            const hasDuplicates = (cityIndex[r.name]?.length ?? 0) > 1;
                            return (
                                <li
                                    key={`${r.name}-${r.uf}-${i}`}
                                    className="suggestion-item"
                                    onMouseDown={() => handleSelectCity(r.name, r.uf)}
                                >
                                    <span className="suggestion-name">{r.name}</span>
                                    {/* Sempre mostra o estado; fica mais visível quando há duplicata */}
                                    <span className={`suggestion-uf ${hasDuplicates ? "duplicate" : ""}`}>
                                        {r.uf.toUpperCase()}
                                    </span>
                                    {r.sold !== undefined && (
                                        <span className={`suggestion-dot ${r.sold ? "sold" : "available"}`} />
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {tooltip && (
                <div className="map-tooltip" style={{ left: tooltip.x + 12, top: tooltip.y - 36 }}>
                    <span className={`tooltip-dot ${tooltip.sold ? "sold" : "available"}`} />
                    <span className="tooltip-name">{tooltip.name}</span>
                    <span className={`tooltip-status ${tooltip.sold ? "sold" : "available"}`}>
                        {tooltip.sold ? "Indisponível" : "Disponível"}
                    </span>
                </div>
            )}

            {selectedState && (
                <button className="back-button" onClick={handleBack}>
                    <span className="back-arrow">←</span><span>Brasil</span>
                </button>
            )}
            {selectedState && (
                <div className="state-label">{selectedState.toUpperCase()}</div>
            )}

            <div
                className="map-fade-container"
                style={{
                    opacity: visible ? 1 : 0,
                    transition: "opacity 0.22s ease-in-out",
                    pointerEvents: isTransitioning ? "none" : "auto",
                }}
            >
                <ComposableMap
                    projection="geoMercator"
                    projectionConfig={projectionConfig}
                    style={{ width: "100%", height: "100%" }}
                >
                    <Geographies geography={geoData}>
                        {({ geographies }) => (
                            <>
                                {geographies.map((geo) => {
                                    const name = getRegionName(geo);
                                    const uf = getUF(geo);
                                    const isSold = isStateView
                                        ? !!soldCities[`${name}_${selectedState}`]
                                        : false;
                                    const isHovered = hoveredRegion === (geo.rsmKey as string);
                                    const isHighlighted = isStateView && !!highlightedCity &&
                                        normalize(name) === normalize(highlightedCity);

                                    let fillColor: string;
                                    if (isHighlighted) fillColor = isHovered ? "#c9a84c" : "#b8963e";
                                    else if (isStateView) fillColor = isSold ? (isHovered ? "#c0392b" : "#e74c3c") : (isHovered ? "#2e7d5e" : "#3d9970");
                                    else {
                                        const isStateSold = soldStates[uf];
                                        fillColor = isStateSold
                                            ? (isHovered ? "#c0392b" : "#e74c3c")
                                            : (isHovered ? "#2e7d5e" : "#4a8c6f");
                                    }

                                    return (
                                        <Geography
                                            key={geo.rsmKey as string}
                                            geography={geo}
                                            onMouseEnter={(e: React.MouseEvent) => {
                                                setHoveredRegion(geo.rsmKey as string);
                                                if (isStateView) setTooltip({ name, sold: isSold, x: e.clientX, y: e.clientY });
                                            }}
                                            onMouseMove={(e: React.MouseEvent) => {
                                                if (tooltip) setTooltip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null);
                                            }}
                                            onMouseLeave={() => { setHoveredRegion(null); setTooltip(null); }}
                                            onClick={() => {
                                                if (isStateView) handleMunicipalityClick(name, selectedState!, isSold);
                                                else handleStateClick(uf);
                                            }}
                                            style={{
                                                default: {
                                                    fill: fillColor,
                                                    outline: "none",
                                                    stroke: isHighlighted ? "#8a6d20" : "#1a3a2a",
                                                    strokeWidth: isStateView ? 0.15 : 0.5,
                                                    cursor: isStateView ? (isSold ? "pointer" : "default") : "pointer",
                                                    transition: "fill 0.15s ease",
                                                    filter: isHighlighted ? "drop-shadow(0 0 5px rgba(184,150,62,0.9))" : "none",
                                                },
                                                hover: { fill: fillColor, outline: "none", stroke: "#0f2419", strokeWidth: isStateView ? 0.2 : 0.7, cursor: isStateView ? (isSold ? "pointer" : "default") : "pointer" },
                                                pressed: { fill: "#1a5c3a", outline: "none" },
                                            }}
                                        />
                                    );
                                })}

                                {!selectedState && geographies.map((geo) => {
                                    const centroid = geoCentroid(geo);
                                    const sigla = geo.properties.UF || geo.properties.SIGLA_UF || "";
                                    return (
                                        <Marker key={(geo.rsmKey as string) + "-label"} coordinates={centroid as [number, number]}>
                                            <text textAnchor="middle" dy="0.35em" style={{ fontSize: "7px", fill: "#f0ece4", pointerEvents: "none", fontWeight: "700", letterSpacing: "0.05em" }}>
                                                {sigla}
                                            </text>
                                        </Marker>
                                    );
                                })}

                                {isStateView && highlightedCity && geographies.map((geo) => {
                                    const name = getRegionName(geo);
                                    if (normalize(name) !== normalize(highlightedCity)) return null;
                                    const centroid = geoCentroid(geo);
                                    return (
                                        <Marker key="highlight-pin" coordinates={centroid as [number, number]}>
                                            <circle r={1} fill="#b8963e" stroke="#fff" strokeWidth={1.0} style={{ filter: "drop-shadow(0 0 3px rgba(184,150,62,0.8))" }} />
                                            <text textAnchor="middle" dy={-9}
                                                style={{ fontSize: "9px", fill: "#1c1409", fontWeight: "700", fontFamily: "'Playfair Display', serif", pointerEvents: "none", textShadow: "0 1px 3px rgba(245,240,232,0.95)" }}>
                                                {name}
                                            </text>
                                        </Marker>
                                    );
                                })}
                            </>
                        )}
                    </Geographies>
                </ComposableMap>
            </div>
        </div>
    );
}