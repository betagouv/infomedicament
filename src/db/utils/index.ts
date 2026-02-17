import "server-cli-only";
import db from "@/db/index";
import { NoResultError } from "kysely";

export {
  getSpecialite,
} from "./specialities";
export { getPresentations, presentationIsComm } from "./presentation";
export { getSearchResults } from "./search";
export { groupGeneNameToDCI } from "@/displayUtils";

export const getLeafletImage = async ({ src }: { src: string }) => {
  src = src.replace("../images/", "");

  const extension = src.split(".").pop();
  try {
    const { image } = await db
      .selectFrom("leaflet_images")
      .where("path", "=", src)
      .select("image")
      .executeTakeFirstOrThrow();
    return `data:image/${extension};base64,${image.toString("base64")}`;
  } catch (e) {
    if (e instanceof NoResultError) {
      console.warn("Image not found in database:", src);
      return;
    }

    throw e;
  }
};

