import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Breadcrumb from "@codegouvfr/react-dsfr/Breadcrumb";
import { fr } from "@codegouvfr/react-dsfr";
import ContentContainer from "@/components/generic/ContentContainer";
import {
  ANSM_DATASET_URL,
  ANSM_RESOURCE_BASE,
  HAS_DATASET_URL,
  HAS_RESOURCE_BASE,
  ansmResources,
  hasResources,
} from "./sources";
import styles from "./page.module.scss";

const title = "Réutiliser les données : migrer depuis la BDPM";

export const metadata: Metadata = {
  title: `${title} | Info Médicament`,
  description:
    "Retrouvez les sources ANSM et HAS, les correspondances avec les anciens fichiers BDPM et les données encore en cours de publication.",
};

function AnsmResource({ name }: { name: keyof typeof ansmResources }) {
  const resource = ansmResources[name];
  return (
    <>
      <a href={`${ANSM_RESOURCE_BASE}${resource.id}`}>
        <code>{name}</code>
      </a>
      {resource.schemaId ? (
        <>
          {" "}
          —{" "}
          <a href={`${ANSM_RESOURCE_BASE}${resource.schemaId}`}>
            schéma de {name}
          </a>
        </>
      ) : null}
    </>
  );
}

type Mapping = {
  file: string;
  label: string;
  status:
    | "Sources disponibles"
    | "Correspondance partielle"
    | "Correspondance à confirmer"
    | "Remplacement non identifié";
  sources: ReactNode;
  details: string;
};

const mappings: Mapping[] = [
  {
    file: "CIS_bdpm.txt",
    label: "Spécialités",
    status: "Correspondance partielle",
    sources: (
      <ul>
        <li>
          <AnsmResource name="specialite" />
        </li>
        <li>
          <AnsmResource name="specialite_titulaire" />
        </li>
        <li>
          <AnsmResource name="specialite_evenement" />
        </li>
        <li>
          <AnsmResource name="document" />
        </li>
      </ul>
    ),
    details:
      "Le catalogue et les titulaires sont répartis entre plusieurs tables, reliées par le code CIS. La reprise de chaque ancien champ, notamment la forme pharmaceutique, les voies d’administration et la surveillance renforcée, reste à documenter. Le nouveau fichier specialite ne remplace pas à lui seul toutes les colonnes de CIS_bdpm.",
  },
  {
    file: "CIS_CIP_bdpm.txt",
    label: "Présentations, prix et remboursement",
    status: "Correspondance partielle",
    sources: (
      <ul>
        <li>
          <AnsmResource name="presentation" />
        </li>
        <li>
          <a href="#donnees-manquantes">Prix : publication en cours</a>
        </li>
      </ul>
    ),
    details:
      "La ressource presentation fournit les codes CIS, CIP et CIP7, la dénomination et les statuts et dates de commercialisation. Les prix ne sont pas encore disponibles dans le nouveau dispositif. Les sources de remplacement pour le taux et les indications de remboursement ainsi que l’agrément aux collectivités restent à confirmer.",
  },
  {
    file: "CIS_COMPO_bdpm.txt",
    label: "Compositions",
    status: "Sources disponibles",
    sources: (
      <ul>
        <li>
          <AnsmResource name="element" />
        </li>
        <li>
          <AnsmResource name="composant" />
        </li>
        <li>
          <AnsmResource name="substance_nom" />
        </li>
      </ul>
    ),
    details:
      "Les éléments pharmaceutiques et leurs composants sont séparés. Reliez element et composant par cis et numero_element. Les composants décrivent notamment la substance, sa nature et son dosage. Adaptez votre modèle : les anciennes colonnes de référence du dosage et de liaison SA/FT n’ont pas de correspondance directe documentée dans ce guide.",
  },
  {
    file: "CIS_HAS_SMR_bdpm.txt",
    label: "Avis SMR",
    status: "Sources disponibles",
    sources: (
      <a href={`${HAS_RESOURCE_BASE}${hasResources.smr}`}>
        Télécharger les évaluations SMR de la HAS
      </a>
    ),
    details:
      "Utilisez le CSV publié directement par la HAS. Il contient les identifiants de dossier, les codes CIS et CIP, le motif de demande, la date de l’avis et les informations de SMR. Consultez sa documentation pour adapter les colonnes et les jointures.",
  },
  {
    file: "CIS_HAS_ASMR_bdpm.txt",
    label: "Avis ASMR",
    status: "Sources disponibles",
    sources: (
      <a href={`${HAS_RESOURCE_BASE}${hasResources.asmr}`}>
        Télécharger les évaluations ASMR de la HAS
      </a>
    ),
    details:
      "Utilisez le CSV ASMR de la HAS, avec ses identifiants de dossier, codes CIS et CIP, motifs de demande, dates d’avis et informations d’ASMR. Son organisation diffère de l’ancien export BDPM.",
  },
  {
    file: "HAS_LiensPageCT_bdpm.txt",
    label: "Liens vers les avis de la commission de la transparence",
    status: "Sources disponibles",
    sources: (
      <a href={`${HAS_RESOURCE_BASE}${hasResources.avis}`}>
        Télécharger les liens vers les avis HAS
      </a>
    ),
    details:
      "La HAS publie un fichier de liens vers les pages d’avis. Le rapprochement avec les évaluations utilise l’identifiant de dossier HAS ; vérifiez dans la documentation la correspondance avec les codes EVAMED et CT. Ne faites pas cette jointure uniquement sur le code CIS.",
  },
  {
    file: "CIS_GENER_bdpm.txt",
    label: "Groupes génériques",
    status: "Sources disponibles",
    sources: (
      <ul>
        <li>
          <AnsmResource name="groupe_generique" />
        </li>
        <li>
          <AnsmResource name="specialite_groupe_generique" />
        </li>
      </ul>
    ),
    details:
      "Le groupe et ses spécialités sont séparés. Reliez les deux ressources par code_groupe, puis retrouvez la spécialité par cis. Le rôle et le rang sont portés par specialite_groupe_generique. Vérifiez les valeurs du rôle avant de remplacer les anciens types numériques de générique.",
  },
  {
    file: "CIS_CPD_bdpm.txt",
    label: "Conditions de prescription et de délivrance",
    status: "Sources disponibles",
    sources: (
      <ul>
        <li>
          <AnsmResource name="specialite_delivrance" />
        </li>
        <li>
          <AnsmResource name="delivrance" />
        </li>
      </ul>
    ),
    details:
      "La relation entre une spécialité et ses conditions est séparée du référentiel des libellés. Reliez les ressources par code_delivrance et code, puis la spécialité par cis. Une spécialité peut avoir plusieurs conditions.",
  },
  {
    file: "CIS_CIP_Dispo_Spec.txt",
    label: "Ruptures de stocks",
    status: "Correspondance à confirmer",
    sources: (
      <ul>
        <li>
          <AnsmResource name="presentation_evenement" />
        </li>
        <li>
          <AnsmResource name="specialite_evenement" />
        </li>
      </ul>
    ),
    details:
      "Les ressources d’événements sont des pistes pour retrouver les informations de disponibilité. Leur équivalence avec l’ancien fichier de ruptures n’est pas encore validée : codes de statut, dates de remise à disposition et liens ANSM doivent être vérifiés. Ne considérez pas l’absence d’un événement comme une preuve de disponibilité.",
  },
  {
    file: "CIS_MITM.txt",
    label: "Médicaments d’intérêt thérapeutique majeur",
    status: "Remplacement non identifié",
    sources: (
      <a href="#donnees-manquantes">Correspondance en cours de recherche</a>
    ),
    details:
      "Ce guide ne fournit pas encore de ressource validée pour remplacer la liste des MITM. La présence d’une spécialité dans le catalogue ANSM ne permet pas, à elle seule, d’en déduire son statut MITM.",
  },
  {
    file: "CIS_InfoImportantes_AAAAMMJJhhmiss_bdpm.txt",
    label: "Informations importantes",
    status: "Correspondance à confirmer",
    sources: <AnsmResource name="specialite_evenement" />,
    details:
      "Les événements de spécialité sont une piste, mais la correspondance des types, des périodes de validité, des textes et des liens reste à valider. L’ancien export était généré à la demande : ne supposez pas que la nouvelle ressource a la même fraîcheur ou le même périmètre.",
  },
];

export default function Page() {
  return (
    <ContentContainer frContainer>
      <Breadcrumb
        segments={[{ label: "Accueil", linkProps: { href: "/" } }]}
        currentPageLabel="Réutiliser les données"
      />
      <article className={styles.article}>
        <h1>{title}</h1>
        <p className={fr.cx("fr-text--lead")}>
          Vous utilisez les fichiers téléchargeables de la Base de données
          publique des médicaments (BDPM) ? Sa fermeture est prévue dans les
          prochains mois. Ce guide vous aide à préparer la migration vers les
          sources de données utilisées par Info Médicament.
        </p>
        <p className={fr.cx("fr-text--sm")}>
          État du guide au 30 septembre 2026.
        </p>
        <nav aria-label="Sommaire du guide">
          <ul>
            <li>
              <a href="#ce-qui-change">Ce qui change</a>
            </li>
            <li>
              <a href="#sources">Où télécharger les données</a>
            </li>
            <li>
              <a href="#correspondances">
                Retrouver chaque ancien fichier BDPM
              </a>
            </li>
            <li>
              <a href="#migration">Adapter vos imports</a>
            </li>
            <li>
              <a href="#donnees-manquantes">
                Données manquantes et travaux en cours
              </a>
            </li>
            <li>
              <a href="#contenus-editoriaux">
                Les contenus complémentaires du site
              </a>
            </li>
          </ul>
        </nav>

        <section id="ce-qui-change" aria-labelledby="titre-changement">
          <h2 id="titre-changement">Ce qui change</h2>
          <p>
            L’ancienne BDPM s’appuyait sur une base interne à l’ANSM, alimentée
            par plusieurs organismes. Une partie de ses données était exposée
            sous forme de fichiers librement téléchargeables sur la{" "}
            <a href="https://base-donnees-publique.medicaments.gouv.fr/telechargement">
              page de téléchargement de la BDPM
            </a>
            . Ces exports rassemblaient des informations de différentes sources
            dans un format propre à la BDPM.
          </p>
          <p>
            Info Médicament utilise désormais des données ouvertes publiées par
            leurs producteurs, principalement l’ANSM et la Haute Autorité de
            santé (HAS). Pour alimenter votre application, vous pouvez
            télécharger ces mêmes sources. La fermeture de l’ancien site
            nécessite d’adapter vos téléchargements, vos imports et les liens
            entre vos données.
          </p>
          <p>
            Il ne suffit donc pas de remplacer une URL : un ancien fichier peut
            correspondre à plusieurs nouvelles ressources, et certains champs ne
            disposent pas encore d’un remplacement validé.
          </p>
        </section>

        <section id="sources" aria-labelledby="titre-sources">
          <h2 id="titre-sources">Où télécharger les données</h2>
          <h3>ANSM : le catalogue et les données réglementaires</h3>
          <p>
            Le jeu{" "}
            <a href={ANSM_DATASET_URL}>ANSM Open Data sur data.gouv.fr</a>{" "}
            propose notamment les spécialités, leurs titulaires, les
            présentations, les compositions et substances, les groupes
            génériques, les conditions de délivrance, les événements et les
            liens vers les documents. Il comprend aussi des ressources de
            classification ATC, de classes cliniques, de pathologies et
            d’interactions médicamenteuses.
          </p>
          <p>
            Chaque table est proposée en CSV avec un schéma JSON décrivant ses
            champs. Vous pouvez également télécharger le{" "}
            <a href={`${ANSM_RESOURCE_BASE}${ansmResources.packageZip.id}`}>
              Data Package complet au format ZIP
            </a>{" "}
            et consulter son{" "}
            <a href={`${ANSM_RESOURCE_BASE}${ansmResources.packageSchema.id}`}>
              descripteur datapackage.json
            </a>{" "}
            pour examiner les ressources et leurs relations.
          </p>
          <p>
            La ressource <AnsmResource name="document" /> contient les
            références et les URL des documents, notamment les notices et
            résumés des caractéristiques du produit (RCP). Le CSV de références
            ne contient pas le texte intégral de ces documents : leur
            récupération constitue une étape distincte.
          </p>
          <h3>HAS : les évaluations et les avis sur les médicaments</h3>
          <p>
            Le jeu{" "}
            <a href={HAS_DATASET_URL}>
              Évaluation des médicaments sur data.gouv.fr
            </a>{" "}
            fournit les évaluations du service médical rendu (SMR), de
            l’amélioration du service médical rendu (ASMR) et les liens vers les
            avis de la commission de la transparence. Il propose également des
            <a href={`${HAS_RESOURCE_BASE}${hasResources.bonUsage}`}>
              {" "}
              documents de bon usage
            </a>{" "}
            et un calendrier d’évaluation. La{" "}
            <a href={`${HAS_RESOURCE_BASE}${hasResources.documentation}`}>
              documentation du jeu HAS
            </a>{" "}
            explique le contenu des fichiers.
          </p>
          <p>
            Selon la HAS, ces données portent sur les évaluations les plus
            récentes ; elles ne constituent pas un historique exhaustif et tous
            les médicaments ne font pas l’objet d’une évaluation. L’absence
            d’une ligne SMR ou ASMR ne doit donc pas être interprétée comme une
            évaluation négative.
          </p>
        </section>

        <section id="correspondances" aria-labelledby="titre-correspondances">
          <h2 id="titre-correspondances">
            Retrouver chaque ancien fichier BDPM
          </h2>
          <p>
            Ce tableau reprend les onze fichiers de données de l’ancienne page
            de téléchargement. « Sources disponibles » indique que des
            ressources couvrant le sujet sont publiées ; cela ne garantit pas
            une équivalence colonne par colonne. Les schémas et les réserves
            ci-dessous vous permettent de préparer cette vérification.
          </p>
          <div
            className={styles.tableScroll}
            tabIndex={0}
            role="region"
            aria-label="Correspondances des fichiers BDPM, tableau à défilement horizontal"
          >
            <table className={styles.table}>
              <caption>
                Ancien fichier, nouvelles ressources et état de la
                correspondance
              </caption>
              <thead>
                <tr>
                  <th scope="col">Ancien fichier BDPM</th>
                  <th scope="col">Sources à consulter</th>
                  <th scope="col">État et adaptations nécessaires</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((mapping) => (
                  <tr key={mapping.file}>
                    <th scope="row">
                      {mapping.label}
                      <br />
                      <code>{mapping.file}</code>
                    </th>
                    <td>{mapping.sources}</td>
                    <td>
                      <p>
                        <strong>{mapping.status}</strong>
                      </p>
                      <p>{mapping.details}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="migration" aria-labelledby="titre-migration">
          <h2 id="titre-migration">Adapter vos imports</h2>
          <ol>
            <li>
              <strong>Listez les données que vous utilisez.</strong> Partez de
              vos anciens fichiers et de leurs colonnes, puis identifiez les
              nouvelles ressources nécessaires avec le tableau ci-dessus.
            </li>
            <li>
              <strong>
                Consultez les schémas avant d’écrire votre import.
              </strong>{" "}
              Les CSV ANSM utilisés ici sont en UTF-8 avec une virgule comme
              séparateur. Les fichiers HAS ont leurs propres conventions : les
              imports SMR et ASMR utilisent notamment un point-virgule et
              l’encodage Windows-1252. Ne réutilisez pas les positions de
              colonnes des anciens fichiers texte.
            </li>
            <li>
              <strong>Conservez les identifiants comme du texte.</strong> Les
              codes CIS identifient les spécialités et les codes CIP les
              présentations. Évitez les conversions automatiques en nombres ;
              vérifiez la longueur et le format des codes CIP avant tout
              rapprochement.
            </li>
            <li>
              <strong>Reconstituez les relations.</strong> Utilisez les clés des
              schémas : CIS pour les spécialités, CIS et numéro d’élément pour
              la composition, code de groupe pour les génériques, identifiant de
              dossier pour les avis HAS. Certaines relations comportent
              plusieurs lignes par spécialité.
            </li>
            <li>
              <strong>Vérifiez le périmètre et les valeurs.</strong> Comparez
              les statuts, les dates, les libellés et les règles de sélection
              sur vos cas d’usage. Ne supposez pas que les ressources ouvertes
              appliquent les mêmes filtres que les anciens exports BDPM.
            </li>
            <li>
              <strong>Organisez les mises à jour.</strong> Consultez les dates
              de publication de chaque ressource et conservez la provenance et
              la date de vos imports. Les producteurs publient séparément : ne
              supposez pas que tous les fichiers sont actualisés en même temps.
            </li>
            <li>
              <strong>Préparez la bascule des liens ANSM.</strong> Centralisez
              l’URL du portail et les identifiants des ressources dans votre
              configuration. Les liens de démonstration devront être remplacés
              lors de la publication officielle, puis vérifiés à nouveau.
            </li>
          </ol>
          <p>
            Les liens de téléchargement de ce guide utilisent les identifiants
            de ressources des portails, plutôt qu’une URL de fichier datée.
            Vérifiez ces identifiants lors des évolutions du jeu de données.
            Consultez également les conditions de réutilisation indiquées par
            chaque producteur et mentionnez la source et la date des données
            dans votre service.
          </p>
        </section>

        <section id="donnees-manquantes" aria-labelledby="titre-manquantes">
          <h2 id="titre-manquantes">Données manquantes et travaux en cours</h2>
          <h3>Prix : publication en cours</h3>
          <p>
            Les prix auparavant inclus dans le fichier des présentations ne sont
            pas encore disponibles dans le nouveau dispositif. Leur publication
            est prévue dans un jeu de données porté par Info Médicament. Nous
            ajouterons ici le lien et les modalités de rapprochement dès sa mise
            à disposition. Aucun nouveau téléchargement de prix ne peut être
            recommandé dans ce guide pour le moment.
          </p>
          <h3>Autres correspondances à compléter</h3>
          <p>
            Les informations de remboursement, l’agrément aux collectivités, la
            liste des MITM et l’équivalence exacte des fichiers de ruptures et
            d’informations importantes restent à documenter ou à valider.
            Certaines colonnes de l’ancien fichier des spécialités et des
            compositions nécessitent également une correspondance plus précise.
          </p>
          <p>
            Une valeur absente ou une correspondance non validée doit rester «
            inconnue » dans votre application : elle ne signifie ni un prix nul,
            ni une absence de remboursement, ni une absence d’information de
            sécurité. Si vous conservez temporairement d’anciens exports,
            indiquez leur date et ne les présentez pas comme des données
            actualisées.
          </p>
          <p>
            Ce guide sera repris dans les prochains jours pour actualiser les
            liens ANSM et compléter les correspondances qui peuvent l’être. Une
            date de fermeture précise sera ajoutée lorsqu’elle sera confirmée.
          </p>
        </section>

        <section id="contenus-editoriaux" aria-labelledby="titre-editoriaux">
          <h2 id="titre-editoriaux">Les contenus complémentaires du site</h2>
          <p>
            Info Médicament utilise aussi Grist pour gérer des contenus
            complémentaires, notamment des articles, des définitions et des
            enrichissements éditoriaux. Ces contenus ne sont pas actuellement
            proposés comme un jeu de données ouvert dans ce guide.
          </p>
          <p>
            Vous n’avez pas besoin d’accéder à Grist pour télécharger les
            données ANSM et HAS décrites ci-dessus. Les contenus éditoriaux du
            site sont distincts des sources de données à importer.
          </p>
          <p>
            Pour signaler une correspondance manquante ou une difficulté de
            migration, écrivez à
            <a href="mailto:infomedicament-team@beta.gouv.fr">
              {" "}
              infomedicament-team@beta.gouv.fr
            </a>
            . Vous pouvez également consulter la page{" "}
            <Link href="/a-propos">À propos d’Info Médicament</Link>.
          </p>
        </section>
      </article>
    </ContentContainer>
  );
}
