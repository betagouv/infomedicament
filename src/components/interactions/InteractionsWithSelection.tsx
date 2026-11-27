import { cache } from "react";
import InteractionsBlock from "./InteractionsBlock";
import {
  getInteractionSelection,
  lookupInteractions,
} from "@/db/utils/interactions";
import { interactionsTitle } from "@/utils/interactionSelection";

export type InteractionsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const getSelection = cache(
  async (searchParams: InteractionsPageProps["searchParams"]) => {
    const params = await searchParams;
    const [slot1, slot2] = await Promise.all([
      getInteractionSelection(params.medicament1),
      getInteractionSelection(params.medicament2),
    ]);
    return { params, slot1, slot2 };
  },
);

export async function interactionsMetadata({
  searchParams,
}: InteractionsPageProps) {
  const { slot1, slot2 } = await getSelection(searchParams);
  return { title: interactionsTitle(slot1, slot2) };
}

export default async function InteractionsWithSelection({
  searchParams,
}: InteractionsPageProps) {
  const { params, slot1, slot2 } = await getSelection(searchParams);
  const results =
    params.verifier === "1" && slot1 && slot2
      ? await lookupInteractions(
          slot1.subst_ids,
          slot1.class_ids,
          slot2.subst_ids,
          slot2.class_ids,
        )
      : null;
  return <InteractionsBlock slot1={slot1} slot2={slot2} results={results} />;
}
