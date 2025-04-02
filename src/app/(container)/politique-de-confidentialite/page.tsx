import ContentContainer from "@/components/newGenericContent/ContentContainer";
import { fr } from "@codegouvfr/react-dsfr";
import Table from "@codegouvfr/react-dsfr/Table";

export default async function Page() {
  return (
    <ContentContainer frContainer>
      <div className={fr.cx("fr-grid-row")}>
        <div className={fr.cx("fr-col-md-8")}>
          <h1>Politique de confidentialité de Info Médicament</h1>
          <h2>Qui est responsable de Info Médicament&nbsp;?</h2>
          <p>
            Info Médicament est développé par la Direction interministérielle du
            numérique (DINUM) et par l’Agence nationale de sécurité du médicament
            et des produits de santé (ANSM). Info Médicament est un service
            numérique qui permet de mettre à disposition les informations et les
            données relatives aux médicaments aux patients et aux professionnels
            de santé afin de favoriser un meilleur usage des médicaments.{" "}
          </p>
          <p>
            Le responsable de l’utilisation des données est l’ANSM représentée par
            Madame Catherine Paugam-Burtz. La DINUM a qualité de sous-traitant.{" "}
          </p>
          <h2>
            Quelles sont les données que nous traitons&nbsp;? Pourquoi&nbsp;?{" "}
          </h2>
          <p>
            Info Médicament traite l’adresse email des personnes s’inscrivant sur
            le site Info Médicament en vue uniquement d’informer les personnes sur
            le service numérique.
          </p>
          <h2>Qu’est-ce qui nous autorise à traiter ces données&nbsp;?</h2>
          <p>
            Info Médicament traite des données à caractère personnel en se basant
            sur&nbsp;:
          </p>
          <ul>
            <li>
              L’exécution d’une mission d’intérêt public ou relevant de l’exercice
              de l’autorité publique dont est investi le responsable de traitement
              au sens de l’article 6-1 e) du RPGD (ou autre base légale).
            </li>
          </ul>
          <p>
            Cette mission d’intérêt public est mise en œuvre par : l’article L.
            5311-1 du code de la santé publique.
          </p>
          <h2>Pendant combien de temps conservons-nous ces données ?</h2>
          <Table
            bordered
            headers={["Type de données", "Durée de la conservation"]}
            data={[["Adresse email", "2 ans"]]}
          />
          <h2>Quels droits avez-vous&nbsp;?</h2>
          <p>Vous disposez&nbsp;:</p>
          <ul>
            <li>
              D’un droit d’information et d’un droit d’accès à vos données ;
            </li>
            <li>D’un droit de rectification&nbsp;;</li>
            <li>D’un droit d’opposition&nbsp;;</li>
            <li>D’un droit à la limitation du traitement.</li>
          </ul>
          <p>
            Pour les exercer, contactez-nous à{" "}
            <a href="mailto:infomedicament-team@beta.gouv.fr">
              infomedicament-team@beta.gouv.fr
            </a>
            .
          </p>
          <p>
            Puisque ce sont des droits personnels, nous ne traiterons votre
            demande que si nous sommes en mesure de vous identifier. Dans le cas
            où nous ne parvenons pas à vous identifier, nous pouvons être amenés à
            vous demander une preuve de votre identité.
          </p>
          <p>
            Pour vous aider dans votre démarche, vous pouvez utiliser{" "}
            <a href="https://www.cnil.fr/fr/modele/courrier/exercer-son-droit-dacces">
              un modèle de courrier élaboré par la CNIL
            </a>
            . Nous nous engageons à vous répondre dans un délai raisonnable qui ne
            saurait dépasser 1 mois à compter de la réception de votre demande.
          </p>
          <h2>Qui va avoir accès à ces données à caractère personnel&nbsp;?</h2>
          <p>
            Les accès aux données sont strictement encadrés et juridiquement
            justifiés. Les personnes suivantes vont avoir accès aux données à
            caractère personnel :
          </p>
          <ul>
            <li>
              Les membres d’Info Médicament qui ont besoin des données dans leurs
              missions ou qui y ont accès de fait (développeur, etc.).
            </li>
          </ul>
          <h2>Quelles mesures de sécurité mettons-nous en place&nbsp;?</h2>
          <p>
            Nous mettons en place plusieurs mesures pour sécuriser les données :
          </p>
          <ul>
            <li> Stockage des données en base de données ;</li>
            <li> Cloisonnement des données ;</li>
            <li> Mesures de traçabilité ;</li>
            <li> Surveillance ;</li>
            <li> Protection contre les virus, malwares et logiciels espions ;</li>
            <li> Protection des réseaux ;</li>
            <li> Sauvegarde ;</li>
            <li>
              Mesures restrictives limitant l’accès physiques aux données à
              caractère personnel.
            </li>
          </ul>
          <h2>Qui nous aide à traiter les données&nbsp;?</h2>
          <p>
            Certaines des données sont envoyées à d’autres acteurs, appelés
            “sous-traitants de données”, pour qu’ils nous aident à les manipuler.
            Nous nous assurons qu’ils respectent strictement le RGPD et qu’ils
            apportent des garanties suffisantes en matière de sécurité.
          </p>
          <Table
            headers={[
              "Sous-traitant",
              "Pays destinataire",
              "Traitement réalisé",
              "Garanties",
            ]}
            data={[
              [
                "Hotjar",
                "Irlande",
                "Gestion des cookies & collecte des adresses emails",
                "https://www.hotjar.com/legal/support/dpa/",
              ],
            ]}
          />
          <h2>Cookies</h2>
          <p>
            Un cookie est un fichier déposé sur votre terminal lors de la visite
            d’un site. Il a pour but de collecter des informations relatives à
            votre navigation et de vous adresser des services adaptés à votre
            terminal (ordinateur, mobile ou tablette).
          </p>
          <p>
            En application de l’article 5(3) de la directive 2002/58/CE modifiée
            concernant le traitement des données à caractère personnel et la
            protection de la vie privée dans le secteur des communications
            électroniques, transposée à l’article 82 de la loi n°78-17 du 6
            janvier 1978 relative à l’informatique, aux fichiers et aux libertés,
            les traceurs ou cookies suivent deux régimes distincts.
          </p>
          <p>
            Les cookies strictement nécessaires au service ou ayant pour finalité
            exclusive de faciliter la communication par voie électronique sont
            dispensés de consentement préalable au titre de l’article 82 de la loi
            n°78-17 du 6 janvier 1978.
          </p>
          <p>
            Les cookies n’étant pas strictement nécessaires au service ou n’ayant
            pas pour finalité exclusive de faciliter la communication par voie
            électronique doivent être consenti par l’utilisateur.
          </p>
          <p>
            Ce consentement de la personne concernée pour une ou plusieurs
            finalités spécifiques constitue une base légale au sens du RGPD et
            doit être entendu au sens de l&apos;article 6-a du Règlement (UE)
            2016/679 du Parlement européen et du Conseil du 27 avril 2016 relatif
            à la protection des personnes physiques à l&apos;égard du traitement
            des données à caractère personnel et à la libre circulation de ces
            données.
          </p>
          <p>
            Des cookies relatifs aux statistiques publiques et anonymes sont
            également déposés.
          </p>
          <p>Cookies recensés sur Info Médicament :</p>
          <Table
            headers={[
              "Nom du cookie",
              "Finalités",
              "Hébergement",
              "Durée de vie du cookie",
              "Garanties",
            ]}
            data={[
              [
                "_hjSessionUser_{site_id}",
                "Identifiant utilisateur",
                "Ireland",
                "12 mois",
                "https://www.hotjar.com/legal/support/dpa/",
              ],
              [
                "_hjHasCacheUserAttributes",
                "Identifiant utilisateur",
                "Ireland",
                "12 mois",
                "https://www.hotjar.com/legal/support/dpa/",
              ],
              [
                "_hjUserAttributesHash",
                "Identifiant utilisateur",
                "Ireland",
                "12 mois",
                "https://www.hotjar.com/legal/support/dpa/",
              ],
              [
                "_hjUserAttributes",
                "Identifiant utilisateur",
                "Ireland",
                "12 mois",
                "https://www.hotjar.com/legal/support/dpa/",
              ],
              [
                "_hjViewportld",
                "Identifiant utilisateur",
                "Ireland",
                "12 mois",
                "https://www.hotjar.com/legal/support/dpa/",
              ],
              [
                "_hjActiveViewportlds",
                "Identifiant utilisateur",
                "Ireland",
                "12 mois",
                "https://www.hotjar.com/legal/support/dpa/",
              ],
              [
                "_hjSession_{site_id}",
                "Session",
                "Ireland",
                "12 mois",
                "https://www.hotjar.com/legal/support/dpa/",
              ],
              [
                "_hjCookieTest",
                "Session",
                "Ireland",
                "12 mois",
                "https://www.hotjar.com/legal/support/dpa/",
              ],
              [
                "_hjLocalStorageTest",
                "Session",
                "Ireland",
                "12 mois",
                "https://www.hotjar.com/legal/support/dpa/",
              ],
              [
                "_hjSessionStorageTest",
                "Session",
                "Ireland",
                "12 mois",
                "https://www.hotjar.com/legal/support/dpa/",
              ],
              [
                "_hjTLDTest",
                "Session",
                "Ireland",
                "12 mois",
                "https://www.hotjar.com/legal/support/dpa/",
              ],
              [
                "_hjClosedSurveyInvites",
                "Feedback et enquête",
                "Ireland",
                "12 mois",
                "https://www.hotjar.com/legal/support/dpa/",
              ],
              [
                "_hjDonePolls",
                "Feedback et enquête",
                "Ireland",
                "12 mois",
                "https://www.hotjar.com/legal/support/dpa/",
              ],
              [
                "_hjMinimizedPolls",
                "Feedback et enquête",
                "Ireland",
                "12 mois",
                "https://www.hotjar.com/legal/support/dpa/",
              ],
              [
                "_hjShownFeedbackMessage",
                "Feedback et enquête",
                "Ireland",
                "12 mois",
                "https://www.hotjar.com/legal/support/dpa/",
              ],
            ]}
          />
          <p>
            À tout moment, vous pouvez refuser l’utilisation des cookies et
            désactiver le dépôt sur votre ordinateur en utilisant la fonction
            dédiée de votre navigateur (fonction disponible notamment sur
            Microsoft Internet Explorer 11, Google Chrome, Mozilla Firefox, Apple
            Safari et Opera).
          </p>
          <p>
            Pour aller plus loin, vous pouvez consulter les ﬁches proposées par la
            Commission Nationale de l&apos;Informatique et des Libertés
            (CNIL)&nbsp;:
          </p>
          <ul>
            <li>
              <a href="https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/que-dit-la-loi">
                Cookies & traceurs&nbsp;: que dit la loi&nbsp;?
              </a>
            </li>
            <li>
              <a href="https://www.cnil.fr/fr/cookies-et-autres-traceurs/comment-se-proteger/maitriser-votre-navigateur">
                Cookies&nbsp;: les outils pour les maîtriser
              </a>
            </li>
          </ul>
        </div>
      </div>
    </ContentContainer>
  );
}
