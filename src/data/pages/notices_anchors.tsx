import { QuestionsListFormat } from "@/types/NoticesAnchors";

export const questionsList: QuestionsListFormat = {
  description: {
    id: "description",
    highlightClass: "anchor-1",
    question: (
      <>À quoi sert-il ?</>
    ),
    headerId: "Ann3bQuestceque",
    queryText: "À quoi sert ce médicament ?",
    unique: true,
    tracking: "À quoi sert-il",
    icon: "a_quoi_sert_il.svg",
  },
  commentPrendre: {
    id: "commentPrendre",
    highlightClass: "anchor-2",
    question: (
      <>Comment le prendre ?</>
    ),
    headerId: "Ann3bCommentPrendre",
    queryText: "Comment prendre ce médicament, mode d'administration ?",
    unique: false,
    tracking: "Comment le prendre ?",
    icon: "comment_le_prendre.svg",
  },
  combienPrendre: {
    id: "combienPrendre",
    highlightClass: "anchor-3",
    question: (
      <>Combien en prendre ?</>
    ),
    queryText: "Quelle est la posologie, la dose à prendre ?",
    unique: false,
    tracking: "Combien en prendre ?",
    icon: "combien_en_prendre.svg",
  },
  duree: {
    id: "duree",
    highlightClass: "anchor-6",
    question: (
      <>Durée du traitement</>
    ),
    queryText: "Quelle est la durée du traitement ?",
    unique: false,
    tracking: "Durée du traitement",
    icon: "duree_du_traitement.svg",
  },
  allergies: {
    id: "allergies",
    highlightClass: "anchor-7",
    question: (
      <>Allergies</>
    ),
    queryText: "Quelles sont les contre-indications et allergies ?",
    unique: false,
    tracking: "Allergies",
    icon: "allergies.svg",
  },
  interactions: {
    id: "interactions",
    highlightClass: "anchor-10",
    question: (
      <>Interactions médicaments</>
    ),
    queryText: "Quelles sont les interactions avec d'autres médicaments ?",
    unique: false,
    tracking: "Interactions médicaments",
    icon: "interactions_medicaments.svg",
  },
  pediatrie: {
    id: "pediatrie",
    highlightClass: "anchor-4",
    question: (
      <>Enfants</>
    ),
    keywords: [
      "Enfants et adolescents",
      "enfant",
      "adolescent",
      "bébé",
      "nourrisson",
      "réservé à l’adulte",
      "réservé à l’adulte",
    ],
    unique: false,
    tracking: "Enfants",
    icon: "enfants.svg",
  },
  grossesse: {
    id: "grossesse",
    highlightClass: "anchor-5",
    question: (
      <>Grossesse et allaitement</>
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
    tracking: "Grossesse et allaitement",
    icon: "grossesse_et_allaitement.svg",
  },
  boireManger: {
    id: "boireManger",
    highlightClass: "anchor-8",
    question: (
      <>Alcool et nourriture</>
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
    tracking: "Alcool et nourriture",
    icon: "alcool_et_nourriture.svg",
  },
  conduite: {
    id: "conduite",
    highlightClass: "anchor-9",
    question: (
      <>Conduite</>
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
    tracking: "Conduite",
    icon: "conduite.svg",
  },
  effetsIndesirables: {
    id: "effetsIndesirables",
    highlightClass: "anchor-11",
    question: (
      <>Effets indésirables</>
    ),
    headerId: "Ann3bEffetsIndesirables",
    queryText: "Quels sont les effets indésirables ?",
    unique: true,
    tracking: "Effets indésirables",
    icon: "effets_indesirables.svg",
  },
  conservation: {
    id: "conservation",
    highlightClass: "anchor-12",
    question: (
      <>Conservation</>
    ),
    headerId: "Ann3bConservation",
    queryText: "Comment conserver ce médicament ?",
    unique: true,
    tracking: "Conservation",
    icon: "conservation.svg",
  },
  contenu: {
    id: "contenu",
    highlightClass: "anchor-13",
    question: (
      <>Composition</>
    ),
    headerId: "Ann3bEmballage",
    keywords: [
      "Ce que contient",
    ],
    unique: true,
    tracking: "Composition",
    icon: "composition.svg",
  },
};
export const questionKeys: string[] = Object.keys(questionsList);
