import "server-cli-only";
import { cache } from "react";
import { PresentationRetro, PresentationStat } from "@/db/pdbmMySQL/types";
import { pdbmMySQL } from "@/db/pdbmMySQL";
import { Presentation } from "@/types/PresentationTypes";
import { PresentationDetail } from "../types";
import db from "..";

export const getPresentations = cache(
  async (CIS: string): Promise<Presentation[]> => {
    return db
      .selectFrom("ansm_presentation")
      .where("cis", "=", CIS)
      .where("statut_commercialisation", "not in", ["RETIREE", "SUSPENDUE", "NON_COMMUNIQUEE"])
      .selectAll()
      .orderBy("cip")
      .execute();
  },
);

export const getPresentationsDetails = cache(
  async (
    codeCIP13List: string[]
  ): Promise<PresentationDetail[]> => {
    const presentationsDetails = 
      codeCIP13List.length
      ? await db
        .selectFrom("presentations")
        .selectAll()
        .where(
          "presentations.codecip13",
          "in",
          codeCIP13List,
        )
        .distinct()
        .execute()
      : [];
    return presentationsDetails;
  }
);

export const getPresentationsRetro = cache(
  async (
    codeCIP13List: string[]
  ): Promise<PresentationRetro[]> => {
    const presentationsRetro = 
      codeCIP13List.length
      ? await pdbmMySQL
        .selectFrom("CNAM_Retro")
        .selectAll()
        .where(
          "CNAM_Retro.Cip13",
          "in",
          codeCIP13List,
        )
        .distinct()
        .execute()
      : [];
    return presentationsRetro;
  }
);

export const getFullPresentations = cache(
  async (
    CIS: string,
  ): Promise<Presentation[]> => {
    const presentations: Presentation[] = await getPresentations(CIS);
    const codesCIP13: string[] = presentations.map((p) => p.cip);
    const presentationsDetails: PresentationDetail[] = await getPresentationsDetails(codesCIP13);
    const presentationsRetro: PresentationRetro[] = await getPresentationsRetro(codesCIP13);
    const abrogeeCips: Set<string> = codesCIP13.length
      ? await pdbmMySQL
          .selectFrom("Presentation")
          .where("codeCIP13", "in", codesCIP13)
          .where("StatId", "=", PresentationStat.Abrogation)
          .select("codeCIP13")
          .execute()
          .then((rows) => new Set(rows.map((r) => r.codeCIP13.trim())))
      : new Set();

    presentations.forEach((p) => {
      const details = presentationsDetails.filter(
        (d) => d.codecip13.trim() === p.cip.trim(),
      );
      p.details = details;
      const retro = presentationsRetro.filter(
        (r) => r.Cip13.trim() === p.cip.trim(),
      );
      if (retro.length > 0) {
        //Only one per presentation
        p.retro = retro[0];
      }
      if (abrogeeCips.has(p.cip.trim())) {
        p.abrogee = true;
      }
    });

    return presentations;
  }
);
