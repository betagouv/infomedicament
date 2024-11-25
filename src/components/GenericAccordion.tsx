import Accordion from "@codegouvfr/react-dsfr/Accordion";
import React from "react";

export default function GenericAccordion({
  className,
}: {
  className?: string;
}) {
  return (
    <Accordion
      label={"Princeps et générique, qu’est-ce que c’est ?"}
      titleAs={"h2"}
      className={className}
    >
      <p>
        Un médicament <b>générique</b> est fabriqué à partir de la même molécule
        qu&apos;un médicament déjà autorisé, dit médicament de référence ou{" "}
        <b>princeps</b>. Le générique contient strictement la même quantité de
        la même substance active que son princeps et est équivalent sur le plan
        médical.
      </p>
      <p>
        Le médicament de référence et les médicaments qui en sont génériques
        constituent un <b>groupe générique</b>.
      </p>
      <p>
        Sauf sur recommandation spécifique d&apos;un médecin, un médicament
        générique peut être substitué par votre pharmacien·ne à un médicament de
        référence.
      </p>
    </Accordion>
  );
}
