# Geo Bible

Mapa interativo do projeto **O Livro das Cidades** — cada município do Brasil recebe um exemplar manuscrito e único da Bíblia. Este site permite visualizar quais cidades já foram adquiridas e quais ainda estão disponíveis.

🌐 [mapa.oescribadabiblia.com.br](https://mapa.oescribadabiblia.com.br)

## Funcionalidades

- Mapa interativo do Brasil com navegação por estado e município
- Indicação visual de cidades disponíveis e vendidas
- Busca de municípios (desktop e mobile)
- Geração e download de certificado em PDF para cidades adquiridas
- Dados sincronizados com Google Sheets em tempo real
- Layout responsivo com experiência otimizada para mobile

## Tecnologias

- [Next.js 14](https://nextjs.org/) — framework React com App Router
- [react-simple-maps](https://www.react-simple-maps.io/) — renderização do mapa via SVG
- [d3-geo](https://github.com/d3/d3-geo) — projeções geográficas
- [googleapis](https://github.com/googleapis/google-api-nodejs-client) — integração com Google Sheets
- [jsPDF](https://github.com/parallax/jsPDF) — geração de certificados em PDF
- TypeScript + Tailwind CSS

## Configuração

### Pré-requisitos

- Node.js 18+
- Conta Google com acesso à API do Google Sheets

### Instalação

```bash
npm install
```

### Variáveis de ambiente

Crie um arquivo `.env.local` na raiz com as credenciais da API do Google:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=sua-conta@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=id_da_sua_planilha
```

### Formato esperado na planilha

| name       | city           | bible_id | reference   | date       |
| ---------- | -------------- | -------- | ----------- | ---------- |
| João Silva | São Paulo - SP | 123abc   | Gênesis 1:1 | 10/01/2026 |

O campo `city` deve seguir o formato `Nome da Cidade - UF`.

### Gerar o índice de cidades

O arquivo `public/cityIndex.json` é necessário para a busca funcionar. Para gerá-lo ou atualizá-lo:

```bash
npm run generate:city-index
```

### Rodar localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### Build para produção

```bash
npm run build
npm start
```

## Estrutura do projeto

```
geo-bible/
├── app/
│   ├── api/sheets/       # Endpoint que lê o Google Sheets
│   ├── hooks/            # useIsMobile
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Map.tsx           # Mapa interativo (desktop)
│   ├── MobileView.tsx    # Interface de busca (mobile)
│   ├── Sidebar.tsx       # Painel lateral
│   └── CertificateModal.tsx  # Modal e geração de PDF
├── lib/
│   ├── googleSheets.ts   # Integração com a API
│   ├── parseCity.ts      # Parser do campo "Cidade - UF"
│   └── generateCertificate.ts  # Geração do PDF
├── public/
│   ├── cityIndex.json    # Índice de municípios para busca
│   └── geojson/          # Dados geográficos dos estados e municípios
└── scripts/
    └── buildCityIndex.ts # Script para gerar o cityIndex.json
```
