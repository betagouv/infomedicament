"use client";

import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { fr } from "@codegouvfr/react-dsfr";
import { prDsfrLoaded } from "@codegouvfr/react-dsfr/start";
import { useEffect } from "react";

const storageKey = "greetingModal";
const reminderInterval = 1000 * 60 * 60 * 24 * 30;
const modal = createModal({ isOpenedByDefault: false, id: "GreetingModal" });

function getLastShown() {
  try {
    const value = JSON.parse(window.localStorage.getItem(storageKey) ?? "0");
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

export default function GreetingModal({ dataLastUpdated }: { dataLastUpdated: Date | null }) {
  useEffect(() => {
    let active = true;
    void prDsfrLoaded.then(() => {
      // Read storage after initialization, so an acceptance made while loading wins.
      if (active && Date.now() - getLastShown() > reminderInterval) modal.open();
    });
    return () => { active = false; };
  }, []);

  return (
    <modal.Component
      title={"Bienvenue sur Info Médicament"}
      buttons={[
        {
          children: "Accepter et entrer sur le site",
          onClick: () => {
            try {
              window.localStorage.setItem(storageKey, JSON.stringify(Date.now()));
            } catch (error) {
              console.warn("Unable to save the greeting acceptance timestamp", error);
            }
            modal.close();
          },
        },
      ]}
    >
      <p>
        Ce site est actuellement en version bêta. Il est en train d’être conçu
        pour vous offrir des informations claires et fiables sur les
        médicaments, mais il reste en cours de développement.
      </p>
      <p className={fr.cx("fr-text--bold")}>🔎 Important à savoir&nbsp;:</p>
      <ul>
        <li>
          Les informations présentées, bien que vérifiées, peuvent contenir des
          erreurs. N’hésitez pas à nous signaler tout problème.
        </li>
        <li>
          Ce site ne se substitue pas à la{" "}
          <a href="https://base-donnees-publique.medicaments.gouv.fr/">
            Base de Données Publique des Médicaments.
          </a>
        </li>
        {dataLastUpdated && <li>Les données datent de {dataLastUpdated.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}.</li>}
      </ul>
      <p>
        Pour nous aider à l’améliorer, pensez à <b>activer les cookies</b>
        &nbsp;: cela nous permettra de vous poser des questions ciblées pendant
        votre navigation et de recueillir votre avis.
      </p>
      <p>
        Merci pour votre compréhension et votre contribution à ce projet en
        devenir. Vos retours nous sont précieux !
      </p>
      <p>
        En entrant, je déclare avoir bien compris et ne prendrai pas de décision
        médicale suite à la consultation de ce site.
      </p>
    </modal.Component>
  );
}
