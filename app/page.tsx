"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import type { SoldCitiesMap, CityIndex } from "../components/Map";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import MobileView from "../components/MobileView";

const MapChart = dynamic(() => import("../components/Map"), {
  ssr: false,
  loading: () => (
    <div className="map-loading">
      <div className="loading-ornament">✦</div>
      <p>Carregando mapa…</p>
    </div>
  ),
});

const TOTAL_CITIES = 5570;

export default function Home() {
  const isMobile = useIsMobile();
  const [currentState, setCurrentState] = useState<string | null>(null);
  const [cityIndex, setCityIndex] = useState<CityIndex>({});
  const [soldCities, setSoldCities] = useState<SoldCitiesMap>({});

  // Fetch compartilhado — roda independente de mobile/desktop
  useEffect(() => {
    fetch("/api/sheets")
      .then((r) => r.json())
      .then((response) => {
        const map: SoldCitiesMap = {};
        response.data.forEach((item: { city?: string }) => {
          if (item.city) map[item.city] = true;
        });
        setSoldCities(map);
      })
      .catch((err) => console.error("Erro ao buscar cidades:", err));
  }, []);

  useEffect(() => {
    fetch("/cityIndex.json")
      .then((r) => r.json())
      .then(setCityIndex)
      .catch(() =>
        console.warn("cityIndex.json não encontrado. A busca não funcionará sem ele.")
      );
  }, []);

  const soldCount = Object.values(soldCities).filter(Boolean).length;
  const availableCount = TOTAL_CITIES - soldCount;

  // ── Mobile ──────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <MobileView
        soldCities={soldCities}
        cityIndex={cityIndex}
        totalCities={TOTAL_CITIES}
      />
    );
  }

  // ── Desktop ─────────────────────────────────────────────────────────────
  return (
    <div className="page-shell">
      <aside className="sidebar">
        <div className="sidebar-ornament">— ✦ —</div>
        <h1 className="sidebar-title">O Livro das Cidades</h1>
        <p className="sidebar-subtitle">Edição Única · Brasil</p>
        <hr className="sidebar-divider" />
        <p className="sidebar-desc">
          Um exemplar manuscrito, único e intransferível, destinado
          a cada município do Brasil. Quando vendido, aquela cidade
          está para sempre marcada na história deste livro.
        </p>

        <p className="legend-title">Legenda</p>
        <div className="legend-item">
          <div className="legend-dot available" />
          <span>Disponível</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot sold" />
          <span>Vendido</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot highlight" />
          <span>Município buscado</span>
        </div>

        <div className="stats-block">
          <div className="stat-row">
            <span>Municípios</span>
            <span className="stat-number">{TOTAL_CITIES.toLocaleString("pt-BR")}</span>
          </div>
          <div className="stat-row">
            <span>Disponíveis</span>
            <span className="stat-number">{availableCount.toLocaleString("pt-BR")}</span>
          </div>
          <div className="stat-row">
            <span>Vendidos</span>
            <span className="stat-number">{soldCount}</span>
          </div>
        </div>

        <p className="breadcrumb">
          {currentState
            ? (<>Brasil › <strong>{currentState.toUpperCase()}</strong></>)
            : "Clique em um estado para explorar"}
        </p>
      </aside>

      <main className="map-area">
        <div className="map-inner">
          <MapChart
            soldCities={soldCities}
            cityIndex={cityIndex}
            onStateSelect={setCurrentState}
          />
        </div>
      </main>
    </div>
  );
}