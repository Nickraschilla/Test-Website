import { renderHook, waitFor } from "@testing-library/react";
import Papa from "papaparse";
import { useMetaAdsData } from "./useMetaAdsData";

jest.mock("papaparse", () => ({
  parse: jest.fn(),
}));

const HEADERS = [
  "Reporting starts",
  "Reporting ends",
  "Campaign name",
  "Campaign ID",
  "Campaign delivery",
  "Results",
  "Result indicator",
  "Cost per results",
  "Ad Set Budget",
  "Ad Set Budget Type",
  "Amount spent (AUD)",
  "Impressions",
  "Reach",
  "Ends",
  "Attribution Setting",
  "Results (Initial)",
  "Results (Initial) Indicator",
  "Frequency",
  "Last synced",
];

const liveResults = (campaignName = "Live Campaign", leads = "4") => ({
  data: [
    HEADERS,
    [
      "2026-07-01",
      "2026-07-01",
      campaignName,
      "cmp_live",
      "ACTIVE",
      leads,
      "Leads",
      "$25.00",
      "",
      "",
      "$100.00",
      "1,000",
      "800",
      "",
      "7-day click",
      "",
      "",
      "1.25",
      "2026-07-27",
    ],
  ],
  errors: [],
});

beforeEach(() => {
  Papa.parse.mockReset();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("initial live fetch failure produces no fake rows", async () => {
  Papa.parse.mockImplementation((url, options) => {
    options.error(new Error("network failed"));
  });

  const { result } = renderHook(() => useMetaAdsData());

  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.rows).toEqual([]);
  expect(result.current.usingFallback).toBe(false);
  expect(result.current.error).toBe("Could not load Meta Ads Reporting data.");
});

test("refresh failure preserves the last successful live rows", async () => {
  Papa.parse
    .mockImplementationOnce((url, options) => {
      options.complete(liveResults("Live Campaign", "4"));
    })
    .mockImplementationOnce((url, options) => {
      options.error(new Error("refresh failed"));
    });

  const { result } = renderHook(() => useMetaAdsData());

  await waitFor(() => expect(result.current.rows).toHaveLength(1));
  expect(result.current.rows[0].campaignName).toBe("Live Campaign");

  document.dispatchEvent(new Event("visibilitychange"));

  await waitFor(() =>
    expect(result.current.error).toBe("Could not load Meta Ads Reporting data.")
  );

  expect(result.current.rows).toHaveLength(1);
  expect(result.current.rows[0].campaignName).toBe("Live Campaign");
  expect(result.current.usingFallback).toBe(false);
});

test("successful later refresh clears the error", async () => {
  Papa.parse
    .mockImplementationOnce((url, options) => {
      options.error(new Error("initial failed"));
    })
    .mockImplementationOnce((url, options) => {
      options.complete(liveResults("Recovered Campaign", "7"));
    });

  const { result } = renderHook(() => useMetaAdsData());

  await waitFor(() =>
    expect(result.current.error).toBe("Could not load Meta Ads Reporting data.")
  );

  document.dispatchEvent(new Event("visibilitychange"));

  await waitFor(() => expect(result.current.error).toBe(""));
  expect(result.current.rows).toHaveLength(1);
  expect(result.current.rows[0].campaignName).toBe("Recovered Campaign");
});

test("fixture data cannot appear in production failure handling", async () => {
  Papa.parse.mockImplementation((url, options) => {
    options.complete({
      data: [HEADERS, ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]],
      errors: [{ message: "parse failed" }],
    });
  });

  const { result } = renderHook(() => useMetaAdsData());

  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.rows).toEqual([]);
  expect(result.current.usingFallback).toBe(false);
  expect(result.current.rows.some((row) => /fixture|demo/i.test(row.campaignName))).toBe(false);
});
