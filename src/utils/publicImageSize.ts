import "server-only";
import path from "path";
import { imageSize } from "image-size";

export type ImageSize = { width: number, height: number };

// Size of an image of the public folder (e.g. "/img/article_covers/01.webp"), undefined if not readable
export function getPublicImageSize(publicPath: string): ImageSize | undefined {
  try {
    const { width, height } = imageSize(path.join(process.cwd(), "public", publicPath));
    return width && height ? { width, height } : undefined;
  } catch {
    return undefined;
  }
}
