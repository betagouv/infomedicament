// Stable resource links from the official ANSM dataset on data.gouv.fr.
// Keep resource IDs in sync with the dataset when its resources change.
export const ANSM_DATASET_URL =
  "https://www.data.gouv.fr/datasets/ansm-open-data";
export const ANSM_RESOURCE_BASE = "https://www.data.gouv.fr/api/1/datasets/r/";
export const HAS_DATASET_URL =
  "https://www.data.gouv.fr/datasets/evaluation-des-medicaments";
export const HAS_RESOURCE_BASE = "https://www.data.gouv.fr/api/1/datasets/r/";

export const ansmResources = {
  specialite: {
    id: "4e57bd7c-c2d3-487b-b40c-e4be810c9756",
    schemaId: "9659cbc2-116d-4056-9e9e-528453cea5ea",
  },
  specialite_titulaire: {
    id: "cc737ef8-8753-4f66-bda1-5883211093ef",
    schemaId: "40c1766f-c2ff-4952-81b8-00bb8a21530e",
  },
  presentation: {
    id: "62434987-737e-40c7-853b-ef3a9e78cd61",
    schemaId: "5a9a3114-77af-4366-8b3d-0c293177f080",
  },
  element: {
    id: "f11d26a8-8bf5-4f43-af18-28500c24966b",
    schemaId: "35a0fd03-fe34-457c-aa67-3d0d82640812",
  },
  composant: {
    id: "396a593b-08f6-41a2-89e7-9ba7e864929c",
    schemaId: "2e8a3f1a-30a5-4428-8c85-855d4ce6f77a",
  },
  groupe_generique: {
    id: "14af0ac0-b65c-4e81-98d5-40a916061834",
    schemaId: "695f27ef-f1b3-483d-a944-7f4f72144e03",
  },
  specialite_groupe_generique: {
    id: "4781731b-11c8-470d-bf8b-5df02eb48f24",
    schemaId: "91905b91-2200-4b24-b6e5-dee62c36d348",
  },
  delivrance: {
    id: "a4679217-00cf-4d9e-a5f5-a65dce13a945",
    schemaId: "07d51764-428f-46d4-a3da-af3e1af0c9df",
  },
  specialite_delivrance: {
    id: "e1b89c63-fe3d-4084-9362-dcace05ee326",
    schemaId: "b94fae57-e69c-43bb-a428-260445049b26",
  },
  presentation_evenement: {
    id: "7e0ec58a-4244-462d-bae0-dfa3721cf98b",
    schemaId: "2cdc44ed-67d2-4a4d-88ef-b0ca333a7bd8",
  },
  specialite_evenement: {
    id: "8031dd40-9cdb-40aa-b89f-6789c8c32260",
    schemaId: "b2b5a2d2-d6d0-4ca8-9467-3859b3ca97f2",
  },
  document: {
    id: "e155d807-5bff-491f-b0ba-31e6d33f8c18",
    schemaId: "9737dd5c-298a-4ec0-9c07-ea663f25a185",
  },
  substance_nom: {
    id: "e971f1fc-c915-4d8b-9e46-124e9878d1a6",
    schemaId: "86e4d990-bb86-4aad-a469-7dce37b826d3",
  },
  packageZip: { id: "c27bc8a4-3c4c-4ab9-b05a-8d3cc6bf1d9b", schemaId: null },
  packageSchema: { id: "98880cf7-9110-48aa-ae5a-3be17484dba1", schemaId: null },
} as const;

export const hasResources = {
  smr: "4da2d811-1c29-4f73-9805-83ae710be6d7",
  asmr: "f6122601-81bc-4b31-a6f9-df72b7a04119",
  avis: "f67407e1-2dae-4edf-9d0f-b280d41b731a",
  bonUsage: "63eec8bb-2ce4-44c7-a44c-77876f5619d0",
  documentation: "a5dc28ff-3a23-40bf-a37c-d91d247c5245",
} as const;
