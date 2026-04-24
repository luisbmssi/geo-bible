"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import type { SoldCitiesMap, CityIndex } from "../components/Map";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import MobileView from "../components/MobileView";
import Sidebar from "@/components/Sidebar";

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

  if (isMobile === null) {
    return (
      <div className="map-loading">
        <div className="loading-ornament">✦</div>
        <p>Carregando…</p>
      </div>
    );
  }

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
      <Sidebar
        currentState={currentState}
        totalCities={TOTAL_CITIES}
        soldCount={soldCount}
        availableCount={availableCount}
      />
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