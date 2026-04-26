"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import type { SoldCitiesMap, CityIndex, SoldCitiesDataMap, SoldCityData } from "../components/Map";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { parseCityField } from "@/lib/parseCity";
import MobileView from "../components/MobileView";
import Sidebar from "@/components/Sidebar";
import CertificateModal from "@/components/CertificateModal";

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
  const [soldCitiesData, setSoldCitiesData] = useState<SoldCitiesDataMap>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCityData, setSelectedCityData] = useState<SoldCityData | null>(null);
  const [sheetsLoaded, setSheetsLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/sheets")
      .then((r) => r.json())
      .then((response) => {
        const map: SoldCitiesMap = {};
        const dataMap: SoldCitiesDataMap = {};

        response.data.forEach((item: { city?: string; bible_id?: string; reference?: string; name?: string; date?: string }) => {
          if (!item.city) return;
          const parsed = parseCityField(item.city);
          if (!parsed) { console.warn(`⚠️ Formato inválido: "${item.city}"`); return; }

          const key = `${parsed.city}_${parsed.uf}`;
          map[key] = true;
          dataMap[key] = {
            city: parsed.city, uf: parsed.uf,
            bible_id: item.bible_id ?? "", reference: item.reference ?? "",
            name: item.name, date: item.date,
          };
        });

        setSoldCities(map);
        setSoldCitiesData(dataMap);
        setSheetsLoaded(true);
      })
      .catch((err) => {
        console.error("Erro ao buscar cidades:", err);
        setSheetsLoaded(true);
      });
  }, []);

  useEffect(() => {
    fetch("/cityIndex.json")
      .then((r) => r.json())
      .then(setCityIndex)
      .catch(() => console.warn("cityIndex.json não encontrado."));
  }, []);

  const soldCount = Object.values(soldCities).filter(Boolean).length;
  const availableCount = TOTAL_CITIES - soldCount;

  if (isMobile === null || !sheetsLoaded) {
    return (
      <div className="map-loading">
        <div className="loading-ornament">✦</div>
        <p>Carregando mapa…</p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <MobileView
        soldCities={soldCities}
        soldCitiesData={soldCitiesData}
        cityIndex={cityIndex}
        totalCities={TOTAL_CITIES}
      />
    );
  }

  return (
    <div className="page-shell">
      <Sidebar currentState={currentState} totalCities={TOTAL_CITIES} soldCount={soldCount} availableCount={availableCount} />
      <main className="map-area">
        <div className="map-inner">
          <MapChart
            soldCities={soldCities}
            soldCitiesData={soldCitiesData}
            cityIndex={cityIndex}
            onStateSelect={setCurrentState}
            onSoldCityClick={(data) => { setSelectedCityData(data); setModalOpen(true); }}
          />
        </div>
      </main>
      <CertificateModal isOpen={modalOpen} onClose={() => setModalOpen(false)} data={selectedCityData} />
    </div>
  );
}
