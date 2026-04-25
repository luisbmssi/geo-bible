import fs from "fs";
import path from "path";

const ufs = [
    "ac", "al", "am", "ap", "ba", "ce", "df", "es", "go", "ma", "mg", "ms",
    "mt", "pa", "pb", "pe", "pi", "pr", "rj", "rn", "ro", "rr", "rs", "sc",
    "se", "sp", "to",
];

const index: Record<string, string[]> = {};

for (const uf of ufs) {
    const filePath = path.resolve(`public/geojson/municipalities/${uf}.json`);

    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  Arquivo não encontrado, pulando: ${filePath}`);
        continue;
    }

    const geo = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    for (const f of geo.features) {
        const name: string | undefined = f.properties.NM_MUN || f.properties.name;
        if (!name) continue;

        if (!index[name]) {
            index[name] = [uf];
        } else if (!index[name].includes(uf)) {
            index[name].push(uf);
        }
    }
}

// Relatório de duplicatas para conferência
const duplicates = Object.entries(index).filter(([, ufs]) => ufs.length > 1);
if (duplicates.length > 0) {
    console.log(`\n📋 Municípios com nomes duplicados entre estados (${duplicates.length}):`);
    for (const [name, ufs] of duplicates) {
        console.log(`   "${name}" → ${ufs.join(", ").toUpperCase()}`);
    }
}

const outputPath = path.resolve("public/cityIndex.json");
fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));
console.log(`\n✅ cityIndex.json gerado em: ${outputPath}`);
console.log(`   Total de municípios: ${Object.keys(index).length}`);
console.log(`   Com nomes duplicados: ${duplicates.length}\n`);

const rows: string[] = [];

for (const [name, ufs] of Object.entries(index)) {
    for (const uf of ufs) {
        rows.push(`${name} - ${uf.toUpperCase()}`);
    }
}

rows.sort();
fs.writeFileSync("municipios.csv", rows.join("\n"));
console.log(`✅ municipios.csv gerado com ${rows.length} entradas`);