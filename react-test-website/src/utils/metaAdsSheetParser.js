const HEADER_ALIASES = {
  reportingStarts: ["reporting starts", "reporting start", "start date"],
  reportingEnds: ["reporting ends", "reporting end", "end date"],
  campaignName: ["campaign name", "campaign"],
  campaignId: ["campaign id", "campaign identifier"],
  campaignDelivery: ["campaign delivery", "delivery", "status"],
  campaignObjective: ["campaign objective", "objective"],
  results: ["leads", "results"],
  resultIndicator: ["result type", "result indicator", "results indicator"],
  costPerResult: [
    "cost per lead",
    "cost per leads",
    "cost per results",
    "cost per result",
    "cpl",
    "cpr",
  ],
  adSetBudget: ["ad set budget"],
  adSetBudgetType: ["ad set budget type"],
  amountSpent: ["amount spent aud", "amount spent (aud)", "amount spent", "spend"],
  impressions: ["impressions"],
  reach: ["reach"],
  frequency: ["frequency"],
  clicks: ["clicks", "all clicks"],
  linkClicks: ["link clicks", "outbound clicks"],
  ctr: ["ctr", "click through rate", "click-through rate"],
  cpc: ["cpc", "cost per click"],
  cpm: ["cpm", "cost per 1000 impressions", "cost per thousand impressions"],
  adSetId: ["ad set id", "adset id"],
  adSetName: ["ad set name", "adset name"],
  ends: ["ends"],
  attributionSetting: ["attribution setting"],
  resultsInitial: ["results initial", "results (initial)"],
  resultsInitialIndicator: [
    "results initial indicator",
    "results (initial) indicator",
  ],
  lastSynced: ["last synced", "synced at"],
};

const normaliseHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "");

const hasCellValue = (value) => String(value ?? "").trim() !== "";

const buildHeaderIndex = (headers) => {
  const normalisedHeaders = headers.map(normaliseHeader);

  return Object.entries(HEADER_ALIASES).reduce((map, [field, aliases]) => {
    const aliasSet = aliases.map(normaliseHeader);
    const index = normalisedHeaders.findIndex((header) => aliasSet.includes(header));

    if (index >= 0) {
      map[field] = index;
    }

    return map;
  }, {});
};

export const parseMetaAdsNumber = (value) => {
  if (!hasCellValue(value)) return null;

  const cleaned = String(value)
    .replace(/[$,%]/g, "")
    .replace(/,/g, "")
    .trim();
  const number = Number(cleaned);

  return Number.isFinite(number) ? number : null;
};

const parseCell = (row, headerIndex, field) => {
  const index = headerIndex[field];
  return index === undefined ? "" : String(row[index] ?? "").trim();
};

export const parseMetaAdsSheetResults = (results) => {
  const [rawHeaders = [], ...rows] = results.data || [];
  const headerIndex = buildHeaderIndex(rawHeaders);

  return rows
    .filter((row) => row.some(hasCellValue))
    .map((row, index) => {
      const amountSpent = parseMetaAdsNumber(parseCell(row, headerIndex, "amountSpent"));
      const resultsValue = parseMetaAdsNumber(parseCell(row, headerIndex, "results"));
      const costPerResult = parseMetaAdsNumber(
        parseCell(row, headerIndex, "costPerResult")
      );
      const impressions = parseMetaAdsNumber(parseCell(row, headerIndex, "impressions"));
      const reach = parseMetaAdsNumber(parseCell(row, headerIndex, "reach"));
      const reportingStarts = parseCell(row, headerIndex, "reportingStarts");
      const reportingEnds = parseCell(row, headerIndex, "reportingEnds");

      return {
        id: `${parseCell(row, headerIndex, "campaignId") || parseCell(row, headerIndex, "campaignName") || "campaign"}-${reportingStarts || index}`,
        reportingStarts,
        reportingEnds,
        date: reportingStarts,
        campaignId: parseCell(row, headerIndex, "campaignId"),
        campaignName: parseCell(row, headerIndex, "campaignName") || "Untitled Campaign",
        campaignDelivery: parseCell(row, headerIndex, "campaignDelivery"),
        campaignStatus: parseCell(row, headerIndex, "campaignDelivery"),
        campaignObjective: parseCell(row, headerIndex, "campaignObjective"),
        results: resultsValue,
        resultIndicator: parseCell(row, headerIndex, "resultIndicator"),
        costPerResult,
        amountSpent,
        impressions,
        reach,
        frequency: parseMetaAdsNumber(parseCell(row, headerIndex, "frequency")),
        clicks: parseMetaAdsNumber(parseCell(row, headerIndex, "clicks")),
        linkClicks: parseMetaAdsNumber(parseCell(row, headerIndex, "linkClicks")),
        ctr: parseMetaAdsNumber(parseCell(row, headerIndex, "ctr")),
        cpc: parseMetaAdsNumber(parseCell(row, headerIndex, "cpc")),
        cpm: parseMetaAdsNumber(parseCell(row, headerIndex, "cpm")),
        adSetId: parseCell(row, headerIndex, "adSetId"),
        adSetName: parseCell(row, headerIndex, "adSetName"),
        adSetBudget: parseMetaAdsNumber(parseCell(row, headerIndex, "adSetBudget")),
        adSetBudgetType: parseCell(row, headerIndex, "adSetBudgetType"),
        ends: parseCell(row, headerIndex, "ends"),
        attributionSetting: parseCell(row, headerIndex, "attributionSetting"),
        resultsInitial: parseMetaAdsNumber(parseCell(row, headerIndex, "resultsInitial")),
        resultsInitialIndicator: parseCell(row, headerIndex, "resultsInitialIndicator"),
        lastSynced: parseCell(row, headerIndex, "lastSynced"),
      };
    });
};
