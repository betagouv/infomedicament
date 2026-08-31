"use server";

import db from "..";
import { AnsmVideos } from "../types";


export async function getVideosFromCIS(CIS: string): Promise<AnsmVideos[]> {
  const videos = await db
    .selectFrom('ansm_videos_cis')
    .innerJoin('ansm_videos', 'ansm_videos.id', "ansm_videos_cis.id_video")
    .where('ansm_videos_cis.CIS', '=', CIS)
    .selectAll('ansm_videos')
    .execute();

  return videos;
};

