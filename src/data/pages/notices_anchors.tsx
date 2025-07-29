import { QuestionsListFormat } from "@/types/NoticesAnchors";

export const questionsList: QuestionsListFormat = {
  description: {
    id: "description",
    highlightClass: "anchor-1",
    question: (
      <>
        <strong>À quoi sert-il</strong> ?
      </>
    ),
    headerId: "Ann3bQuestceque",
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
    headerId: "Ann3bCommentPrendre",
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
      //"Doses",
      //"Dose",
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
      "Grossesse et allaitement",
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
      "Allergies",
      "Allergie",
      "Allergiques",
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
      "alcoolisées",
      "alcoolisée",
      "alcoolisés",
      "alcoolisé",
      "Alcools",
      "Alcool",
      "Boissons",
      "Boisson",
      "Aliments",
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
      "véhicules",
      "véhicule",
      "machines",
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
    headerId: "Ann3bEffetsIndesirables",
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
    headerId:"Ann3bConservation",
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
    headerId: "Ann3bEmballage",
    keywords: [
      "Ce que contient",
    ],
    unique: true,
  },
};
export const questionKeys: string[] = Object.keys(questionsList);
