import { describe, it, expect } from "vitest";

import { getVideosFromCIS } from "./videos";

describe("getVideosFromCIS", () => {
  it("returns the video for a CIS", async () => {
    //PARACETAMOL VIATRIS 500 mg, comprimé
    const videos = await getVideosFromCIS("63107752");

    expect(videos).toHaveLength(1);
    expect(videos[0]).toMatchObject({
      id: 2,
      title: "Le bon usage du paracétamol",
      url: "https://www.youtube.com/embed/Xl0FNeP0UK4?si=Ez3RIFSZTbTiUqXE",
    });
  });

  it("returns an empty array for a CIS with no linked video", async () => {
    //FAMOTIDINE EG 20 mg, comprimé pelliculé
    const videos = await getVideosFromCIS("60005856"); 
    expect(videos).toEqual([]);
  });
});
