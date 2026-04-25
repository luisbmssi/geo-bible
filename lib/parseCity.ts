export function parseCityField(value: string): { city: string; uf: string } | null {
    // espera formato "Nome da Cidade - UF"
    const match = value.match(/^(.+?)\s*-\s*([A-Z]{2})$/);
    if (!match) return null;

    return {
        city: match[1].trim(),
        uf: match[2].toLowerCase(),
    };
}