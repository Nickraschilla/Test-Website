import { parseMetaAdsLeadSheetResults } from "./metaAdsLeadSheetParser";

test("parses lead pipeline sheet rows and derives status from contacted and converted", () => {
  const leads = parseMetaAdsLeadSheetResults({
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
      [
        "cmp_active",
        "Meta Test Campaign",
        "Alex Smith",
        "President",
        "Example FC",
        "EDFL",
        "Yes",
        "No",
      ],
      [
        "cmp_active",
        "Meta Test Campaign",
        "Jordan Lee",
        "Secretary",
        "Example FC",
        "EDFL",
        "Yes",
        "Yes",
      ],
      ["", "", "", "", "", "", "", ""],
    ],
  });

  expect(leads).toHaveLength(2);
  expect(leads[0]).toMatchObject({
    campaignId: "cmp_active",
    name: "Alex Smith",
    position: "President",
    contacted: true,
    converted: false,
    status: "Contacted",
  });
  expect(leads[1]).toMatchObject({
    name: "Jordan Lee",
    converted: true,
    status: "Converted",
  });
});
