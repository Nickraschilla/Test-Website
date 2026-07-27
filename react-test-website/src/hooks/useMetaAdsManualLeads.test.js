import { renderHook, waitFor } from "@testing-library/react";
import Papa from "papaparse";
import { useMetaAdsManualLeads } from "./useMetaAdsManualLeads";

jest.mock("papaparse", () => ({
  parse: jest.fn(),
}));

const leadResults = (leadName = "Alex Smith") => ({
  data: [
    [
      "Campaign ID",
      "Campaign Name",
      "Lead Name",
      "Position",
      "Club",
      "League",
      "Contacted",
      "Converted",
    ],
    ["cmp_active", "Campaign", leadName, "President", "Example FC", "EDFL", "Yes", "No"],
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

test("loads Meta Ads lead pipeline rows from the published sheet", async () => {
  Papa.parse.mockImplementation((url, options) => {
    options.complete(leadResults());
  });

  const { result } = renderHook(() => useMetaAdsManualLeads());

  await waitFor(() => expect(result.current.loading).toBe(false));

  expect(result.current.error).toBe("");
  expect(result.current.leads).toHaveLength(1);
  expect(result.current.leads[0]).toMatchObject({
    campaignId: "cmp_active",
    name: "Alex Smith",
    status: "Contacted",
  });
});

test("refresh failure preserves last successful lead rows", async () => {
  Papa.parse
    .mockImplementationOnce((url, options) => {
      options.complete(leadResults("First Lead"));
    })
    .mockImplementationOnce((url, options) => {
      options.error(new Error("refresh failed"));
    });

  const { result } = renderHook(() => useMetaAdsManualLeads());

  await waitFor(() => expect(result.current.leads).toHaveLength(1));
  document.dispatchEvent(new Event("visibilitychange"));

  await waitFor(() =>
    expect(result.current.error).toBe("Could not load Meta Ads lead pipeline data.")
  );

  expect(result.current.leads[0].name).toBe("First Lead");
});
