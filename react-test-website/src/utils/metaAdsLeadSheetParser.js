const HEADER_ALIASES = {
  campaignId: ["campaign id", "campaign identifier"],
  campaignName: ["campaign name", "campaign"],
  name: ["lead name", "name"],
  position: ["position", "role"],
  club: ["club"],
  league: ["league"],
  contacted: ["contacted"],
  converted: ["converted"],
  status: ["status"],
  dateReceived: ["date received", "date", "lead date"],
  notes: ["notes", "note"],
  lastUpdated: ["last updated", "updated"],
};

const normaliseHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "");

const normaliseText = (value) => String(value ?? "").trim();

const hasCellValue = (value) => normaliseText(value) !== "";

const buildHeaderIndex = (headers) => {
  const normalisedHeaders = headers.map(normaliseHeader);

  return Object.entries(HEADER_ALIASES).reduce((map, [field, aliases]) => {
    const aliasSet = aliases.map(normaliseHeader);
    const index = normalisedHeaders.findIndex((header) => aliasSet.includes(header));
    if (index >= 0) map[field] = index;
    return map;
  }, {});
};

const parseCell = (row, headerIndex, field) => {
  const index = headerIndex[field];
  return index === undefined ? "" : normaliseText(row[index]);
};

const isYes = (value) => /^(yes|y|true|1|converted|contacted)$/i.test(normaliseText(value));

const deriveStatus = ({ contacted, converted, status }) => {
  const statusText = normaliseText(status);
  if (/failed/i.test(statusText)) return "Failed";
  if (/converted/i.test(statusText) || isYes(converted)) return "Converted";
  if (/contacted/i.test(statusText) || isYes(contacted)) return "Contacted";
  return "New";
};

export const parseMetaAdsLeadSheetResults = (results) => {
  const [rawHeaders = [], ...rows] = results.data || [];
  const headerIndex = buildHeaderIndex(rawHeaders);

  return rows
    .filter((row) => row.some(hasCellValue))
    .map((row, index) => {
      const campaignId = parseCell(row, headerIndex, "campaignId");
      const campaignName = parseCell(row, headerIndex, "campaignName");
      const name = parseCell(row, headerIndex, "name");
      const contacted = parseCell(row, headerIndex, "contacted");
      const converted = parseCell(row, headerIndex, "converted");
      const status = deriveStatus({
        contacted,
        converted,
        status: parseCell(row, headerIndex, "status"),
      });

      return {
        id: `${campaignId || campaignName || "campaign"}-${name || "lead"}-${index}`,
        campaignId,
        campaignName,
        name: name || "Unnamed lead",
        position: parseCell(row, headerIndex, "position"),
        club: parseCell(row, headerIndex, "club"),
        league: parseCell(row, headerIndex, "league"),
        contacted: isYes(contacted),
        converted: isYes(converted),
        status,
        dateReceived: parseCell(row, headerIndex, "dateReceived"),
        notes: parseCell(row, headerIndex, "notes"),
        lastUpdated: parseCell(row, headerIndex, "lastUpdated"),
      };
    });
};
