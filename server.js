import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import YahooFinanceLib from "yahoo-finance2";
import { EMA, RSI, MACD, BollingerBands, ATR, OBV } from "technicalindicators";

const yf = new YahooFinanceLib({ suppressNotices: ["ripHistorical"] });
const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(join(__dirname, "public")));

// ─── Stock Universes ──────────────────────────────────────────────────────────

const NIFTY50 = [
  "RELIANCE","TCS","HDFCBANK","INFY","ICICIBANK","HINDUNILVR","ITC","SBIN",
  "BAJFINANCE","BHARTIARTL","KOTAKBANK","LT","AXISBANK","ASIANPAINT","MARUTI",
  "SUNPHARMA","TITAN","ULTRACEMCO","WIPRO","NTPC","POWERGRID","NESTLEIND","M&M",
  "TECHM","HCLTECH","INDUSINDBK","ADANIENT","ADANIPORTS","JSWSTEEL","TATAMOTORS",
  "TATACONSUM","TATASTEEL","ONGC","COALINDIA","BAJAJFINSV","BAJAJ-AUTO","EICHERMOT",
  "HEROMOTOCO","APOLLOHOSP","CIPLA","DRREDDY","DIVISLAB","BRITANNIA","SBILIFE",
  "HDFCLIFE","HINDALCO","VEDL","GRASIM","BPCL","IOC"
];

const NIFTY_NEXT50 = [
  "ABB","AMBUJACEM","DMART","BANKBARODA","BERGEPAINT","BOSCHLTD","CANBK",
  "CHOLAFIN","COLPAL","DLF","GODREJCP","GODREJPROP","HAL","HAVELLS","ICICIPRULI",
  "INDHOTEL","INDUSTOWER","IRCTC","JUBLFOOD","LTIM","LUPIN","MCDOWELL-N",
  "MUTHOOTFIN","OFSS","PAGEIND","PIDILITIND","SBICARD","SHRIRAMFIN","SIEMENS",
  "TORNTPHARM","TRENT","UBL","ZYDUSLIFE","PERSISTENT","COFORGE","MPHASIS",
  "FEDERALBNK","UNIONBANK","PNBHOUSING","BHEL","CGPOWER","CUMMINSIND","DEEPAKNTR",
  "IDFCFIRSTB","MRF","POLYCAB","MARICO","PIIND","VOLTAS","NAUKRI"
];

const NIFTY_MIDCAP = [
  "ZOMATO","NYKAA","POLICYBZR","DELHIVERY","HAPPSTMNDS","LTTS","KPITTECH",
  "TATATECH","TATACHEM","ABCAPITAL","MOTHERSON","BALKRISIND","THERMAX","ASTRAL",
  "DIXON","KALYANKJIL","SUNTV","WHIRLPOOL","TIINDIA","KAYNES","SYRMA",
  "IRFC","RVNL","BEL","RAILVIKAS","HUDCO","RECLTD","PFC","NHPC",
  "JPPOWER","SJVN","GRSE","MAZDOCK","COCHINSHIP","GARFIBRES","JYOTICNC",
  "ELECON","PRAJ","GMRINFRA","ADANIGREEN","ADANIPOWER","TATAPOWER","TORNTPOWER",
  "CESC","RPOWER","ZEEL","NETWORK18","TV18BRDCST","ASTER","FORTIS"
];

const MULTIBAGGER = [
  "HAL","BEL","BHEL","IRFC","RVNL","IRCTC","RECLTD","PFC","NHPC","SJVN",
  "DIXON","KAYNES","SYRMA","PGEL","AMBER","IDEAFORGE",
  "KPITTECH","TATATECH","LTTS","TIINDIA","MOTHERSON",
  "ZOMATO","TRENT","DMART","NYKAA","POLICYBZR",
  "THERMAX","CUMMINSIND","CGPOWER","SIEMENS","ABB","POLYCAB","KEI",
  "APOLLOHOSP","FORTIS","ASTER","ZYDUSLIFE","TORNTPHARM","DIVISLAB",
  "PERSISTENT","COFORGE","HAPPSTMNDS","LTIM","MPHASIS",
  "CHOLAFIN","MUTHOOTFIN","SHRIRAMFIN","ABCAPITAL","SBICARD",
  "DEEPAKNTR","PIIND","TATACHEM","PRAJ"
];

// Small/mid-cap stocks typically in ₹50–150 range — scanned with dynamic price filter
const SMALL_CAP_UNIVERSE = [
  // PSU Power & Infrastructure
  "NHPC","SJVN","HUDCO","IREDA","NBCC","GMRINFRA","JPPOWER","RPOWER","CESC",
  "HGINFRA","IRCON","RITES","RAILTEL","PSPPROJECT","NCC","KPTL",
  // Telecom & IT
  "HFCL","MTNL","ITI","TANLA","ROUTE","NAZARA","DATAMATICS","MASTEK","XCHANGING","ZENSAR",
  // Finance / NBFC
  "UJJIVAN","EQUITAS","CREDITACC","UJJIVANSFB","JMFINANCIL","SHRIRAMFIN",
  "MANAPPURAM","IIFL","ABFL","SPANDANA","FUSION","AROHA",
  // Banking (PSU & small)
  "PNB","UNIONBANK","CENTRALBANK","IOB","UCOBANK","BANKOFMAHARASHTRA","BANDHANBNK",
  // Textile & Paper
  "TRIDENT","JKPAPER","KRBL","KPRMILL","VARDHMAN","NIITLTD","GARFIBRES",
  // Chemicals & Specialty
  "NOCIL","SUDARSCHEM","GMDCLTD","GPIL","ORIENTELEC","DEEPAKNTR",
  // Pharma small-cap
  "GRANULES","JUBLPHARMA","CAPLIPOINT","NATCOPHARM","SOLARA","LAURUSLABS",
  // Real Estate
  "ANANTRAJ","MANINFRA","SUNTECK","ARIHANTCAP","KOLTEPATIL",
  // Auto Ancillaries
  "SUPRAJIT","SHARDAMOTR","MINDA","SANDHAR","CRAFTSMAN",
  // Media
  "NETWORK18","TV18BRDCST","ZEEL","SUNTV","HINDMOTORS",
  // Consumer & Retail
  "SPENCERS","VSTIND","RADICO","GLOBUSSPR",
  // Cement small-cap
  "HEIDELBERG","JKLAKSHMI","SAGCEM","MANGCEMNT",
  // Misc industrial
  "PRAJ","ELGIEQUIP","WPIL","JYOTICNC","ELECON","TEXRAIL",
  // Energy & Green
  "ADANIGREEN","SJVN","INOXWIND","SUZLON","WINDMACHIN",
  // Micro-cap gems
  "OPTOCIRCUI","HBLPOWER","JSWENERGY","NAVA","CAPACITE"
];

// Broad combined list scanned for EMA crossover signal
const CROSSOVER_UNIVERSE = [...new Set([
  ...NIFTY50, ...NIFTY_NEXT50, ...NIFTY_MIDCAP, ...MULTIBAGGER, ...SMALL_CAP_UNIVERSE
])];

const UNIVERSES = {
  nifty50:     { label: "Nifty 50",    stocks: NIFTY50 },
  nifty100:    { label: "Nifty 100",   stocks: [...new Set([...NIFTY50, ...NIFTY_NEXT50])] },
  nifty200:    { label: "Nifty 200",   stocks: [...new Set([...NIFTY50, ...NIFTY_NEXT50, ...NIFTY_MIDCAP])] },
  multibagger: { label: "Multibagger", stocks: [...new Set(MULTIBAGGER)] },
  breakout:    { label: "Breakout Picks (₹50–100)", stocks: [...new Set(SMALL_CAP_UNIVERSE)], priceMin: 50, priceMax: 100 },
  crossover:   { label: "EMA 9×21 Fresh Crossover", stocks: CROSSOVER_UNIVERSE }
};

// ─── Global Indices + Market Indicators ──────────────────────────────────────

const GLOBAL_INDICES = [
  // Indian indices (live)
  { symbol: "^NSEI",    name: "Nifty 50",      region: "India",   flag: "🇮🇳", group: "india" },
  { symbol: "^BSESN",   name: "SENSEX",         region: "India",   flag: "🇮🇳", group: "india" },
  { symbol: "^INDIAVIX",name: "India VIX",      region: "India",   flag: "🇮🇳", group: "india" },
  // Note: GIFT Nifty futures are not reliably available via Yahoo Finance free API.
  // The closest proxy is ^NSEI (Nifty 50 spot) or Nifty futures via broker feeds.

  // US markets
  { symbol: "^GSPC",    name: "S&P 500",        region: "US",      flag: "🇺🇸", group: "global" },
  { symbol: "^DJI",     name: "Dow Jones",       region: "US",      flag: "🇺🇸", group: "global" },
  { symbol: "^IXIC",    name: "NASDAQ",          region: "US",      flag: "🇺🇸", group: "global" },

  // Asian markets
  { symbol: "^N225",    name: "Nikkei 225",      region: "Japan",   flag: "🇯🇵", group: "global" },
  { symbol: "^HSI",     name: "Hang Seng",       region: "HK",      flag: "🇭🇰", group: "global" },

  // European markets
  { symbol: "^FTSE",    name: "FTSE 100",        region: "UK",      flag: "🇬🇧", group: "global" },
  { symbol: "^GDAXI",   name: "DAX",             region: "Germany", flag: "🇩🇪", group: "global" },

  // Commodities & Currency (key FII triggers for India)
  { symbol: "BZ=F",     name: "Brent Crude",     region: "Commodity",flag: "🛢️", group: "macro" },
  { symbol: "GC=F",     name: "Gold",            region: "Commodity",flag: "🥇", group: "macro" },
  { symbol: "USDINR=X", name: "USD/INR",         region: "Currency", flag: "💱", group: "macro" },
  { symbol: "DX-Y.NYB", name: "Dollar Index",    region: "Currency", flag: "💵", group: "macro" },
];

// Correlation of each with Nifty 50 (positive = same direction, negative = inverse)
const NIFTY_CORRELATION = {
  "^GSPC":    0.72,   // S&P 500 — strong positive (FII follow US)
  "^DJI":     0.68,   // Dow — strong positive
  "^IXIC":    0.65,   // NASDAQ — strong positive (tech-heavy)
  "^N225":    0.55,   // Nikkei — moderate positive
  "^HSI":     0.60,   // Hang Seng — moderate positive
  "^FTSE":    0.45,   // FTSE — moderate
  "^GDAXI":   0.50,   // DAX — moderate
  "^NSEI":    1.00,
  "^BSESN":   0.99,
  "^INDIAVIX":-0.85,  // VIX inverse — higher VIX = lower Nifty
  "BZ=F":    -0.30,   // Crude inverse — rising oil = input cost pressure
  "GC=F":    -0.20,   // Gold mild inverse — safe haven vs equity
  "USDINR=X": -0.55,  // USD/INR inverse — stronger dollar = FII outflows
  "DX-Y.NYB":-0.50,   // Dollar Index inverse — strong USD = EM outflows
};

// ─── Sector → Stock mapping ───────────────────────────────────────────────────

const STOCK_SECTORS = {
  // IT / Software
  TCS:"IT", INFY:"IT", WIPRO:"IT", HCLTECH:"IT", TECHM:"IT",
  LTIM:"IT", PERSISTENT:"IT", COFORGE:"IT", MPHASIS:"IT", HAPPSTMNDS:"IT",
  LTTS:"IT", KPITTECH:"IT", TATATECH:"IT", NAUKRI:"IT", OFSS:"IT",
  // Banking
  HDFCBANK:"Banking", ICICIBANK:"Banking", KOTAKBANK:"Banking", AXISBANK:"Banking",
  SBIN:"Banking", INDUSINDBK:"Banking", BANKBARODA:"Banking", CANBK:"Banking",
  FEDERALBNK:"Banking", UNIONBANK:"Banking", IDFCFIRSTB:"Banking",
  // NBFC & Insurance
  BAJFINANCE:"NBFC", BAJAJFINSV:"NBFC", SHRIRAMFIN:"NBFC", CHOLAFIN:"NBFC",
  MUTHOOTFIN:"NBFC", ABCAPITAL:"NBFC", SBICARD:"NBFC", PNBHOUSING:"NBFC",
  SBILIFE:"Insurance", HDFCLIFE:"Insurance", ICICIPRULI:"Insurance",
  // Oil & Gas
  RELIANCE:"Oil & Gas", ONGC:"Oil & Gas", BPCL:"Oil & Gas", IOC:"Oil & Gas",
  // Metals & Mining
  TATASTEEL:"Metals", JSWSTEEL:"Metals", HINDALCO:"Metals",
  COALINDIA:"Metals", VEDL:"Metals", NMDC:"Metals",
  // Pharma
  SUNPHARMA:"Pharma", DRREDDY:"Pharma", CIPLA:"Pharma", DIVISLAB:"Pharma",
  LUPIN:"Pharma", TORNTPHARM:"Pharma", ZYDUSLIFE:"Pharma", AUROPHARMA:"Pharma",
  // Auto & Components
  TATAMOTORS:"Auto", "M&M":"Auto", MARUTI:"Auto", "BAJAJ-AUTO":"Auto",
  HEROMOTOCO:"Auto", EICHERMOT:"Auto", MOTHERSON:"Auto", MRF:"Auto",
  BALKRISIND:"Auto", BOSCHLTD:"Auto", TIINDIA:"Auto",
  // FMCG
  HINDUNILVR:"FMCG", ITC:"FMCG", NESTLEIND:"FMCG", BRITANNIA:"FMCG",
  DABUR:"FMCG", MARICO:"FMCG", COLPAL:"FMCG", GODREJCP:"FMCG",
  "MCDOWELL-N":"FMCG", UBL:"FMCG", TATACONSUM:"FMCG",
  // Cement
  ULTRACEMCO:"Cement", GRASIM:"Cement", SHREECEM:"Cement", AMBUJACEM:"Cement",
  // Infra & Capital Goods
  LT:"Infra", ADANIENT:"Infra", ADANIPORTS:"Infra", RVNL:"Infra",
  RAILVIKAS:"Infra", GMRINFRA:"Infra",
  SIEMENS:"Capital Goods", ABB:"Capital Goods", CGPOWER:"Capital Goods",
  HAVELLS:"Capital Goods", POLYCAB:"Capital Goods", CUMMINSIND:"Capital Goods",
  BHEL:"Capital Goods", THERMAX:"Capital Goods", ELECON:"Capital Goods",
  JYOTICNC:"Capital Goods",
  // Power & Energy
  NTPC:"Power", POWERGRID:"Power", TATAPOWER:"Power", ADANIGREEN:"Power",
  ADANIPOWER:"Power", TORNTPOWER:"Power", CESC:"Power", NHPC:"Power",
  SJVN:"Power", JPPOWER:"Power", RECLTD:"Power", PFC:"Power",
  IRFC:"Power", HUDCO:"Power",
  // Defence
  HAL:"Defence", BEL:"Defence", GRSE:"Defence", MAZDOCK:"Defence",
  COCHINSHIP:"Defence",
  // Telecom
  BHARTIARTL:"Telecom", INDUSTOWER:"Telecom",
  // Jewellery
  TITAN:"Jewellery", KALYANKJIL:"Jewellery",
  // Electronics / Manufacturing
  DIXON:"Electronics", KAYNES:"Electronics", SYRMA:"Electronics",
  AMBER:"Electronics", PGEL:"Electronics", IDEAFORGE:"Electronics",
  // Chemicals
  DEEPAKNTR:"Chemicals", PIIND:"Chemicals", TATACHEM:"Chemicals", PRAJ:"Chemicals",
  // Healthcare Services
  APOLLOHOSP:"Healthcare", FORTIS:"Healthcare", ASTER:"Healthcare",
  // Real Estate
  DLF:"Real Estate", GODREJPROP:"Real Estate",
  // Paint
  ASIANPAINT:"Paint", BERGEPAINT:"Paint", PIDILITIND:"Paint",
  // Retail / Consumer
  TRENT:"Retail", DMART:"Retail", NYKAA:"Retail",
  PAGEIND:"Textile",
  // Food & Hospitality
  ZOMATO:"Food Tech", JUBLFOOD:"Food", INDHOTEL:"Hospitality", IRCTC:"Travel",
  // Fintech
  POLICYBZR:"Fintech", JIOFINANCIAL:"Fintech",
  // Diversified
  TATACHEM:"Chemicals",
};

// Sector → which global indices to watch, with impact direction and reason
const SECTOR_GLOBAL_DEPS = {
  "IT": {
    color: "#818cf8",
    deps: [
      { symbol:"^IXIC",    dir:"↑ positive", reason:"NASDAQ tech sentiment drives IT sector multiples globally" },
      { symbol:"^GSPC",    dir:"↑ positive", reason:"S&P 500 health reflects US corporate IT budget cycles" },
      { symbol:"USDINR=X", dir:"↑ good",     reason:"IT earns in USD — stronger USD = more INR revenue per dollar (opposite of most sectors)" },
    ],
    note:"IT is export-driven. Rising USD/INR is BULLISH for IT (more rupees per dollar earned)."
  },
  "Banking": {
    color: "#34d399",
    deps: [
      { symbol:"^GSPC",    dir:"↑ positive", reason:"US rally → FII inflows into Indian banking stocks" },
      { symbol:"DX-Y.NYB", dir:"↑ negative", reason:"Strong Dollar = FII outflows from EM banking" },
      { symbol:"^INDIAVIX",dir:"↑ negative", reason:"High VIX = fear = risk-off sell banking" },
      { symbol:"USDINR=X", dir:"↑ negative", reason:"Rupee weakness signals FII exit pressure" },
    ],
    note:"Banking is the most FII-sensitive sector. Dollar strength and US market moves are primary triggers."
  },
  "NBFC": {
    color: "#34d399",
    deps: [
      { symbol:"^GSPC",    dir:"↑ positive", reason:"US market drives FII sentiment for financials broadly" },
      { symbol:"DX-Y.NYB", dir:"↑ negative", reason:"Strong Dollar = EM financial sector outflows" },
      { symbol:"^INDIAVIX",dir:"↑ negative", reason:"High VIX = risk-off = sell high-beta NBFC" },
    ],
    note:"NBFCs track banking but are more domestic-credit sensitive. RBI rate decisions matter more than global indices."
  },
  "Insurance": {
    color: "#34d399",
    deps: [
      { symbol:"^GSPC",    dir:"↑ positive", reason:"US markets drive FII allocation to financial sector ETFs" },
      { symbol:"^INDIAVIX",dir:"↑ negative", reason:"Elevated volatility → risk-off from insurance stocks" },
    ],
    note:"Defensive financial sector. Largely insulated from global indices — driven by domestic premium growth."
  },
  "Oil & Gas": {
    color: "#fb923c",
    deps: [
      { symbol:"BZ=F",     dir:"↑ mixed",    reason:"Brent up = good for ONGC (upstream), bad for BPCL/IOC (marketing margin squeeze)" },
      { symbol:"USDINR=X", dir:"↑ negative", reason:"Oil priced in USD — weaker rupee means costlier crude imports" },
      { symbol:"DX-Y.NYB", dir:"↑ negative", reason:"Dollar Index up = oil more expensive in INR terms" },
    ],
    note:"Watch ONGC vs BPCL separately. ONGC gains on rising crude; BPCL/IOC suffer unless GoI allows price hikes."
  },
  "Metals": {
    color: "#94a3b8",
    deps: [
      { symbol:"^HSI",     dir:"↑ positive", reason:"China is #1 steel/metal consumer — Hang Seng = China demand proxy" },
      { symbol:"GC=F",     dir:"↑ positive", reason:"Gold prices directly drive Hindalco's gold/copper segment" },
      { symbol:"BZ=F",     dir:"↑ negative", reason:"Rising crude = higher energy cost for smelting operations" },
      { symbol:"DX-Y.NYB", dir:"↑ negative", reason:"Metals priced in USD — strong Dollar weakens commodity prices" },
    ],
    note:"China demand is the single biggest driver. Watch Chinese PMI and Hang Seng for early metal price signals."
  },
  "Pharma": {
    color: "#f472b6",
    deps: [
      { symbol:"^IXIC",    dir:"↑ positive", reason:"NASDAQ health → US FDA approvals sentiment, biotech confidence" },
      { symbol:"^GSPC",    dir:"↑ positive", reason:"US market → generic drug demand (India exports 30%+ to US)" },
      { symbol:"USDINR=X", dir:"↑ good",     reason:"Like IT, pharma exports to US — stronger USD = more INR revenue" },
    ],
    note:"Pharma is export-driven like IT. USD/INR rising is BULLISH. USFDA approval pipeline is the key domestic driver."
  },
  "Auto": {
    color: "#facc15",
    deps: [
      { symbol:"BZ=F",     dir:"↑ negative", reason:"Rising crude = high fuel cost = lower vehicle sales demand" },
      { symbol:"^N225",    dir:"↑ positive", reason:"Nikkei reflects Japan auto trends — tech/EV transfer partnerships" },
      { symbol:"^HSI",     dir:"↑ positive", reason:"China EV growth sets competitive benchmark; HK = China proxy" },
      { symbol:"USDINR=X", dir:"↑ negative", reason:"Auto components often imported — weaker rupee raises BOM cost" },
    ],
    note:"Crude oil is the single biggest trigger. EV transition making Nikkei/China indices increasingly relevant."
  },
  "FMCG": {
    color: "#a78bfa",
    deps: [
      { symbol:"BZ=F",     dir:"↑ negative", reason:"Crude → palm oil, plastic packaging, logistics costs" },
      { symbol:"USDINR=X", dir:"↑ negative", reason:"Palm oil, soya, cocoa largely imported and priced in USD" },
    ],
    note:"FMCG is defensive — outperforms when markets fall. Rural demand (monsoon/MSP) matters more than global indices."
  },
  "Cement": {
    color: "#78716c",
    deps: [
      { symbol:"BZ=F",     dir:"↑ negative", reason:"Pet coke and diesel are key fuels for cement kilns" },
      { symbol:"^HSI",     dir:"↑ positive", reason:"China real estate cycle affects global limestone/clinker costs" },
    ],
    note:"Most domestic of all sectors. Government infra budget (PMAY, roads, railways) is the primary demand driver."
  },
  "Infra": {
    color: "#f97316",
    deps: [
      { symbol:"BZ=F",     dir:"↑ negative", reason:"Diesel for construction equipment, transportation" },
      { symbol:"DX-Y.NYB", dir:"↑ negative", reason:"Imported machinery/equipment costlier when Dollar is strong" },
      { symbol:"^GSPC",    dir:"↑ positive", reason:"US market bull run → FII interest in India capex theme" },
    ],
    note:"Government capex (NIP, PLI, Smart Cities) is the primary driver. Global indices matter mainly for FII flows."
  },
  "Power": {
    color: "#22d3ee",
    deps: [
      { symbol:"BZ=F",     dir:"↑ negative", reason:"Crude = input cost for thermal plants; also coal (LNG) prices" },
    ],
    note:"Regulated utility — tariff orders and fuel supply agreements matter more. Renewables track global clean-energy sentiment."
  },
  "Capital Goods": {
    color: "#38bdf8",
    deps: [
      { symbol:"^GSPC",    dir:"↑ positive", reason:"Global capex cycle → defence/industrial order books" },
      { symbol:"^N225",    dir:"↑ positive", reason:"Japan manufacturing health → tech transfer, component sourcing" },
      { symbol:"DX-Y.NYB", dir:"↑ negative", reason:"Strong Dollar → imported components and equipment dearer" },
    ],
    note:"Defence PSUs (HAL, BEL) are domestically driven by defence budget. Siemens/ABB track global industrial cycles."
  },
  "Telecom": {
    color: "#a3e635",
    deps: [
      { symbol:"^IXIC",    dir:"↑ positive", reason:"NASDAQ tech valuations drive 5G infrastructure spending globally" },
      { symbol:"DX-Y.NYB", dir:"↑ negative", reason:"Network gear (Ericsson/Nokia) imported — USD cost increases" },
    ],
    note:"Largely domestic story. ARPU trends and 5G monetisation timeline matter more than global index moves."
  },
  "Defence": {
    color: "#4ade80",
    deps: [
      { symbol:"^GSPC",    dir:"↑ positive", reason:"Global risk appetite and geopolitical spending cycle" },
    ],
    note:"Most insulated sector from global indices. Driven by India's defence budget, Atmanirbhar Bharat, and export orders."
  },
  "Jewellery": {
    color: "#fbbf24",
    deps: [
      { symbol:"GC=F",     dir:"↑ positive", reason:"Gold spot directly impacts jewellery demand and inventory value" },
      { symbol:"USDINR=X", dir:"↑ negative", reason:"Gold imported in USD — weaker rupee = dearer gold = lower volumes" },
    ],
    note:"Watch MCX Gold price, not just index moves. Wedding season and festive demand (Oct–Dec) are primary demand drivers."
  },
  "Electronics": {
    color: "#818cf8",
    deps: [
      { symbol:"^IXIC",    dir:"↑ positive", reason:"NASDAQ tech cycle → component demand, PLI scheme momentum" },
      { symbol:"^HSI",     dir:"↑ positive", reason:"China supply chain — Hang Seng = component availability proxy" },
      { symbol:"DX-Y.NYB", dir:"↑ negative", reason:"Components imported in USD — strong Dollar = margin pressure" },
    ],
    note:"PLI beneficiaries (Dixon, Kaynes) are domestic story but exposed to China supply chain disruptions."
  },
  "Chemicals": {
    color: "#86efac",
    deps: [
      { symbol:"BZ=F",     dir:"↑ negative", reason:"Crude is key petrochemical feedstock for specialty chemicals" },
      { symbol:"^HSI",     dir:"↑ positive", reason:"China = largest specialty chemical consumer — Hang Seng proxy" },
      { symbol:"DX-Y.NYB", dir:"↑ mixed",    reason:"Chemical exports compete in USD — mixed impact by sub-segment" },
    ],
    note:"China+1 trend is structurally bullish for Indian chemicals. Watch Chinese production curtailments for opportunity signals."
  },
  "Healthcare": {
    color: "#f9a8d4",
    deps: [
      { symbol:"^GSPC",    dir:"↑ positive", reason:"US markets → FII flows into defensive healthcare globally" },
      { symbol:"USDINR=X", dir:"↑ good",     reason:"Hospital groups with Middle East/US operations benefit from USD strength" },
    ],
    note:"Hospital chains are domestic. Defensive nature means inflows during global uncertainty — outperforms in corrections."
  },
  "Real Estate": {
    color: "#fdba74",
    deps: [
      { symbol:"^INDIAVIX",dir:"↑ negative", reason:"High VIX = risk-off = defer big-ticket RE purchase decisions" },
      { symbol:"^GSPC",    dir:"↑ positive", reason:"US bull market → NRI remittances and RE investments in India" },
      { symbol:"DX-Y.NYB", dir:"↑ negative", reason:"Strong Dollar → FII avoid EM real estate allocations" },
    ],
    note:"RBI repo rate cycle is the dominant driver. Rising rates compress valuations; rate cuts unlock RE demand."
  },
  "Paint": {
    color: "#c4b5fd",
    deps: [
      { symbol:"BZ=F",     dir:"↑ negative", reason:"Crude → TiO2 (whitener) and solvent feedstock costs" },
      { symbol:"DX-Y.NYB", dir:"↑ negative", reason:"Raw materials imported in USD — strong Dollar hits margins" },
    ],
    note:"Housing construction activity is the primary demand driver. Paint is a proxy for real estate health."
  },
  "Food Tech": {
    color: "#fb7185",
    deps: [
      { symbol:"^IXIC",    dir:"↑ positive", reason:"NASDAQ re-rates new-age tech stocks globally — Zomato follows" },
      { symbol:"BZ=F",     dir:"↑ negative", reason:"Crude → delivery fleet fuel cost impacts Zomato unit economics" },
    ],
    note:"Profitability path (GOV growth, take rate) is the key domestic driver. FII tracks US tech comps for valuation."
  },
  "Retail": {
    color: "#a78bfa",
    deps: [
      { symbol:"^GSPC",    dir:"↑ positive", reason:"US market → FII allocations to India consumption theme" },
      { symbol:"DX-Y.NYB", dir:"↑ negative", reason:"Imported merchandise and luxury goods costlier with Dollar strength" },
    ],
    note:"Urban discretionary spending and store expansion pipeline are the main drivers."
  },
  "Travel": {
    color: "#38bdf8",
    deps: [
      { symbol:"BZ=F",     dir:"↑ negative", reason:"Crude → ATF (aviation turbine fuel) directly affects travel costs" },
      { symbol:"^GSPC",    dir:"↑ positive", reason:"US market → global travel recovery confidence" },
    ],
    note:"IRCTC is a quasi-monopoly insulated from most global moves. Budget airlines and hotels are more crude-sensitive."
  },
  "Fintech": {
    color: "#818cf8",
    deps: [
      { symbol:"^IXIC",    dir:"↑ positive", reason:"NASDAQ fintech comps set valuation benchmarks for Indian fintech" },
      { symbol:"^GSPC",    dir:"↑ positive", reason:"FII flows into high-growth tech-adjacent financial stocks" },
      { symbol:"DX-Y.NYB", dir:"↑ negative", reason:"Strong Dollar → risk-off from high-growth, loss-making names" },
    ],
    note:"Re-rated based on US fintech/BNPL sentiment and profitability milestones. Digital payments penetration is the core thesis."
  },
};

function getSectorInfo(symbol) {
  const sector = STOCK_SECTORS[symbol] || "Diversified";
  const deps   = SECTOR_GLOBAL_DEPS[sector] || {
    color: "#94a3b8",
    deps: [
      { symbol:"^GSPC",    dir:"↑ positive", reason:"US market health is the broadest global driver for Indian equities" },
      { symbol:"DX-Y.NYB", dir:"↑ negative", reason:"Strong Dollar → FII outflows from Indian markets" },
    ],
    note:"No specific sector mapping found. Showing broad market drivers."
  };
  return { sector, ...deps };
}

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function fetchNSEData(symbol, months = 6) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  const result = await yf.chart(`${symbol}.NS`, {
    period1: startDate.toISOString().split("T")[0],
    interval: "1d"
  });
  const quotes = result?.quotes?.filter(d => d.close != null) || [];
  return quotes.map(d => ({
    date: d.date.toISOString().split("T")[0],
    open: d.open, high: d.high, low: d.low,
    close: d.close, volume: d.volume
  }));
}

// ─── Volume Analysis ─────────────────────────────────────────────────────────

function analyzeVolume(data) {
  const volumes = data.map(d => d.volume);
  const closes  = data.map(d => d.close);
  const len     = data.length;

  // 20-day average volume
  const vol20  = volumes.slice(-20);
  const avgVol = vol20.reduce((a, b) => a + b, 0) / vol20.length;
  const currVol = volumes[len - 1];
  const volRatio = currVol / avgVol;

  // 5-day volume trend (is volume rising or falling?)
  const vol5 = volumes.slice(-5);
  const volSlope = (vol5[4] - vol5[0]) / vol5[0];

  // On Balance Volume (OBV)
  const obvArr = OBV.calculate({ close: closes, volume: volumes });
  const obvCurr = obvArr[obvArr.length - 1];
  const obvPrev = obvArr[obvArr.length - 6] || obvArr[0];
  const obvTrend = obvCurr > obvPrev ? "rising" : "falling";

  // Price direction last 5 days
  const priceChange5d = (closes[len - 1] - closes[len - 6]) / closes[len - 6] * 100;
  const priceUp = priceChange5d > 0;

  // Volume scenario classification
  let scenario, scenarioType, scenarioDesc;

  if (volRatio >= 2.5) {
    scenario = "Volume Surge";
    scenarioType = priceUp ? "bullish" : "bearish";
    scenarioDesc = priceUp
      ? `${volRatio.toFixed(1)}x avg volume with rising price — strong institutional buying`
      : `${volRatio.toFixed(1)}x avg volume with falling price — heavy selling/distribution`;
  } else if (volRatio >= 1.5) {
    scenario = priceUp ? "Breakout Volume" : "High-Vol Selloff";
    scenarioType = priceUp ? "bullish" : "bearish";
    scenarioDesc = priceUp
      ? `Above-avg volume (${volRatio.toFixed(1)}x) confirms price breakout`
      : `Above-avg volume on decline — watch for support`;
  } else if (volRatio < 0.5) {
    scenario = "Volume Dry-Up";
    scenarioType = "neutral";
    scenarioDesc = `Very low volume (${volRatio.toFixed(1)}x avg) — consolidation, expect breakout soon`;
  } else if (!priceUp && volRatio < 0.8) {
    scenario = "Low-Vol Pullback";
    scenarioType = "bullish";
    scenarioDesc = "Price dipping on below-avg volume — healthy pullback, likely to bounce";
  } else if (priceUp && obvTrend === "rising") {
    scenario = "Accumulation";
    scenarioType = "bullish";
    scenarioDesc = "Rising price + rising OBV — smart money accumulating";
  } else if (!priceUp && obvTrend === "falling") {
    scenario = "Distribution";
    scenarioType = "bearish";
    scenarioDesc = "Falling price + falling OBV — smart money distributing/exiting";
  } else {
    scenario = "Normal Volume";
    scenarioType = "neutral";
    scenarioDesc = `Volume at ${volRatio.toFixed(1)}x average — no unusual activity`;
  }

  // Delivery volume signal (if volume is very high, big player likely entering)
  const bigPlayerAlert = volRatio >= 3;

  return {
    current: currVol,
    avg20:   Math.round(avgVol),
    ratio:   +volRatio.toFixed(2),
    ratioText: volRatio.toFixed(1) + "x",
    trend:   volSlope > 0.1 ? "rising" : volSlope < -0.1 ? "falling" : "flat",
    obv:     Math.round(obvCurr),
    obvTrend,
    priceChange5d: +priceChange5d.toFixed(2),
    scenario,
    scenarioType,
    scenarioDesc,
    bigPlayerAlert,
    // Last 60 days of volume for chart
    series: data.slice(-60).map(d => ({
      date:   d.date,
      volume: d.volume,
      close:  d.close
    }))
  };
}

// ─── Indicator Calculation ────────────────────────────────────────────────────

function calcIndicators(data) {
  const closes = data.map(d => d.close);
  const highs  = data.map(d => d.high);
  const lows   = data.map(d => d.low);
  const len    = closes.length;

  const ema9arr  = EMA.calculate({ period: 9,  values: closes });
  const ema21arr = EMA.calculate({ period: 21, values: closes });
  const ema50arr = EMA.calculate({ period: 50, values: closes });
  const rsiArr   = RSI.calculate({ period: 14, values: closes });
  const macdArr  = MACD.calculate({
    values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9,
    SimpleMAOscillator: false, SimpleMASignal: false
  });
  const bbArr  = BollingerBands.calculate({ period: 20, values: closes, stdDev: 2 });
  const atrArr = ATR.calculate({ high: highs, low: lows, close: closes, period: 14 });

  const pad = arr => Array(len - arr.length).fill(null).concat(arr);
  const ema9  = pad(ema9arr);
  const ema21 = pad(ema21arr);
  const ema50 = pad(ema50arr);
  const rsi   = pad(rsiArr);
  const macd  = pad(macdArr);
  const bb    = pad(bbArr);
  const atr   = pad(atrArr);

  const curr = {
    close: closes[len - 1],
    ema9:  ema9arr[ema9arr.length - 1],
    ema21: ema21arr[ema21arr.length - 1],
    ema50: ema50arr[ema50arr.length - 1],
    rsi:   rsiArr[rsiArr.length - 1],
    macd:  macdArr[macdArr.length - 1],
    bb:    bbArr[bbArr.length - 1],
    atr:   atrArr[atrArr.length - 1]
  };

  const aboveEMA50 = curr.close > curr.ema50;
  const trendingUp = curr.ema9 > curr.ema21;
  const signals    = [];

  if (trendingUp && curr.rsi > 50 && aboveEMA50)
    signals.push({ name: "EMA Crossover", type: "bullish" });
  if (curr.rsi > 50 && curr.rsi < 70 && aboveEMA50)
    signals.push({ name: "RSI Momentum", type: "bullish" });
  if (curr.macd?.MACD > curr.macd?.signal && aboveEMA50)
    signals.push({ name: "MACD Bullish", type: "bullish" });
  if (curr.close > curr.bb?.upper)
    signals.push({ name: "BB Breakout", type: "bullish" });
  if (curr.rsi < 35)
    signals.push({ name: "RSI Oversold", type: "caution" });
  if (curr.rsi > 75)
    signals.push({ name: "RSI Overbought", type: "caution" });

  const bullishCount  = signals.filter(s => s.type === "bullish").length;
  const overallSignal = bullishCount >= 2 ? "BUY"
    : signals.some(s => s.type === "caution") ? "CAUTION"
    : trendingUp ? "HOLD" : "WAIT";

  const riskAmt = curr.atr * 1.5;
  return {
    current: curr,
    signal:  overallSignal,
    signals,
    riskLevels: {
      stopLoss: (curr.close - riskAmt).toFixed(2),
      target1:  (curr.close + riskAmt * 2).toFixed(2),
      target2:  (curr.close + riskAmt * 3).toFixed(2)
    },
    series: data.map((d, i) => ({
      date: d.date, close: d.close, open: d.open, high: d.high, low: d.low,
      volume: d.volume,
      ema9:       ema9[i],
      ema21:      ema21[i],
      ema50:      ema50[i],
      rsi:        rsi[i],
      macd:       macd[i]?.MACD        ?? null,
      macdSignal: macd[i]?.signal      ?? null,
      bbUpper:    bb[i]?.upper         ?? null,
      bbLower:    bb[i]?.lower         ?? null,
      atr:        atr[i]
    }))
  };
}

// ─── Breakout Detection ───────────────────────────────────────────────────────

function detectBreakout(data) {
  const closes  = data.map(d => d.close);
  const highs   = data.map(d => d.high);
  const lows    = data.map(d => d.low);
  const volumes = data.map(d => d.volume);
  const len     = closes.length;
  if (len < 50) return { score: 0, pattern: "Insufficient data", factors: [] };

  const price = closes[len - 1];

  // 1. Resistance: highest high in the window 25–5 bars ago (recent consolidation ceiling)
  const resistance = Math.max(...highs.slice(-30, -3));
  const gapToResist = (resistance - price) / resistance;     // 0 = at resistance, <0 = broken above
  const nearResistance = gapToResist >= -0.005 && gapToResist < 0.04; // within 4% below or just above

  // 2. Flat base / tight consolidation: 15-day range < 10% of price
  const last15High = Math.max(...highs.slice(-15));
  const last15Low  = Math.min(...lows.slice(-15));
  const rangeRatio = (last15High - last15Low) / price;
  const tightRange = rangeRatio < 0.10;

  // 3. Volume squeeze then pickup
  const avgVol20 = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const avgVol5  = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const volSqueeze = avgVol5 < avgVol20 * 0.75;   // recent vol dried up

  const latestVol = volumes[len - 1];
  const prevVol   = volumes[len - 2] || 0;
  const volPickup = latestVol > avgVol20 * 1.4 && latestVol > prevVol * 1.2; // today surge

  // 4. EMA alignment (momentum)
  const ema9arr  = EMA.calculate({ period: 9,  values: closes });
  const ema21arr = EMA.calculate({ period: 21, values: closes });
  const ema50arr = EMA.calculate({ period: 50, values: closes });
  const ema9  = ema9arr[ema9arr.length - 1];
  const ema21 = ema21arr[ema21arr.length - 1];
  const ema50 = ema50arr[ema50arr.length - 1];
  const emaStack   = ema9 > ema21 && ema21 > ema50;  // full stack
  const emaTrend   = ema9 > ema21;                    // at least partial

  // 5. RSI sweet spot (energy without being overbought)
  const rsiArr = RSI.calculate({ period: 14, values: closes });
  const rsi    = rsiArr[rsiArr.length - 1];
  const rsiGood = rsi >= 45 && rsi <= 68;

  // 6. Higher lows in last 15 bars (uptrend formation)
  const lowSlice = lows.slice(-15);
  let higherLows = 0;
  for (let i = 1; i < lowSlice.length; i++) if (lowSlice[i] > lowSlice[i - 1]) higherLows++;
  const hasHigherLows = higherLows >= 9; // at least 60% of bars made higher lows

  // 7. Price above all EMAs (strength)
  const aboveEMAs = price > ema9 && price > ema21;

  // 8. Bollinger squeeze: BB width narrowing (low volatility compression)
  const bbArr = BollingerBands.calculate({ period: 20, values: closes, stdDev: 2 });
  const bbNow   = bbArr[bbArr.length - 1];
  const bbPrev  = bbArr[bbArr.length - 10] || bbNow;
  const bbWidth    = bbNow ? (bbNow.upper - bbNow.lower) / bbNow.middle : 0.1;
  const bbWidthPrev = bbPrev ? (bbPrev.upper - bbPrev.lower) / bbPrev.middle : 0.1;
  const bbSqueeze  = bbWidth < 0.08 || bbWidth < bbWidthPrev * 0.75; // tight bands or narrowing

  // 9. 52-week position
  const lookback = Math.min(len, 252);
  const high52 = Math.max(...highs.slice(-lookback));
  const low52  = Math.min(...lows.slice(-lookback));
  const pct52w = high52 > low52 ? +((price - low52) / (high52 - low52) * 100).toFixed(0) : 50;
  const near52High = pct52w >= 70;

  // 10. Recent price momentum: price up >2% in last 3 bars
  const price3dAgo = closes[len - 4] || price;
  const momPct     = (price - price3dAgo) / price3dAgo * 100;
  const hasMomentum = momPct > 1.5;

  // ── Score ─────────────────────────────────────────────────────────────────
  let score = 0;
  const factors = [];

  if (nearResistance) { score += 22; factors.push(`Near resistance ₹${resistance.toFixed(0)} — ready to break`); }
  if (tightRange)     { score += 15; factors.push(`Tight base (${(rangeRatio*100).toFixed(1)}% range) — energy compressing`); }
  if (bbSqueeze)      { score += 12; factors.push("Bollinger squeeze — volatility contracting"); }
  if (volSqueeze)     { score += 10; factors.push("Volume dry-up — sellers exhausted"); }
  if (volPickup)      { score += 18; factors.push("Volume surge today — buying interest waking up"); }
  if (emaStack)       { score += 12; factors.push("EMA 9 > 21 > 50 — full uptrend stack"); }
  else if (emaTrend)  { score += 6;  factors.push("EMA 9 > 21 — short-term momentum positive"); }
  if (rsiGood)        { score += 8;  factors.push(`RSI ${rsi.toFixed(0)} — in ideal zone (45–68)`); }
  if (hasHigherLows)  { score += 8;  factors.push("Higher lows — buyers defending each dip"); }
  if (aboveEMAs)      { score += 6;  factors.push("Price above EMAs — structure intact"); }
  if (near52High)     { score += 10; factors.push(`Price at ${pct52w}% of 52W range — in strong territory`); }
  if (hasMomentum)    { score += 8;  factors.push(`+${momPct.toFixed(1)}% in last 3 sessions — momentum building`); }

  // ── Pattern Label ─────────────────────────────────────────────────────────
  let pattern;
  const breakingOut = gapToResist < 0 && volPickup;

  if (breakingOut && score >= 60)                         pattern = "🚀 BREAKOUT NOW";
  else if (nearResistance && volPickup && tightRange)     pattern = "⚡ Coiled Spring";
  else if (nearResistance && volSqueeze && tightRange)    pattern = "🎯 Pre-Breakout Setup";
  else if (bbSqueeze && tightRange && emaStack)           pattern = "📊 Flat Base Squeeze";
  else if (near52High && emaStack && rsiGood)             pattern = "📈 52W Breakout Zone";
  else if (volPickup && aboveEMAs && emaTrend)            pattern = "⚡ Volume Breakout";
  else if (hasHigherLows && tightRange)                   pattern = "🔄 Cup Base Forming";
  else if (emaTrend && rsiGood && score >= 30)            pattern = "📊 Developing Setup";
  else                                                    pattern = "⏳ Wait";

  return {
    score:       Math.min(100, score),
    pattern,
    resistance:  +resistance.toFixed(2),
    rsi:         +rsi.toFixed(1),
    pct52w,
    volRatio:    +(latestVol / avgVol20).toFixed(1),
    bbWidth:     +(bbWidth * 100).toFixed(1),
    factors
  };
}

// ─── Fresh EMA 9/21 Crossover Detection ──────────────────────────────────────

function detectFreshEMACross(data, lookback = 5) {
  const closes  = data.map(d => d.close);
  const highs   = data.map(d => d.high);
  const lows    = data.map(d => d.low);
  const volumes = data.map(d => d.volume);
  const len     = closes.length;

  const NONE = { crossDay: -1, crossDayLabel: "—", crossDate: "", hasCross: false,
                 rsi: null, rsiOk: false, ema9: null, ema21: null, ema50: null,
                 volRatio: null, condCount: 0, confidence: "LOW", satisfied: [], checks: {},
                 stopLoss: null, target1: null, target2: null };
  if (len < 30) return NONE;

  const ema9arr  = EMA.calculate({ period: 9,  values: closes });
  const ema21arr = EMA.calculate({ period: 21, values: closes });
  const ema50arr = EMA.calculate({ period: 50, values: closes });
  const rsiArr   = RSI.calculate({ period: 14, values: closes });
  const macdArr  = MACD.calculate({
    values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9,
    SimpleMAOscillator: false, SimpleMASignal: false
  });
  const atrArr = ATR.calculate({ high: highs, low: lows, close: closes, period: 14 });

  const rsi   = rsiArr[rsiArr.length - 1];
  const rsiOk = rsi >= 50;

  // Detect bullish crossover (EMA9 crossed ABOVE EMA21) within last `lookback` bars
  let crossDay = -1;
  for (let i = 1; i <= lookback; i++) {
    const e9C  = ema9arr[ema9arr.length - i];
    const e21C = ema21arr[ema21arr.length - i];
    const e9P  = ema9arr[ema9arr.length - i - 1];
    const e21P = ema21arr[ema21arr.length - i - 1];
    if (e9C != null && e21C != null && e9P != null && e21P != null) {
      if (e9C > e21C && e9P <= e21P) { crossDay = i; break; }
    }
  }

  const price  = closes[len - 1];
  const ema9   = ema9arr[ema9arr.length - 1];
  const ema21  = ema21arr[ema21arr.length - 1];
  const ema50  = ema50arr[ema50arr.length - 1];
  const macd   = macdArr[macdArr.length - 1];
  const atr    = atrArr[atrArr.length - 1];

  const avgVol20 = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const volRatio  = +(volumes[len - 1] / avgVol20).toFixed(2);

  const hasCross = crossDay > -1;

  const checks = {
    emaCross:      hasCross,
    rsiAbove50:    rsiOk,
    aboveEMA50:    price > ema50,
    macdBullish:   macd != null && macd.MACD > macd.signal,
    macdHist:      macd != null && macd.histogram > 0,
    volConfirm:    volRatio >= 1.2,
    positiveToday: closes[len - 1] > closes[len - 2],
    highVol:       volRatio >= 2.0
  };

  const satisfied = [];
  if (checks.emaCross)      satisfied.push(`EMA9×EMA21 (${crossDay === 1 ? "today" : crossDay === 2 ? "yesterday" : crossDay + "d ago"})`);
  if (checks.rsiAbove50)    satisfied.push(`RSI ${rsi.toFixed(0)} > 50`);
  if (checks.aboveEMA50)    satisfied.push("Above EMA50");
  if (checks.macdBullish)   satisfied.push("MACD bullish");
  if (checks.macdHist)      satisfied.push("MACD histogram +ve");
  if (checks.volConfirm)    satisfied.push(`Vol ${volRatio}x avg`);
  if (checks.positiveToday) satisfied.push("Closed green today");
  if (checks.highVol)       satisfied.push("High volume surge");

  const condCount  = satisfied.length;
  const confidence = condCount >= 6 ? "HIGH" : condCount >= 4 ? "MEDIUM" : "LOW";
  const crossDate  = hasCross ? (data[len - crossDay]?.date || "") : "";

  return {
    crossDay,
    crossDate,
    crossDayLabel: crossDay === 1 ? "Today" : crossDay === 2 ? "Yesterday" : crossDay > 2 ? `${crossDay}d ago` : "—",
    hasCross,
    rsi:        +rsi.toFixed(1),
    rsiOk,
    ema9:       +ema9.toFixed(2),
    ema21:      +ema21.toFixed(2),
    ema50:      +ema50.toFixed(2),
    volRatio,
    condCount,
    confidence,
    satisfied,
    checks,
    stopLoss:  atr ? +(price - atr * 1.5).toFixed(2) : null,
    target1:   atr ? +(price + atr * 2).toFixed(2)   : null,
    target2:   atr ? +(price + atr * 3).toFixed(2)   : null,
  };
}

// ─── Global Market Sentiment ──────────────────────────────────────────────────

function computeGlobalSentiment(indices) {
  // Exclude Indian indices themselves (Nifty, Sensex, VIX)
  const relevant = indices.filter(i =>
    i.changePct != null && !["^NSEI","^BSESN"].includes(i.symbol)
  );
  if (!relevant.length) return { score: 0, label: "Neutral", impact: "No data" };

  // Weighted impact: correlation * direction
  // For inverse-correlated (crude, USD): rising them = negative for Nifty
  let weightedSum = 0, totalWeight = 0;
  for (const idx of relevant) {
    const corr   = NIFTY_CORRELATION[idx.symbol] ?? 0.3;
    const change = parseFloat(idx.changePct);
    // corr already encodes direction (negative for crude/USD/VIX)
    weightedSum += change * corr;
    totalWeight += Math.abs(corr);
  }
  const score = totalWeight > 0 ? weightedSum / totalWeight : 0;

  let label, impact, color;
  if (score > 1)        { label = "Strongly Bullish"; impact = "Nifty likely to open GAP-UP 0.5–1.5%"; color = "green" }
  else if (score > 0.3) { label = "Bullish";          impact = "Nifty likely to open positive"; color = "green" }
  else if (score > -0.3){ label = "Neutral";           impact = "Nifty likely flat open"; color = "neutral" }
  else if (score > -1)  { label = "Bearish";           impact = "Nifty likely to open negative"; color = "red" }
  else                  { label = "Strongly Bearish";  impact = "Nifty likely to open GAP-DOWN 0.5–1.5%"; color = "red" }

  const usMarketUp = relevant.filter(i => i.region === "US" && parseFloat(i.changePct) > 0).length;
  const usTotal    = relevant.filter(i => i.region === "US").length;
  const asiaUp     = relevant.filter(i => ["Japan","HK"].includes(i.region) && parseFloat(i.changePct) > 0).length;
  const asiaTotal  = relevant.filter(i => ["Japan","HK"].includes(i.region)).length;

  // Key macro alerts
  const crude   = relevant.find(i => i.symbol === "BZ=F");
  const usdinr  = relevant.find(i => i.symbol === "USDINR=X");
  const vix     = relevant.find(i => i.symbol === "^INDIAVIX");
  const macroAlerts = [];
  if (crude  && parseFloat(crude.changePct)  >  2) macroAlerts.push(`Crude +${crude.changePct}% (negative for India)`);
  if (crude  && parseFloat(crude.changePct)  < -2) macroAlerts.push(`Crude ${crude.changePct}% (positive for India)`);
  if (usdinr && parseFloat(usdinr.changePct) >  0.3) macroAlerts.push(`USD/INR +${usdinr.changePct}% (FII outflow risk)`);
  if (vix    && parseFloat(vix.changePct)    > 10) macroAlerts.push(`India VIX spike +${vix.changePct}% (fear elevated)`);
  if (vix    && parseFloat(vix.changePct)    < -10) macroAlerts.push(`India VIX fell ${vix.changePct}% (calm market)`);

  return {
    score:        +score.toFixed(2),
    label,
    impact,
    color,
    usStrength:   usTotal   ? `${usMarketUp}/${usTotal} US markets positive`   : null,
    asiaStrength: asiaTotal ? `${asiaUp}/${asiaTotal} Asian markets positive`   : null,
    macroAlerts,
    giftNiftyNote: "GIFT Nifty futures require NSE IFSC/broker feed (not available on Yahoo Finance free API). Use Nifty 50 spot as proxy.",
  };
}

// ─── API Routes ───────────────────────────────────────────────────────────────

// Global indices + sentiment
app.get("/api/global", async (req, res) => {
  try {
    const symbols  = GLOBAL_INDICES.map(i => i.symbol);
    const quotes   = await Promise.allSettled(symbols.map(s => yf.quote(s)));
    const indices  = GLOBAL_INDICES.map((meta, i) => {
      const q = quotes[i].status === "fulfilled" ? quotes[i].value : null;
      return {
        ...meta,
        price:     q?.regularMarketPrice      ?? null,
        change:    q?.regularMarketChange     ?? null,
        changePct: q?.regularMarketChangePercent != null
                     ? +q.regularMarketChangePercent.toFixed(2)
                     : null,
        prevClose: q?.regularMarketPreviousClose ?? null,
        isOpen:    q?.marketState === "REGULAR"
      };
    });

    const sentiment = computeGlobalSentiment(indices);
    res.json({ indices, sentiment, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List available universes
app.get("/api/universes", (req, res) => {
  res.json(Object.entries(UNIVERSES).map(([key, u]) => ({
    key, label: u.label, count: u.stocks.length
  })));
});

// Single stock analysis (now includes volume)
app.get("/api/stock/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase().replace(/\.NS$/i, "");
    const months = parseInt(req.query.months || "6");
    const data   = await fetchNSEData(symbol, months);
    if (!data || data.length < 30)
      return res.status(404).json({ error: `No data found for ${symbol}` });

    const analysis = calcIndicators(data);
    const volume   = analyzeVolume(data);
    const quote    = await yf.quote(`${symbol}.NS`);

    // Volume signal feeds into overall signals
    if (volume.scenarioType === "bullish" && !analysis.signals.find(s => s.name === "Volume"))
      analysis.signals.push({ name: volume.scenario, type: "bullish" });
    else if (volume.scenarioType === "bearish")
      analysis.signals.push({ name: volume.scenario, type: "caution" });

    const sectorInfo = getSectorInfo(symbol);
    res.json({
      symbol,
      price:     quote.regularMarketPrice,
      change:    quote.regularMarketChange?.toFixed(2),
      changePct: quote.regularMarketChangePercent?.toFixed(2),
      sectorInfo,
      high52w:   quote.fiftyTwoWeekHigh,
      low52w:    quote.fiftyTwoWeekLow,
      volume,
      ...analysis
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Scan a universe for swing setups (includes volume in results)
app.get("/api/scan", async (req, res) => {
  const universe = req.query.universe || "nifty50";
  const u = UNIVERSES[universe];
  if (!u) return res.status(400).json({ error: `Unknown universe: ${universe}` });

  const stocks     = u.stocks;
  const isBreakout   = universe === "breakout";
  const isCrossover  = universe === "crossover";
  const priceMin     = u.priceMin ?? 0;
  const priceMax     = u.priceMax ?? Infinity;
  const results      = [];
  const BATCH        = 5;

  for (let i = 0; i < stocks.length; i += BATCH) {
    const batch    = stocks.slice(i, i + BATCH);
    const batchRes = await Promise.allSettled(
      batch.map(async symbol => {
        const data = await fetchNSEData(symbol, 12);
        if (!data || data.length < 50) return null;
        const price = data[data.length - 1].close;

        // Price filter (breakout universe)
        if (price < priceMin || price > priceMax) return null;

        // Always compute cross stats — used in every universe's table
        const cross = detectFreshEMACross(data, 5);

        // Crossover universe: only keep stocks with fresh EMA9×EMA21 + RSI>50
        if (isCrossover) {
          if (!cross.hasCross || !cross.rsiOk) return null;
          const volume = analyzeVolume(data);
          return {
            symbol, price, cross,
            signal:     cross.condCount >= 5 ? "STRONG BUY" : cross.condCount >= 3 ? "BUY" : "WATCH",
            riskLevels: { stopLoss: cross.stopLoss, target1: cross.target1, target2: cross.target2 },
            volume: {
              ratio:        volume.ratio,
              ratioText:    volume.ratioText,
              scenario:     volume.scenario,
              scenarioType: volume.scenarioType,
              obvTrend:     volume.obvTrend,
              bigPlayer:    volume.bigPlayerAlert
            }
          };
        }

        const analysis     = calcIndicators(data);
        const volume       = analyzeVolume(data);
        const bullishCount = analysis.signals.filter(s => s.type === "bullish").length;

        const breakout = isBreakout ? detectBreakout(data) : null;
        if (!isBreakout && bullishCount === 0) return null;
        if (isBreakout  && bullishCount === 0 && (breakout?.score ?? 0) < 25) return null;

        return {
          symbol,
          signal:      analysis.signal,
          price,
          signals:     analysis.signals,
          signalCount: bullishCount,
          rsi:         analysis.current.rsi?.toFixed(1),
          riskLevels:  analysis.riskLevels,
          breakout,
          cross,       // always included now
          volume: {
            ratio:        volume.ratio,
            ratioText:    volume.ratioText,
            scenario:     volume.scenario,
            scenarioType: volume.scenarioType,
            obvTrend:     volume.obvTrend,
            bigPlayer:    volume.bigPlayerAlert
          }
        };
      })
    );
    batchRes.forEach(r => { if (r.status === "fulfilled" && r.value) results.push(r.value); });
    if (i + BATCH < stocks.length) await new Promise(r => setTimeout(r, 300));
  }

  if (isCrossover) {
    // Sort: freshest cross first, then by confidence/condCount
    results.sort((a, b) => (a.cross.crossDay - b.cross.crossDay) || (b.cross.condCount - a.cross.condCount));
  } else if (isBreakout) {
    results.sort((a, b) => (b.breakout?.score ?? 0) - (a.breakout?.score ?? 0));
  } else {
    results.sort((a, b) => b.signalCount - a.signalCount);
  }
  res.json({ universe, label: u.label, total: stocks.length, count: results.length, results, isBreakout, isCrossover });
});

// ─── Nifty Options Signal Engine ─────────────────────────────────────────────

function getNextThursday() {
  const d = new Date();
  const daysUntil = (4 - d.getDay() + 7) % 7 || 7;
  const thu = new Date(d);
  thu.setDate(d.getDate() + daysUntil);
  return thu.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
}

function computeNiftySignal(dailyData, intradayData, globalSentiment) {
  if (!dailyData || dailyData.length < 20) return null;

  const closes = dailyData.map(d => d.close);
  const highs   = dailyData.map(d => d.high);
  const lows    = dailyData.map(d => d.low);
  const len     = closes.length;

  const ema9arr  = EMA.calculate({ period: 9,  values: closes });
  const ema21arr = EMA.calculate({ period: 21, values: closes });
  const ema50arr = EMA.calculate({ period: 50, values: closes });
  const rsiArr   = RSI.calculate({ period: 14, values: closes });
  const atrArr   = ATR.calculate({ high: highs, low: lows, close: closes, period: 14 });

  const ema9  = ema9arr[ema9arr.length - 1];
  const ema21 = ema21arr[ema21arr.length - 1];
  const ema50 = ema50arr.length > 0 ? ema50arr[ema50arr.length - 1] : null;
  const rsi   = rsiArr[rsiArr.length - 1];
  const atr   = atrArr[atrArr.length - 1];

  const currClose  = closes[len - 1];
  const prevClose  = closes[len - 2];
  const todayChg   = ((currClose - prevClose) / prevClose) * 100;

  const recent     = dailyData.slice(-20);
  const support    = +Math.min(...recent.map(d => d.low)).toFixed(2);
  const resistance = +Math.max(...recent.map(d => d.high)).toFixed(2);
  const atm        = Math.round(currClose / 50) * 50;

  // Trend scoring
  let score = 0;
  const reasons  = [];
  const cautions = [];

  if (ema9 > ema21) {
    score += 2;
    reasons.push(`EMA9 (${ema9.toFixed(0)}) > EMA21 (${ema21.toFixed(0)}) — short-term bullish`);
  } else {
    score -= 2;
    reasons.push(`EMA9 (${ema9.toFixed(0)}) < EMA21 (${ema21.toFixed(0)}) — short-term bearish`);
  }
  if (ema50) {
    if (currClose > ema50) { score += 1; reasons.push(`Price above EMA50 (${ema50.toFixed(0)}) — medium-term uptrend`); }
    else                   { score -= 1; reasons.push(`Price below EMA50 (${ema50.toFixed(0)}) — medium-term downtrend`); }
  }
  if (todayChg > 0.3)       { score += 2; reasons.push(`Today up +${todayChg.toFixed(2)}% — bullish momentum`); }
  else if (todayChg < -0.3)  { score -= 2; reasons.push(`Today down ${todayChg.toFixed(2)}% — bearish momentum`); }
  else                       { reasons.push(`Today flat ${todayChg.toFixed(2)}% — wait for clear direction`); }

  if (rsi > 55 && rsi < 75) { score += 1; reasons.push(`RSI ${rsi.toFixed(1)} — bullish momentum zone`); }
  else if (rsi < 45 && rsi > 25) { score -= 1; reasons.push(`RSI ${rsi.toFixed(1)} — bearish zone`); }
  else if (rsi >= 75) cautions.push(`RSI ${rsi.toFixed(1)} — overbought, protect profits`);
  else if (rsi <= 25) cautions.push(`RSI ${rsi.toFixed(1)} — oversold, short-squeeze risk`);

  const gs = globalSentiment?.score ?? 0;
  if (gs > 0.5)       { score += 2; reasons.push(`Global: ${globalSentiment.label} — tailwind for Nifty`); }
  else if (gs > 0.1)  { score += 1; reasons.push(`Global: ${globalSentiment.label} — mild positive`); }
  else if (gs < -0.5) { score -= 2; reasons.push(`Global: ${globalSentiment.label} — global headwind`); }
  else if (gs < -0.1) { score -= 1; reasons.push(`Global: ${globalSentiment.label} — mild negative`); }

  // Intraday 15-min analysis
  let vwap = null, firstCandleBullish = null, intradayBias = "neutral";
  let openPrice = null, lastIntradayClose = null;
  if (intradayData && intradayData.length >= 2) {
    const fc = intradayData[0];
    firstCandleBullish = fc.close > fc.open;
    openPrice = fc.open;
    const lc  = intradayData[intradayData.length - 1];
    lastIntradayClose = lc.close;

    let sumPV = 0, sumV = 0;
    intradayData.forEach(c => {
      const tp = (c.high + c.low + c.close) / 3;
      sumPV += tp * (c.volume || 0);
      sumV  += (c.volume || 0);
    });
    vwap = sumV > 0 ? +(sumPV / sumV).toFixed(2) : null;

    if (firstCandleBullish) {
      score += 1; reasons.push(`First 15-min candle: Bullish (${fc.open.toFixed(0)} → ${fc.close.toFixed(0)})`);
    } else {
      score -= 1; reasons.push(`First 15-min candle: Bearish (${fc.open.toFixed(0)} → ${fc.close.toFixed(0)})`);
    }
    if (vwap) {
      if (lc.close > vwap) { score += 1; reasons.push(`Price above VWAP (${vwap}) — bullish intraday bias`); }
      else                  { score -= 1; reasons.push(`Price below VWAP (${vwap}) — bearish intraday bias`); }
    }
  }

  // Derive signal
  let signal, strength, strikeType, strike, slSpot, t1Spot, t2Spot, entry;
  const atr1h = +(atr * 1.5).toFixed(0);
  const atr2x  = +(atr * 2).toFixed(0);
  const atr3x  = +(atr * 3).toFixed(0);

  if (score >= 4) {
    signal = "BUY CE"; strength = "STRONG"; strikeType = "CE";
    strike = atm + 50;
    slSpot = +(currClose - atr1h).toFixed(0);
    t1Spot = +(currClose + atr2x).toFixed(0);
    t2Spot = +(currClose + atr3x).toFixed(0);
    entry  = `Buy ${strike}CE at market open`;
  } else if (score >= 2) {
    signal = "BUY CE"; strength = "MODERATE"; strikeType = "CE";
    strike = atm;
    slSpot = +(currClose - atr1h).toFixed(0);
    t1Spot = +(currClose + atr2x).toFixed(0);
    t2Spot = +(currClose + atr3x).toFixed(0);
    entry  = `Buy ${strike}CE — confirm spot above ${+(currClose + atr * 0.3).toFixed(0)}`;
  } else if (score <= -4) {
    signal = "BUY PE"; strength = "STRONG"; strikeType = "PE";
    strike = atm - 50;
    slSpot = +(currClose + atr1h).toFixed(0);
    t1Spot = +(currClose - atr2x).toFixed(0);
    t2Spot = +(currClose - atr3x).toFixed(0);
    entry  = `Buy ${strike}PE at market open`;
  } else if (score <= -2) {
    signal = "BUY PE"; strength = "MODERATE"; strikeType = "PE";
    strike = atm;
    slSpot = +(currClose + atr1h).toFixed(0);
    t1Spot = +(currClose - atr2x).toFixed(0);
    t2Spot = +(currClose - atr3x).toFixed(0);
    entry  = `Buy ${strike}PE — confirm spot breaks below ${+(currClose - atr * 0.3).toFixed(0)}`;
  } else {
    signal = "WAIT"; strength = "LOW"; strikeType = null;
    strike = atm; slSpot = null; t1Spot = null; t2Spot = null;
    entry  = "No clear directional bias — wait for breakout above resistance or breakdown below support";
  }

  // Build daily series with EMAs for charting (pad to align arrays)
  const pad = arr => Array(len - arr.length).fill(null).concat(arr);
  const e9 = pad(ema9arr), e21 = pad(ema21arr), e50 = pad(ema50arr);
  const dailySeries = dailyData.map((d, i) => ({
    ...d, ema9: e9[i] ? +e9[i].toFixed(2) : null,
    ema21: e21[i] ? +e21[i].toFixed(2) : null,
    ema50: e50[i] ? +e50[i].toFixed(2) : null
  }));

  return {
    signal, strength, score, strikeType, strike, entry,
    slSpot, t1Spot, t2Spot, vwap, openPrice,
    spot:       +currClose.toFixed(2),
    atm,
    atr:        +atr.toFixed(2),
    rsi:        +rsi.toFixed(1),
    ema9:       +ema9.toFixed(2),
    ema21:      +ema21.toFixed(2),
    ema50:      ema50 ? +ema50.toFixed(2) : null,
    support, resistance,
    todayChange: +todayChg.toFixed(2),
    todayHigh:  dailyData[len - 1].high,
    todayLow:   dailyData[len - 1].low,
    firstCandleBullish,
    reasons, cautions,
    expiry: getNextThursday(),
    dailySeries: dailySeries.slice(-30)
  };
}

// Nifty 15-min intraday candles
app.get("/api/nifty/intraday", async (req, res) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 2);
    const result = await yf.chart("^NSEI", {
      period1: startDate.toISOString().split("T")[0],
      interval: "15m"
    });
    const quotes = (result?.quotes || []).filter(d => d.close != null);
    const today = new Date().toISOString().split("T")[0];
    const todayQ = quotes.filter(d => new Date(d.date).toISOString().split("T")[0] === today);
    const candles = (todayQ.length >= 3 ? todayQ : quotes.slice(-26)).map(d => ({
      date: d.date.toISOString(), open: +d.open.toFixed(2), high: +d.high.toFixed(2),
      low: +d.low.toFixed(2), close: +d.close.toFixed(2), volume: d.volume
    }));
    res.json(candles);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// Full Nifty signal (daily + intraday + global → option signal)
app.get("/api/nifty/signal", async (req, res) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 120);
    const intStart = new Date();
    intStart.setDate(intStart.getDate() - 2);

    const [dailyRes, intradayRes, globalRes] = await Promise.allSettled([
      yf.chart("^NSEI", { period1: startDate.toISOString().split("T")[0], interval: "1d" }),
      yf.chart("^NSEI", { period1: intStart.toISOString().split("T")[0], interval: "15m" }),
      Promise.allSettled(GLOBAL_INDICES.map(i => yf.quote(i.symbol)))
    ]);

    const dailyData = (dailyRes.value?.quotes || []).filter(d => d.close != null).map(d => ({
      date: d.date.toISOString().split("T")[0],
      open: +d.open.toFixed(2), high: +d.high.toFixed(2),
      low:  +d.low.toFixed(2),  close: +d.close.toFixed(2), volume: d.volume
    }));

    const today = new Date().toISOString().split("T")[0];
    const allInt = (intradayRes.value?.quotes || []).filter(d => d.close != null);
    const todayInt = allInt.filter(d => new Date(d.date).toISOString().split("T")[0] === today);
    const intradayData = (todayInt.length >= 3 ? todayInt : allInt.slice(-26)).map(d => ({
      date: d.date.toISOString(), open: +d.open.toFixed(2), high: +d.high.toFixed(2),
      low: +d.low.toFixed(2), close: +d.close.toFixed(2), volume: d.volume
    }));

    const gQuotes = globalRes.value || [];
    const indices  = GLOBAL_INDICES.map((meta, i) => {
      const q = gQuotes[i]?.status === "fulfilled" ? gQuotes[i].value : null;
      return { ...meta, price: q?.regularMarketPrice ?? null,
        change: q?.regularMarketChange ?? null,
        changePct: q?.regularMarketChangePercent != null ? +q.regularMarketChangePercent.toFixed(2) : null };
    });
    const globalSentiment = computeGlobalSentiment(indices);

    const signal = computeNiftySignal(dailyData, intradayData, globalSentiment);

    res.json({ signal, intraday: intradayData, globalIndices: indices, globalSentiment, timestamp: new Date().toISOString() });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── NSE Option Chain ────────────────────────────────────────────────────────

let _nseSession = { cookies: "", expiry: 0 };
let _ocCache    = { data: null, expiry: 0 };

async function getNSECookies() {
  if (_nseSession.cookies && Date.now() < _nseSession.expiry) return _nseSession.cookies;
  try {
    const res = await fetch("https://www.nseindia.com/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
      }
    });
    const rawCookies = res.headers.getSetCookie?.() || [];
    const cookies = rawCookies.map(c => c.split(";")[0]).join("; ");
    _nseSession = { cookies, expiry: Date.now() + 4 * 60 * 1000 };
    return cookies;
  } catch { return ""; }
}

function bsPrice(S, K, T, r, sigma, type) {
  if (T <= 0) return type === "CE" ? Math.max(0, S-K) : Math.max(0, K-S);
  const d1 = (Math.log(S/K) + (r + sigma*sigma/2)*T) / (sigma*Math.sqrt(T));
  const d2 = d1 - sigma*Math.sqrt(T);
  const ncdf = x => { const t=1/(1+0.3275911*Math.abs(x)), y=1-((((1.061405429*t-1.453152027)*t+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x); return x>=0?0.5*(1+y):0.5*(1-y); };
  return type === "CE"
    ? S*ncdf(d1) - K*Math.exp(-r*T)*ncdf(d2)
    : K*Math.exp(-r*T)*ncdf(-d2) - S*ncdf(-d1);
}

function syntheticChain(spot, vixVal, daysToExpiry) {
  const T      = Math.max(0.5/365, daysToExpiry/365);
  const r      = 0.065;
  const baseIV = (vixVal || 15) / 100;
  const atm    = Math.round(spot / 50) * 50;
  const strikes = [];
  for (let s = atm - 600; s <= atm + 600; s += 50) strikes.push(s);

  // OI simulation: bell curve centred on ATM, PE side 1.3× heavier
  const oiBase = 1_000_000;
  const chain  = strikes.map(K => {
    const moneyness = (K - spot) / spot;
    const oiDecay   = Math.exp(-0.5 * (moneyness / 0.008) ** 2);
    const ceOI  = Math.round(oiBase * oiDecay * (K <= spot ? 0.7 : 1.0));
    const peOI  = Math.round(oiBase * oiDecay * (K >= spot ? 0.7 : 1.0) * 1.3);
    const ceIV  = baseIV + Math.max(0, moneyness) * 0.8;
    const peIV  = baseIV + Math.max(0, -moneyness) * 1.0;
    const ceLTP = +bsPrice(spot, K, T, r, ceIV, "CE").toFixed(2);
    const peLTP = +bsPrice(spot, K, T, r, peIV, "PE").toFixed(2);
    const ceD1  = (Math.log(spot/K) + (r + ceIV*ceIV/2)*T) / (ceIV*Math.sqrt(T));
    const ncdf  = x => { const t=1/(1+0.3275911*Math.abs(x)), y=1-((((1.061405429*t-1.453152027)*t+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x); return x>=0?0.5*(1+y):0.5*(1-y); };
    const ceDelta = +ncdf(ceD1).toFixed(3);
    return {
      strikePrice: K,
      CE: { ltp: ceLTP, iv: +(ceIV*100).toFixed(1), delta: ceDelta, oi: ceOI, vol: Math.round(ceOI*0.12), synthetic: true },
      PE: { ltp: peLTP, iv: +(peIV*100).toFixed(1), delta: +(ceDelta-1).toFixed(3), oi: peOI, vol: Math.round(peOI*0.12), synthetic: true }
    };
  });
  return chain;
}

function calcMaxPain(chain) {
  if (!chain.length) return null;
  const strikes = chain.map(r => r.strikePrice);
  let minPain = Infinity, maxPainStrike = strikes[0];
  for (const test of strikes) {
    let pain = 0;
    for (const row of chain) {
      const s = row.strikePrice;
      if (row.CE) pain += Math.max(0, s - test) * (row.CE.oi || 0);
      if (row.PE) pain += Math.max(0, test - s) * (row.PE.oi || 0);
    }
    if (pain < minPain) { minPain = pain; maxPainStrike = test; }
  }
  return maxPainStrike;
}

app.get("/api/nifty/option-chain", async (req, res) => {
  // Try NSE live data first
  try {
    if (_ocCache.data && Date.now() < _ocCache.expiry) {
      return res.json(_ocCache.data);
    }
    const cookies = await getNSECookies();
    const ocRes   = await fetch("https://www.nseindia.com/api/option-chain-indices?symbol=NIFTY", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.nseindia.com/option-chain",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        ...(cookies ? { Cookie: cookies } : {})
      }
    });
    if (!ocRes.ok) throw new Error(`NSE ${ocRes.status}`);
    const raw      = await ocRes.json();
    const expiries = raw.records?.expiryDates || [];
    const target   = req.query.expiry || expiries[0] || "";
    const chain    = (raw.records?.data || [])
      .filter(r => r.expiryDate === target)
      .sort((a, b) => a.strikePrice - b.strikePrice)
      .map(r => ({
        strikePrice: r.strikePrice,
        CE: r.CE ? { ltp: r.CE.lastPrice, iv: r.CE.impliedVolatility, delta: null, oi: r.CE.openInterest, vol: r.CE.totalTradedVolume, chgOI: r.CE.changeinOpenInterest } : null,
        PE: r.PE ? { ltp: r.PE.lastPrice, iv: r.PE.impliedVolatility, delta: null, oi: r.PE.openInterest, vol: r.PE.totalTradedVolume, chgOI: r.PE.changeinOpenInterest } : null,
      }));
    const totalCEOI = chain.reduce((s,r) => s + (r.CE?.oi||0), 0);
    const totalPEOI = chain.reduce((s,r) => s + (r.PE?.oi||0), 0);
    const spotVal = raw.records?.underlyingValue || 0;
    const atmStrike = Math.round(spotVal / 50) * 50;
    const flatChain = chain.map(r => ({
      strike: r.strikePrice,
      ceLTP:   r.CE?.ltp   ?? null, ceOI: r.CE?.oi  ?? 0, ceChgOI: r.CE?.chgOI ?? null, ceIV: r.CE?.iv ?? null,
      peLTP:   r.PE?.ltp   ?? null, peOI: r.PE?.oi  ?? 0, peChgOI: r.PE?.chgOI ?? null, peIV: r.PE?.iv ?? null,
    }));
    const result = { expiries, expiry: target, spot: spotVal, atm: atmStrike,
      timestamp: raw.records?.timestamp, chain: flatChain, source: "nse",
      pcr: totalCEOI > 0 ? +(totalPEOI/totalCEOI).toFixed(2) : null,
      maxPain: calcMaxPain(chain) };
    _ocCache = { data: result, expiry: Date.now() + 90000 };
    return res.json(result);
  } catch {
    // Fallback: synthetic chain from B-S
  }
  try {
    const [spotQ, vixQ] = await Promise.all([yf.quote("^NSEI"), yf.quote("^INDIAVIX")]);
    const spot = spotQ.regularMarketPrice;
    const vix  = vixQ.regularMarketPrice;
    const startDate = new Date(); startDate.setDate(startDate.getDate() - 90);
    const chain = syntheticChain(spot, vix, 4);
    const totalCEOI = chain.reduce((s,r) => s+(r.CE?.oi||0),0);
    const totalPEOI = chain.reduce((s,r) => s+(r.PE?.oi||0),0);
    const atmStrike = Math.round(spot / 50) * 50;
    const flatChain = chain.map(r => ({
      strike: r.strikePrice,
      ceLTP:   r.CE?.ltp  ?? null, ceOI: r.CE?.oi ?? 0, ceChgOI: null, ceIV: r.CE?.iv ?? null,
      peLTP:   r.PE?.ltp  ?? null, peOI: r.PE?.oi ?? 0, peChgOI: null, peIV: r.PE?.iv ?? null,
    }));
    res.json({ expiries: [], expiry: "Synthetic (B-S)", spot, atm: atmStrike, vix, chain: flatChain,
      source: "synthetic", pcr: +(totalPEOI/totalCEOI).toFixed(2), maxPain: calcMaxPain(chain),
      timestamp: new Date().toISOString() });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// Live Nifty spot + VIX for P&L refresh
app.get("/api/nifty/live", async (req, res) => {
  try {
    const [spotQ, vixQ] = await Promise.all([
      yf.quote("^NSEI"),
      yf.quote("^INDIAVIX")
    ]);
    res.json({
      spot:      +spotQ.regularMarketPrice.toFixed(2),
      spotChg:   +spotQ.regularMarketChangePercent.toFixed(2),
      vix:       +vixQ.regularMarketPrice.toFixed(2),
      vixChg:    +vixQ.regularMarketChangePercent.toFixed(2),
      timestamp: new Date().toISOString()
    });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Stock Dashboard → http://localhost:${PORT}`);
});
