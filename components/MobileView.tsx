"use client";

import { useEffect, useRef, useState } from "react";
import type { SoldCitiesMap, CityIndex } from "./Map";

interface SearchResult {
    name: string;
    uf: string;
    sold: boolean;
}

interface MobileViewProps {
    soldCities: SoldCitiesMap;
    cityIndex: CityIndex;
    totalCities?: number;
}

function normalize(str: string): string {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

const UF_NAMES: Record<string, string> = {
    ac: "Acre", al: "Alagoas", am: "Amazonas", ap: "Amapá",
    ba: "Bahia", ce: "Ceará", df: "Distrito Federal", es: "Espírito Santo",
    go: "Goiás", ma: "Maranhão", mg: "Minas Gerais", ms: "Mato Grosso do Sul",
    mt: "Mato Grosso", pa: "Pará", pb: "Paraíba", pe: "Pernambuco",
    pi: "Piauí", pr: "Paraná", rj: "Rio de Janeiro", rn: "Rio Grande do Norte",
    ro: "Rondônia", rr: "Roraima", rs: "Rio Grande do Sul", sc: "Santa Catarina",
    se: "Sergipe", sp: "São Paulo", to: "Tocantins",
};

export default function MobileView({
    soldCities,
    cityIndex,
    totalCities = 5570,
}: MobileViewProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [selected, setSelected] = useState<SearchResult | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isSelectingRef = useRef(false);
    // Flag que impede o useEffect de busca de limpar o selected
    // quando a mudança no query veio de uma seleção (não de digitação)
    const justSelectedRef = useRef(false);

    const soldCount = Object.values(soldCities).filter(Boolean).length;
    const availableCount = totalCities - soldCount;

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node))
                if (!isSelectingRef.current) setShowSuggestions(false);
        }
        document.addEventListener("pointerdown", onClickOutside);
        return () => document.removeEventListener("pointerdown", onClickOutside);
    }, []);

    useEffect(() => {
        // Se a mudança no query veio do handleSelect, ignora e reseta a flag
        if (justSelectedRef.current) {
            justSelectedRef.current = false;
            return;
        }

        if (query.length < 2) {
            setResults([]);
            setShowSuggestions(false);
            setSelected(null);
            return;
        }

        const q = normalize(query);
        const found: SearchResult[] = [];

        for (const [name, ufs] of Object.entries(cityIndex)) {
            if (!normalize(name).includes(q)) continue;
            for (const uf of ufs) {
                found.push({ name, uf, sold: !!soldCities[name] });
                if (found.length >= 12) break;
            }
            if (found.length >= 12) break;
        }

        setResults(found);
        setShowSuggestions(found.length > 0);
        setSelected(null); // limpa só quando o usuário está digitando
    }, [query, cityIndex, soldCities]);

    const handleSelect = (r: SearchResult) => {
        justSelectedRef.current = true; // avisa o useEffect para não interferir
        const hasDuplicates = (cityIndex[r.name]?.length ?? 0) > 1;
        setQuery(hasDuplicates ? `${r.name} · ${r.uf.toUpperCase()}` : r.name);
        setSelected(r);
        setShowSuggestions(false);
    };

    const handleClear = () => {
        setQuery("");
        setSelected(null);
        setResults([]);
        inputRef.current?.focus();
    };

    return (
        <div className="mobile-shell">

            {/* ── Header ── */}
            <header className="mobile-header">
                <div className="mobile-ornament">— ✦ —</div>
                <h1 className="mobile-title">O Livro das Cidades</h1>
                <p className="mobile-subtitle">Edição Única · Brasil</p>
            </header>

            {/* ── Stats ── */}
            <div className="mobile-stats">
                <div className="mobile-stat-card">
                    <span className="mobile-stat-number">{totalCities.toLocaleString("pt-BR")}</span>
                    <span className="mobile-stat-label">Municípios</span>
                </div>
                <div className="mobile-stat-card highlight-green">
                    <span className="mobile-stat-number">{availableCount.toLocaleString("pt-BR")}</span>
                    <span className="mobile-stat-label">Disponíveis</span>
                </div>
                <div className="mobile-stat-card highlight-red">
                    <span className="mobile-stat-number">{soldCount}</span>
                    <span className="mobile-stat-label">Vendidos</span>
                </div>
            </div>

            {/* ── Descrição ── */}
            <p className="mobile-desc">
                Um exemplar manuscrito, único e intransferível, destinado a cada município
                do Brasil. Pesquise abaixo para ver se a sua cidade ainda está disponível.
            </p>

            {/* ── Busca ── */}
            <div className="mobile-search-wrap" ref={containerRef}>
                <div className="mobile-search-box">
                    <span className="mobile-search-icon">⌕</span>
                    <input
                        ref={inputRef}
                        type="text"
                        className="mobile-search-input"
                        placeholder="Digite o nome da sua cidade…"
                        value={query}
                        autoComplete="off"
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => results.length > 0 && setShowSuggestions(true)}
                        onBlur={() => {
                            if (!isSelectingRef.current) setShowSuggestions(false);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && results.length > 0) handleSelect(results[0]);
                            if (e.key === "Escape") setShowSuggestions(false);
                        }}
                    />
                    {query && (
                        <button className="mobile-search-clear" onClick={handleClear}>×</button>
                    )}
                </div>

                {showSuggestions && (
                    <ul className="mobile-suggestions">
                        {results.map((r, i) => {
                            const isDuplicate = (cityIndex[r.name]?.length ?? 0) > 1;
                            return (
                                <li
                                    key={`${r.name}-${r.uf}-${i}`}
                                    className="mobile-suggestion-item"
                                    onPointerDown={() => { isSelectingRef.current = true; }}
                                    onPointerUp={() => {
                                        handleSelect(r);
                                        isSelectingRef.current = false;
                                    }}
                                >
                                    <div className="mobile-suggestion-left">
                                        <span className="mobile-suggestion-name">{r.name}</span>
                                        {isDuplicate && (
                                            <span className="mobile-suggestion-state">
                                                {UF_NAMES[r.uf] ?? r.uf.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <span className={`mobile-suggestion-badge ${r.sold ? "sold" : "available"}`}>
                                        {r.sold ? "Vendido" : "Disponível"}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* ── Card de resultado selecionado ── */}
            {selected && (
                <div className={`mobile-result-card ${selected.sold ? "sold" : "available"}`}>
                    <div className="mobile-result-top">
                        <div>
                            <p className="mobile-result-city">{selected.name}</p>
                            <p className="mobile-result-state">
                                {UF_NAMES[selected.uf] ?? selected.uf.toUpperCase()}
                            </p>
                        </div>
                        <div className={`mobile-result-badge ${selected.sold ? "sold" : "available"}`}>
                            {selected.sold ? "Vendido" : "Disponível"}
                        </div>
                    </div>

                    <hr className="mobile-result-divider" />

                    <p className="mobile-result-message">
                        {selected.sold
                            ? "O exemplar destinado a esta cidade já foi adquirido. Esta cidade está para sempre inscrita na história deste livro."
                            : "O exemplar destinado a esta cidade ainda está disponível. Seja o guardião desta história."}
                    </p>
                </div>
            )}

            {/* ── Legenda ── */}
            <div className="mobile-legend">
                <div className="mobile-legend-item">
                    <div className="mobile-legend-dot available" />
                    <span>Disponível</span>
                </div>
                <div className="mobile-legend-item">
                    <div className="mobile-legend-dot sold" />
                    <span>Vendido</span>
                </div>
            </div>
        </div>
    );
}
