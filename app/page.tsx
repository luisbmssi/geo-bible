"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import type { SoldCitiesMap, CityIndex } from "../components/Map";

const MapChart = dynamic(() => import("../components/Map"), {
  ssr: false,
  loading: () => (
    <div className="map-loading">
      <div className="loading-ornament">✦</div>
      <p>Carregando mapa…</p>
    </div>
  ),
});

export default function Home() {
  const [currentState, setCurrentState] = useState<string | null>(null);
  const [cityIndex, setCityIndex] = useState<CityIndex>({});
  const [soldCities, setSoldCities] = useState<SoldCitiesMap>({});

  useEffect(() => {
    fetch("/api/sheets")
      .then((r) => r.json())
      .then((response) => {
        const map: SoldCitiesMap = {};

        response.data.forEach((item: any) => {
          if (item.city) {
            map[item.city] = true;
          }
        });

        setSoldCities(map);
      })
      .catch((err) => {
        console.error("Erro ao buscar cidades:", err);
      })
  }, []);

  useEffect(() => {
    fetch("/cityIndex.json")
      .then((r) => r.json())
      .then(setCityIndex)
      .catch(() =>
        console.warn(
          "cityIndex.json não encontrado. A busca não funcionará sem ele."
        )
      );
  }, []);

  const totalCities = 5570;
  const soldCount = Object.values(soldCities).filter(Boolean).length;
  const availableCount = totalCities - soldCount;

  return (
    <>

      <div className="page-shell">
        {/* ── Sidebar ── */}
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
              <span className="stat-number">{totalCities.toLocaleString("pt-BR")}</span>
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
              ? <>Brasil › <strong>{currentState.toUpperCase()}</strong></>
              : "Clique em um estado para explorar"}
          </p>
        </aside>

        {/* ── Área do mapa ── */}
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
    </>
  );
}