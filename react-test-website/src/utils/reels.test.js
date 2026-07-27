import {
  applyPlatformMetrics,
  getClipPresentation,
  getScoreLiveDays,
  sortReels,
  toNumber,
} from "./reels";

test("toNumber handles commas, blanks, and numeric zero", () => {
  expect(toNumber("1,234")).toBe(1234);
  expect(toNumber("")).toBe(0);
  expect(toNumber(0)).toBe(0);
});

test("applyPlatformMetrics can combine multiple selected platforms", () => {
  const reel = {
    views: 100,
    likes: 10,
    comments: 3,
    reshares: 2,
    saves: 1,
    igViews: 40,
    igLikes: 4,
    igComments: 1,
    igShares: 1,
    igSaves: 0,
    fbViews: 30,
    fbLikes: 3,
    fbComments: 1,
    fbShares: 1,
    fbSaves: 1,
    ttViews: 20,
    ttLikes: 2,
    ttComments: 1,
    ttShares: 0,
    ttSaves: 1,
  };

  expect(applyPlatformMetrics(reel, ["instagram", "facebook"])).toMatchObject({
    views: 70,
    likes: 7,
    comments: 2,
    reshares: 2,
    saves: 1,
  });
  expect(applyPlatformMetrics(reel, [])).toMatchObject({
    views: 100,
    likes: 10,
    comments: 3,
    reshares: 2,
    saves: 1,
  });
});

test("getScoreLiveDays enforces the minimum live-day divisor", () => {
  expect(
    getScoreLiveDays(
      { publishedAt: "2026-07-25T00:00:00.000Z" },
      new Date("2026-07-27T00:00:00.000Z")
    )
  ).toBe(5);
});

test("sortReels sorts numeric and text fields without mutating input", () => {
  const reels = [
    { name: "B", views: 10 },
    { name: "A", views: 20 },
  ];

  expect(sortReels(reels, "views", false).map((reel) => reel.views)).toEqual([20, 10]);
  expect(sortReels(reels, "name", true).map((reel) => reel.name)).toEqual(["A", "B"]);
  expect(reels.map((reel) => reel.name)).toEqual(["B", "A"]);
});

test("getClipPresentation recognises Instagram and Google Drive links", () => {
  expect(getClipPresentation("https://www.instagram.com/reel/ABC123/")).toMatchObject({
    type: "iframe",
    src: "https://www.instagram.com/reel/ABC123/embed",
  });
  expect(
    getClipPresentation("https://drive.google.com/file/d/FILE_ID/view")
  ).toMatchObject({
    type: "drive",
    src: "https://drive.google.com/uc?export=download&id=FILE_ID",
    fallbackSrc: "https://drive.google.com/file/d/FILE_ID/preview",
  });
});
