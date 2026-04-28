"use client";

import { useState } from "react";
import { generateCertificatePDF } from "@/lib/generateCertificate";

export interface CertificateData {
    city: string;
    uf: string;
    bible_id: string;
    reference: string;
    name?: string;
    date?: string;
}

interface CertificateModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: CertificateData | null;
}

export default function CertificateModal({ isOpen, onClose, data }: CertificateModalProps) {
    const [generating, setGenerating] = useState(false);

    if (!isOpen) return null;

    const handleDownload = async () => {
        if (!data) return;
        setGenerating(true);
        try {
            await generateCertificatePDF(data);
            onClose();
        }
        finally { setGenerating(false); }
    };

    return (
        <div className="certificate-overlay" onClick={onClose}>
            <div className="certificate-modal" onClick={(e) => e.stopPropagation()}>

                <span className="cert-corner cert-corner--tl">✦</span>
                <span className="cert-corner cert-corner--tr">✦</span>
                <span className="cert-corner cert-corner--bl">✦</span>
                <span className="cert-corner cert-corner--br">✦</span>

                <div className="cert-header">
                    <p className="cert-site">O Escriba da Bíblia</p>
                    <h2 className="cert-title">Município Adotado</h2>
                    <div className="cert-divider">
                        <span className="cert-divider__line" />
                        <span className="cert-divider__ornament">✦</span>
                        <span className="cert-divider__line" />
                    </div>
                </div>

                <div className="cert-body">
                    {!data ? (
                        <p className="cert-empty">Nenhuma informação encontrada para este município.</p>
                    ) : (
                        <>
                            <p className="cert-intro">
                                Este município foi especialmente adotado no Projeto O Escriba da Bíblia,
                                contemplado com uma passagem das Sagradas Escrituras.
                            </p>
                            <div className="cert-fields">
                                {[
                                    { label: "Cidade", value: `${data.city} — ${data.uf.toUpperCase()}` },
                                    { label: "Bíblia nº", value: data.bible_id },
                                    { label: "Versículo", value: data.reference },
                                    { label: "Data", value: data.date ?? "—" },
                                ].map(({ label, value }) => (
                                    <div key={label} className="cert-field">
                                        <span className="cert-field__label">{label}</span>
                                        <span className="cert-field__value">{value}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="cert-verse"><em>"{data.reference}"</em></p>
                        </>
                    )}
                </div>

                <div className="cert-actions">
                    <button className="cert-btn cert-btn--secondary" onClick={onClose}>Fechar</button>
                    {data && (
                        <button className="cert-btn cert-btn--primary" onClick={handleDownload} disabled={generating}>
                            {generating ? "Gerando…" : "⬇ Baixar Certificado"}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
