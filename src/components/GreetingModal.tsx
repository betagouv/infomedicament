import { createModal } from "@codegouvfr/react-dsfr/Modal";
import { fr } from "@codegouvfr/react-dsfr";

export default function GreetingModal() {
  const modal = createModal({
    isOpenedByDefault: true,
    id: "GreetingModal",
  });

  return (
    <modal.Component
      title={"Bienvenue sur Info Médicament"}
      buttons={[
        { children: "Accepter et entrer sur le site", doClosesModal: true },
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
          Cette version repose sur une base de 500 médicaments uniquement, qui
          sera enrichie progressivement.
        </li>
        <li>
          Les informations présentées, bien que vérifiées, peuvent contenir des
          erreurs. N’hésitez pas à nous signaler tout problème.
        </li>
        <li>
          Ce site ne se substitue pas à la Base de Données Publique des
          Médicaments.
        </li>
        <li>Les données datent de juillet 2024.</li>
      </ul>
    </modal.Component>
  );
}
