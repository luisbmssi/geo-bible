"use client";

interface SidebarProps {
    currentState: string | null;
    totalCities: number;
    soldCount: number;
    availableCount: number;
}

export default function Sidebar({
    currentState,
    totalCities,
    soldCount,
    availableCount,
}: SidebarProps) {
    return (
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
                    ? (<>Brasil › <strong>{currentState.toUpperCase()}</strong></>)
                    : "Clique em um estado para explorar"}
            </p>
        </aside>
    );
}