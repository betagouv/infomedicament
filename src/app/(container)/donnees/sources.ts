// Temporary ANSM demo links: replace this origin, dataset URL and resource IDs
// together when the production dataset is published. No runtime fetch is needed.
export const ANSM_DATASET_URL =
  "https://demo.data.gouv.fr/datasets/ansm-open-data-1";
export const ANSM_RESOURCE_BASE = "https://demo.data.gouv.fr/api/1/datasets/r/";
export const HAS_DATASET_URL =
  "https://www.data.gouv.fr/datasets/evaluation-des-medicaments";
export const HAS_RESOURCE_BASE = "https://www.data.gouv.fr/api/1/datasets/r/";

export const ansmResources = {
  specialite: {
    id: "a2c9e0d7-14ae-4a6c-9081-c9a37ab15398",
    schemaId: "2840caf0-d84c-4f97-9164-1b15a854735a",
  },
  specialite_titulaire: {
    id: "32f9dce5-02a0-4678-8bae-5e6bba10ee48",
    schemaId: "fb84ce67-5ad0-495f-b113-c5870da3b6f1",
  },
  presentation: {
    id: "68a832f6-9610-4c31-bd74-abdbe3d53ff4",
    schemaId: "2c6c1843-f594-4846-979e-fe6d269a13fd",
  },
  element: {
    id: "209d170d-db63-4f24-9581-28698482f90d",
    schemaId: "e80999af-cf19-41c7-b99b-972dde383f45",
  },
  composant: {
    id: "6efdfbce-f474-40aa-96d3-8b79cfe85348",
    schemaId: "59ad50cc-f627-41cd-9c0a-d6dbfe64456f",
  },
  groupe_generique: {
    id: "33481bee-75de-46e7-9ad1-0174d4cc9b47",
    schemaId: "d89bc2c8-d3f1-4cef-ab93-5089b98826ff",
  },
  specialite_groupe_generique: {
    id: "97ea4d4c-4e2f-456a-9a3d-f8fabc14927c",
    schemaId: "8f36523c-303f-4677-841b-2bf3a3e27e30",
  },
  delivrance: {
    id: "e1e59c0b-8e53-45e5-856f-f136ad2d0ae5",
    schemaId: "b46f26d9-66a0-47d1-b70a-e69bd78ae58d",
  },
  specialite_delivrance: {
    id: "b1148657-4f67-4d3c-bf5b-15ec3c6fb390",
    schemaId: "8f12cf75-7a53-4989-b2d0-039f879509c6",
  },
  presentation_evenement: {
    id: "6f7aba25-1976-4047-b10e-e55e7ee75d1b",
    schemaId: "4fdacde6-92b7-4a43-b005-a5f99ea1a0b7",
  },
  specialite_evenement: {
    id: "1feb0fe5-8a09-4bf4-9d53-db15d686ff39",
    schemaId: "2f61c6a8-073e-4f45-bea5-29977cb0c5d5",
  },
  document: {
    id: "989e4524-b7e5-44f3-bfff-0e62c0ac2199",
    schemaId: "4e8506e3-03d8-4188-8d43-88ccb7470ab8",
  },
  substance_nom: {
    id: "3b8167cf-8f4e-4cb4-a6cc-59a027862f1d",
    schemaId: "0e7eab39-7b08-4ac7-a07d-43f325de731f",
  },
  packageZip: { id: "49291dcf-1e61-4776-9c94-d2e1a2dce297", schemaId: null },
  packageSchema: { id: "8088307b-508f-4fcb-82ed-9ce85c9910de", schemaId: null },
} as const;

export const hasResources = {
  smr: "4da2d811-1c29-4f73-9805-83ae710be6d7",
  asmr: "f6122601-81bc-4b31-a6f9-df72b7a04119",
  avis: "f67407e1-2dae-4edf-9d0f-b280d41b731a",
  bonUsage: "63eec8bb-2ce4-44c7-a44c-77876f5619d0",
  documentation: "a5dc28ff-3a23-40bf-a37c-d91d247c5245",
} as const;
