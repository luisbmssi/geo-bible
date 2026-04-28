"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface CertificateRecord {
    name: string;
    city: string;
    bible_id: string;
    reference: string;
    date?: string;
}

type Status = "loading" | "found" | "not_found" | "error";

function VerificarContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    const [status, setStatus] = useState<Status>("loading");
    const [record, setRecord] = useState<CertificateRecord | null>(null);

    useEffect(() => {
        if (!id) {
            setStatus("not_found");
            return;
        }

        async function verify() {
            try {
                const res = await fetch("/api/sheets");
                if (!res.ok) throw new Error("Erro ao buscar dados");
                const json = await res.json();

                const rows: CertificateRecord[] = json.data ?? [];
                const match = rows.find((row) => row.bible_id === id);

                if (match) {
                    setRecord(match);
                    setStatus("found");
                } else {
                    setStatus("not_found");
                }
            } catch {
                setStatus("error");
            }
        }

        verify();
    }, [id]);

    return (
        <main style={styles.page}>
            <div style={styles.card}>
                {/* Cabeçalho */}
                <div style={styles.header}>
                    <p style={styles.siteLabel}>O Escriba da Bíblia</p>
                    <h1 style={styles.title}>Verificação de Certificado</h1>
                    <div style={styles.divider} />
                </div>

                {/* Conteúdo por status */}
                {status === "loading" && (
                    <div style={styles.body}>
                        <div style={styles.spinner} />
                        <p style={styles.message}>Verificando autenticidade…</p>
                    </div>
                )}

                {status === "found" && record && (
                    <div style={styles.body}>
                        <div style={styles.badge}>
                            <span style={styles.badgeIcon}>✓</span>
                            <span style={styles.badgeText}>Certificado Autêntico</span>
                        </div>
                        <p style={styles.intro}>
                            Este certificado foi emitido pelo Projeto O Escriba da Bíblia e seus dados
                            constam em nosso registro oficial.
                        </p>
                        <div style={styles.fields}>
                            {[
                                ["Município", record.city],
                                ["Bíblia nº", record.bible_id],
                                ["Versículo", record.reference],
                                ...(record.date ? [["Data", record.date]] : []),
                            ].map(([label, value]) => (
                                <div key={label} style={styles.field}>
                                    <span style={styles.fieldLabel}>{label}</span>
                                    <span style={styles.fieldValue}>{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {status === "not_found" && (
                    <div style={styles.body}>
                        <div style={{ ...styles.badge, ...styles.badgeInvalid }}>
                            <span style={styles.badgeIcon}>✗</span>
                            <span style={styles.badgeText}>Certificado não encontrado</span>
                        </div>
                        <p style={styles.message}>
                            Não encontramos nenhum registro com o ID{" "}
                            <strong>{id ?? "informado"}</strong>. Verifique se o QR code foi
                            escaneado corretamente ou entre em contato pelo site.
                        </p>
                    </div>
                )}

                {status === "error" && (
                    <div style={styles.body}>
                        <p style={styles.message}>
                            Ocorreu um erro ao consultar nosso banco de dados. Tente novamente
                            em instantes.
                        </p>
                    </div>
                )}

                {/* Rodapé */}
                <div style={styles.footer}>
                    <p style={styles.footerText}>oescribadabiblia.com.br</p>
                </div>
            </div>
        </main>
    );
}

export default function VerificarPage() {
    return (
        <Suspense fallback={
            <main style={styles.page}>
                <div style={styles.card}>
                    <div style={styles.body}>
                        <div style={styles.spinner} />
                        <p style={styles.message}>Carregando…</p>
                    </div>
                </div>
            </main>
        }>
            <VerificarContent />
        </Suspense>
    );
}

// ── Estilos inline (sem dependência de CSS externo) ───────────────────────────
const gold = "#7a551e";
const lightGold = "#c8922a";
const parchment = "#fef9ed";
const darkBrown = "#3c2305";

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f7f2e6 0%, #ede4cc 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        fontFamily: "Georgia, 'Times New Roman', serif",
    },
    card: {
        background: parchment,
        border: `2px solid ${gold}`,
        borderRadius: "12px",
        boxShadow: `0 4px 24px rgba(120,85,30,0.18)`,
        maxWidth: "480px",
        width: "100%",
        overflow: "hidden",
    },
    header: {
        background: `linear-gradient(180deg, #f0e6c8 0%, ${parchment} 100%)`,
        borderBottom: `1px solid ${lightGold}`,
        padding: "2rem 2rem 1.2rem",
        textAlign: "center",
    },
    siteLabel: {
        fontSize: "0.75rem",
        letterSpacing: "0.15em",
        color: lightGold,
        textTransform: "uppercase",
        margin: "0 0 0.4rem",
    },
    title: {
        fontSize: "1.4rem",
        color: darkBrown,
        margin: "0 0 1rem",
        fontWeight: "bold",
        fontStyle: "italic",
    },
    divider: {
        height: "2px",
        background: `linear-gradient(90deg, transparent, ${lightGold}, transparent)`,
    },
    body: {
        padding: "1.8rem 2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        alignItems: "center",
    },
    badge: {
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        background: "#e8f5e9",
        border: "1.5px solid #4caf50",
        borderRadius: "999px",
        padding: "0.4rem 1.2rem",
        color: "#2e7d32",
        fontWeight: "bold",
        fontSize: "0.95rem",
    },
    badgeInvalid: {
        background: "#fdecea",
        border: "1.5px solid #e53935",
        color: "#c62828",
    },
    badgeIcon: {
        fontSize: "1rem",
        fontWeight: "900",
    },
    badgeText: {
        fontSize: "0.9rem",
    },
    intro: {
        fontSize: "0.9rem",
        color: "#5a3a0a",
        textAlign: "center",
        lineHeight: 1.6,
        margin: 0,
    },
    message: {
        fontSize: "0.9rem",
        color: "#5a3a0a",
        textAlign: "center",
        lineHeight: 1.6,
        margin: 0,
    },
    fields: {
        width: "100%",
        border: `1px solid ${lightGold}`,
        borderRadius: "8px",
        overflow: "hidden",
        background: "#fff9ec",
    },
    field: {
        display: "flex",
        borderBottom: `1px solid #e8d9a0`,
        padding: "0.6rem 1rem",
        gap: "0.5rem",
    },
    fieldLabel: {
        fontWeight: "bold",
        color: gold,
        fontSize: "0.82rem",
        minWidth: "90px",
        flexShrink: 0,
    },
    fieldValue: {
        color: darkBrown,
        fontSize: "0.88rem",
        wordBreak: "break-word",
    },
    footer: {
        borderTop: `1px solid ${lightGold}`,
        background: "#f0e6c8",
        padding: "1rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    footerLink: {
        color: gold,
        fontSize: "0.8rem",
        textDecoration: "none",
        fontStyle: "italic",
    },
    footerText: {
        color: lightGold,
        fontSize: "0.75rem",
        margin: 0,
    },
    spinner: {
        width: "32px",
        height: "32px",
        border: `3px solid #e8d9a0`,
        borderTop: `3px solid ${gold}`,
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
    },
};