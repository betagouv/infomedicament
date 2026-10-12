"use client";

import { HTMLAttributes } from "react";
import styled from "styled-components";
import { AnsmVideos } from "@/db/types";
import { fr } from "@codegouvfr/react-dsfr";

const VideoTitle = styled.h2`
  margin-bottom: 0.5rem;
  @media (max-width: 48em) {
    margin-bottom: 1rem;
  }
`;

interface VideosBlockProps extends HTMLAttributes<HTMLDivElement> {
  videos: AnsmVideos[];
}

export function VideosBlock({
  videos, 
  ...props
}: VideosBlockProps) {


  return (
    <div {...props}>
      <VideoTitle className={fr.cx("fr-h6", "fr-mb-1w")}>
        Vidéo{videos.length > 1 && 's'} de bon usage
      </VideoTitle>
      {videos.map((video, index) => (
        <iframe 
          key={index} 
          src={video.url} 
          title={video.title}
          width="100%"
          height="250px"
          allowFullScreen
        />
      ))}
    </div>
  );
}
