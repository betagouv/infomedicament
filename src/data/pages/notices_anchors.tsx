import { HeaderDetails, QuestionsListFormat } from "@/types/NoticesAnchors";

interface headerAnchorsListFormat {
  [index: string]: HeaderDetails;
}
export const headerAnchorsList: headerAnchorsListFormat = {
  description: {
    id: "description",
    headerTerms : {
      begin: "1. QU’EST-CE QU",
      end: "ET DANS QUELS CAS EST-IL UTILISE ?",
    },
  },
  commentPrendre: {
    id: "commentPrendre",
    headerTerms : {
      begin: "3. COMMENT PRENDRE",
      end: "?",
    },
  },
  effetsIndesirables: {
    id: "effetsIndesirables",
    headerTerms : {
      begin: "4. QUELS SONT LES EFFETS INDESIRABLES EVENTUELS",
      end: "?"
    },
  },
  conservation: {
    id:"conservation",
    headerTerms : {
      begin: "5. COMMENT CONSERVER",
      end: "?",
    },
  },
  contenu: {
    id: "contenu",
    headerTerms : {
      begin: "6. CONTENU DE L’EMBALLAGE",
      end: "ET AUTRES INFORMATIONS",
    },
  }
};
export const headerAnchorsKeys: string[] = Object.keys(headerAnchorsList);

export const questionsList: QuestionsListFormat = {
  description: {
    id: "description",
    highlightClass: "anchor-1",
    question: (
      <>
        <strong>À quoi sert-il</strong> ?
      </>
    ),
    anchors: [headerAnchorsList.description],
    unique: true,
  },
  commentPrendre: {
    id: "commentPrendre",
    highlightClass: "anchor-2",
    question: (
      <>
        <strong>Comment</strong> le prendre ?
      </>
    ),
    anchors: [headerAnchorsList.commentPrendre],
    keywords: [
      "Mode et voie d’administration",
      "Mode et voie d'administration",
      "Mode d’administration",
      "Mode d'administration",
      "Fréquence d’administration",
      "Fréquence d'administration",
      "Prise du médicament",
    ],
    unique: false,
  },  
  combienPrendre: {
    id: "combienPrendre",
    highlightClass: "anchor-3",
    question: (
      <>
        <strong>Combien</strong> en prendre ?
      </>
    ),
    keywords: [
      "Posologie",
      "Combien en prendre",
      "Dose recommandée",
      "Dose",
      "tableau posologique",
    ],
    unique: false,
  },
  pediatrie: {
    id: "pediatrie",
    highlightClass: "anchor-4",
    question: (
      <>
        Puis-je le donner à mon <strong>enfant</strong> ?
      </>
    ),
    keywords: [
      "Enfants et adolescents",
      "enfant",
      "adolescent",
      "bébé",
      "nourrisson",
      "réservé à l’adulte",
      "réservé à l'adulte",
    ],
    unique: false,
  },
  grossesse: {
    id: "grossesse",
    highlightClass: "anchor-5",
    question: (
      <>
        Puis-je le prendre si je suis <strong>enceinte</strong> ou prévoit de l'être ?
      </>
    ),
    keywords: [
      "Grossesse, allaitement et fertilité",
      "Grossesse",
      "Allaitement",
      "Fertilité",
      "Enceinte",
    ],
    unique: false,
  },
  duree: {
    id: "duree",
    highlightClass: "anchor-6",
    question: (
      <>
        Quelle est la <strong>durée</strong> du traitement ?
      </>
    ),
    keywords: [
      "Durée du traitement",
      "Durée",
    ],
    unique: false,
  },
  allergies: {
    id: "allergies",
    highlightClass: "anchor-7",
    question: (
      <>
        Puis-je le prendre si j’ai des <strong>allergies</strong> ?
      </>
    ),
    keywords: [
      "Allergie",
      "Allergique",
    ],
    unique: false,
  },
  boireManger: {
    id: "boireManger",
    highlightClass: "anchor-8",
    question: (
      <>
        Que puis-je <strong>boire et manger</strong> avec ?
      </>
    ),
    keywords: [
      "alcoolisé",
      "Alcool",
      "Boisson",
      "Aliment",
    ],
    unique: false,
  },
  conduite: {
    id: "conduite",
    highlightClass: "anchor-9",
    question: (
      <>
        Est-ce dangereux de <strong>conduire</strong> avec ?
      </>
    ),
    keywords: [
      "Conduite de véhicules et utilisation de machines",
      "Conduire",
      "Conduite",
      "véhicule",
      "machine",
    ],
    unique: true,
  },
  interactions: {
    id: "interactions",
    highlightClass: "anchor-10",
    question: (
      <>
        Puis-je le prendre <strong>avec d’autres médicaments ?</strong>
      </>
    ),
    keywords: [
      "si vous prenez en même temps",
      "si vous prenez un autre médicament",
      "interaction médicamenteuse",
      "Autres médicaments et",
      "si vous prenez le médicament",
      "si vous prenez",
    ],
    unique: false,
  },
  effetsIndesirables: {
    id: "effetsIndesirables",
    highlightClass: "anchor-11",
    question: (
      <>
        Quels sont les <strong>effets indésirables ?</strong>
      </>
    ),
    anchors: [headerAnchorsList.effetsIndesirables],
    unique: true,
  },
  conservation: {
    id: "conservation",
    highlightClass: "anchor-12",
    question: (
      <>
        Comment le <strong>conserver</strong> ?
      </>
    ),
    anchors:[headerAnchorsList.conservation],
    unique: true,
  },
  contenu: {
    id: "contenu",
    highlightClass: "anchor-13",
    question: (
      <>
        <strong>Que contient</strong> ce médicament ?
      </>
    ),
    anchors: [headerAnchorsList.contenu],
    keywords: [
      "Ce que contient",
    ],
    unique: true,
  },
};
export const questionKeys: string[] = Object.keys(questionsList);
