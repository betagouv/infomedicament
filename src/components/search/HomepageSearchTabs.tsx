"use client";

import { useState } from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import AutocompleteSearch from "@/components/search/autocomplete/AutocompleteSearch";
import QuestionSearchForm from "@/components/search/QuestionSearchForm";

export default function HomepageSearchTabs() {
  const [selectedTabId, setSelectedTabId] = useState("search");

  return (
    <Tabs
      label="Type de recherche"
      selectedTabId={selectedTabId}
      onTabChange={setSelectedTabId}
      tabs={[
        {
          tabId: "search",
          label: "Rechercher",
        },
        {
          tabId: "question",
          label: "Poser une question",
        },
      ]}
    >
      {selectedTabId === "search" ? (
        <>
          <AutocompleteSearch inputName="s" />
          <p className={fr.cx("fr-text--sm", "fr-mb-0")}>
            Cherchez un <strong>médicament</strong>, une{" "}
            <strong>substance active</strong> (ex : paracétamol), une{" "}
            <strong>indication</strong> (ex : diabète), ou une{" "}
            <strong>classe de médicaments</strong> (ex : antibiotiques).
          </p>
        </>
      ) : (
        <>
          <p className={fr.cx("fr-text--sm", "fr-mt-0", "fr-mb-2w")}>
            Posez une question en langage courant. La réponse sera recherchée
            dans la notice officielle du médicament.
          </p>
          <QuestionSearchForm
            showExamples
            label="Que souhaitez-vous savoir ?"
          />
        </>
      )}
    </Tabs>
  );
}
