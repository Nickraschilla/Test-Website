import { parseSheetResults } from "./useReelsData";

const HEADERS = [
  "name",
  "reelName",
  "clipUrl",
  "igMediaId",
  "igViews",
  "igLikes",
  "igComments",
  "igShares",
  "igSaves",
  "lastSyncedAt",
  "fbViews",
  "fbLikes",
  "fbComments",
  "fbShares",
  "fbSaves",
  "ttViews",
  "ttLikes",
  "ttComments",
  "ttShares",
  "ttSaves",
  "publishedAt",
  "totalViews",
  "totalLikes",
  "totalComments",
  "totalShares",
  "totalSaves",
];

const makeRow = (overrides = {}) =>
  HEADERS.map((header) => overrides[header] ?? "");

test("parseSheetResults preserves explicit zero totals", () => {
  const [row] = parseSheetResults({
    data: [
      HEADERS,
      makeRow({
        name: "Premier Data",
        reelName: "Zero total",
        igViews: "12",
        totalViews: "0",
      }),
    ],
  });

  expect(row.views).toBe(0);
});

test("parseSheetResults falls back to platform totals when total cells are blank", () => {
  const [row] = parseSheetResults({
    data: [
      HEADERS,
      makeRow({
        name: "Premier Data",
        reelName: "Combined total",
        igViews: "12",
        fbViews: "3",
        ttViews: "5",
        igLikes: "4",
        fbLikes: "1",
        ttLikes: "2",
      }),
    ],
  });

  expect(row.views).toBe(20);
  expect(row.likes).toBe(7);
});

test("parseSheetResults ignores fully empty rows", () => {
  expect(parseSheetResults({ data: [HEADERS, makeRow()] })).toEqual([]);
});
