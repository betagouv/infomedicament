import { AgregateDispositifDetails, AgregatePresentationDetails, AgregateRecipientDetails } from "@/types/PresentationTypes";
import { describe, it, expect } from "vitest";
import { caracCompDisplay, cleanPresentationsDetails, contenanceDisplay, dispositifDisplay, replacePluralSingular, totalDisplay } from "./presentations";
import { PresentationDetail } from "@/db/types";
 
  //CIS : 69174918
  const recipientDetails: AgregateRecipientDetails = {
    caraccomplrecips: [
      {
        caraccomplrecip: "multidose(s)",
        numordreedit: 1,
      },
      {
        caraccomplrecip: "en verre",
        numordreedit: 2,
      }
    ],
    nbrrecipient: 10,
    numrecipient: 1,
    qtecontenance: 10,
    recipient: "flacon(s)",
    unitecontenance: "dose(s)"
  };
  const dispositifDetails: AgregateDispositifDetails[] = [];
  //CIS : 63886766
  const recipientDetails2: AgregateRecipientDetails = {
    caraccomplrecips: [],
    nbrrecipient: 4,
    numrecipient: 2,
    qtecontenance: 0,
    recipient: "seringue(s) préremplie(s)",
    unitecontenance: ""
  };
  const dispositifDetails2: AgregateDispositifDetails[] = [
    {
      dispositif: "avec aiguille(s)",
      numdispositif: 1,
    },
    {
      dispositif: "avec adaptateur(s) pour flacon",
      numdispositif: 2,
    },
    {
      dispositif: "avec tampon(s) alcoolisé(s)",
      numdispositif: 3,
    }
  ];
  //CIS : 60052222
  const recipientDetails3: AgregateRecipientDetails = {
    caraccomplrecips: [
      {
        caraccomplrecip: "en verre",
        numordreedit: 1,
      },
      {
        caraccomplrecip: "brun",
        numordreedit: 2,
      }
    ],
    nbrrecipient: 2,
    numrecipient: 1,
    qtecontenance: 13.19999981,
    recipient: "flacon(s)",
    unitecontenance: "ml"
  };
  const dispositifDetails3: AgregateDispositifDetails[] = [
    {
      dispositif: "avec dispositif(s) pulvérisateur(s)",
      numdispositif: 3,
    }
  ];
  //CIS : 60928110
  const recipientDetails4: AgregateRecipientDetails = {
    caraccomplrecips: [
      {
        caraccomplrecip: "aluminium",
        numordreedit: 1,
      },
      {
        caraccomplrecip: "avec valve(s) doseuse(s)",
        numordreedit: 2,
      },
      {
        caraccomplrecip: "avec embout(s) buccal(aux)",
        numordreedit: 3,
      }
    ],
    nbrrecipient: 1,
    numrecipient: 1,
    qtecontenance: 200,
    recipient: "flacon(s) pressurisé(s)",
    unitecontenance: "dose(s)"
  };
  const dispositifDetails4: AgregateDispositifDetails[] = [];

describe("utils presentations", () => {

  it("replacePluralSingular", async () => {
    expect(replacePluralSingular("comprimé(s)", 2)).toBe("comprimés");
    expect(replacePluralSingular("comprimé(s)", 1)).toBe("comprimé");
    expect(replacePluralSingular("embout(s) nasal(aux)", 2)).toBe("embouts nasaux");
    expect(replacePluralSingular("embout(s) nasal(aux)", 1)).toBe("embout nasal");
    expect(replacePluralSingular("anneau(x)", 2)).toBe("anneaux");
    expect(replacePluralSingular("anneau(x)", 1)).toBe("anneau");
    expect(replacePluralSingular("stylo prérempli", 2)).toBe("stylos préremplis");
    expect(replacePluralSingular("stylo prérempli", 1)).toBe("stylo prérempli");
  });

  it("totalDisplay", async () => {
    expect(totalDisplay(recipientDetails)).toBe("100 doses");
    expect(totalDisplay(recipientDetails2)).toBe("");
    expect(totalDisplay(recipientDetails3)).toBe("");
    expect(totalDisplay(recipientDetails4)).toBe("200 doses");
  });

  it("contenanceDisplay", async () => {
    expect(contenanceDisplay(recipientDetails)).toBe("10 doses");
    expect(contenanceDisplay(recipientDetails2)).toBe("");
    expect(contenanceDisplay(recipientDetails3)).toBe("13,2 ml");
    expect(contenanceDisplay(recipientDetails4)).toBe("200 doses");
  });

  it("caracCompDisplay", async () => {
    expect(caracCompDisplay(recipientDetails.caraccomplrecips, recipientDetails.nbrrecipient, false)).toBe(" multidoses en verre");
    expect(caracCompDisplay(recipientDetails.caraccomplrecips, recipientDetails.nbrrecipient, true)).toBe("");
    expect(caracCompDisplay(recipientDetails2.caraccomplrecips, recipientDetails2.nbrrecipient, false)).toBe("");
    expect(caracCompDisplay(recipientDetails2.caraccomplrecips, recipientDetails2.nbrrecipient, true)).toBe("");
    expect(caracCompDisplay(recipientDetails3.caraccomplrecips, recipientDetails3.nbrrecipient, false)).toBe(" en verre brun");
    expect(caracCompDisplay(recipientDetails3.caraccomplrecips, recipientDetails3.nbrrecipient, true)).toBe("");
    expect(caracCompDisplay(recipientDetails4.caraccomplrecips, recipientDetails4.nbrrecipient, false)).toBe(" aluminium avec valve doseuse avec embout buccal");
    expect(caracCompDisplay(recipientDetails4.caraccomplrecips, recipientDetails4.nbrrecipient, true)).toBe(" avec valve doseuse avec embout buccal");
  });

  it("dispositifDisplay", async () => {
    expect(dispositifDisplay(dispositifDetails)).toBe("");
    expect(dispositifDisplay(dispositifDetails2)).toBe(" avec aiguille avec adaptateur pour flacon avec tampon alcoolisé");
    expect(dispositifDisplay(dispositifDetails3)).toBe(" avec dispositif pulvérisateur");
    expect(dispositifDisplay(dispositifDetails4)).toBe("");
  });

  it("cleanPresentationsDetails - PVC-Alumium and PVC - multiple caraccomplrecip with the same value ", async () => {
    //CIS : 60018444
    const presDetails: PresentationDetail[] = [
      {
        caraccomplrecip: "PVDC",
        codecip13: "3400930101001",
        dispositif: "",
        nbrrecipient: 30,
        nom_presentation: "30 plaquette(s) prédécoupées unitaires aluminium OPA : polyamide orienté PVC-Aluminium de 1 comprimé(s)",
        nomelement: "comprimé",
        numdispositif: 0,
        numelement: 1,
        numordreedit: 2,
        numrecipient: 1,
        qtecontenance: 1,
        recipient: "plaquette(s)",
        unitecontenance: "comprimé(s)",
      },
      {
        caraccomplrecip: "aluminium",
        codecip13: "3400930101001",
        dispositif: "",
        nbrrecipient: 30,
        nom_presentation: "30 plaquette(s) prédécoupées unitaires aluminium OPA : polyamide orienté PVC-Aluminium de 1 comprimé(s)",
        nomelement: "comprimé",
        numdispositif: 0,
        numelement: 1,
        numordreedit: 1,
        numrecipient: 1,
        qtecontenance: 1,
        recipient: "plaquette(s)",
        unitecontenance: "comprimé(s)",
      },
      {
        caraccomplrecip: "aluminium",
        codecip13: "3400930101001",
        dispositif: "",
        nbrrecipient: 30,
        nom_presentation: "30 plaquette(s) prédécoupées unitaires aluminium OPA : polyamide orienté PVC-Aluminium de 1 comprimé(s)",
        nomelement: "comprimé",
        numdispositif: 0,
        numelement: 1,
        numordreedit: 3,
        numrecipient: 1,
        qtecontenance: 1,
        recipient: "plaquette(s)",
        unitecontenance: "comprimé(s)",
      },
      {
        caraccomplrecip: "OPA : polyamide orienté",
        codecip13: "3400930101001",
        dispositif: "",
        nbrrecipient: 30,
        nom_presentation: "30 plaquette(s) prédécoupées unitaires aluminium OPA : polyamide orienté PVC-Aluminium de 1 comprimé(s)",
        nomelement: "comprimé",
        numdispositif: 0,
        numelement: 1,
        numordreedit: 2,
        numrecipient: 1,
        qtecontenance: 1,
        recipient: "plaquette(s)",
        unitecontenance: "comprimé(s)",
      },
      {
        caraccomplrecip: "PVC-Aluminium",
        codecip13: "3400930101001",
        dispositif: "",
        nbrrecipient: 30,
        nom_presentation: "30 plaquette(s) prédécoupées unitaires aluminium OPA : polyamide orienté PVC-Aluminium de 1 comprimé(s)",
        nomelement: "comprimé",
        numdispositif: 0,
        numelement: 1,
        numordreedit: 3,
        numrecipient: 1,
        qtecontenance: 1,
        recipient: "plaquette(s)",
        unitecontenance: "comprimé(s)",
      },
      {
        caraccomplrecip: "PVC",
        codecip13: "3400930101001",
        dispositif: "",
        nbrrecipient: 30,
        nom_presentation: "30 plaquette(s) prédécoupées unitaires aluminium OPA : polyamide orienté PVC-Aluminium de 1 comprimé(s)",
        nomelement: "comprimé",
        numdispositif: 0,
        numelement: 1,
        numordreedit: 1,
        numrecipient: 1,
        qtecontenance: 1,
        recipient: "plaquette(s)",
        unitecontenance: "comprimé(s)",
      }
    ];
    const cleanPresDetails: AgregatePresentationDetails[] = [
      {
        codecip13: "3400930101001",
        dispositifs: [],
        recipients: [
          {
            caraccomplrecips: [
              {
                caraccomplrecip: "aluminium",
                numordreedit: 1
              },
              {
                caraccomplrecip: "OPA : polyamide orienté",
                numordreedit: 2,
              },
              {
                caraccomplrecip: "PVC-Aluminium",
                numordreedit: 3,
              }
            ],
            nbrrecipient: 30,
            numrecipient: 1,
            qtecontenance: 1,
            recipient: "plaquette(s)",
            unitecontenance: "comprimé(s)",
          }
        ],
      }
    ];
    const cleanResult: AgregatePresentationDetails[] = cleanPresentationsDetails(presDetails);
    expect(cleanResult).toStrictEqual(cleanPresDetails);
  });

  it("cleanPresentationsDetails - with dispositif, recipient and caraccomplrecip", async () => {
    //CIS : 60052222
    const presDetails: PresentationDetail[] = [
      {
        caraccomplrecip: "en verre",
        codecip13: "3400930276419",
        dispositif: "avec dispositif(s) pulvérisateur(s)",
        nbrrecipient: 1,
        nom_presentation: "1 flacon en verre brun de 13,2 mL (150 pulvérisations) avec pompe pour pulvérisation PEBD polypropylène",
        nomelement: "solution",
        numdispositif: 3,
        numelement: 1,
        numordreedit: 1,
        numrecipient: 1,
        qtecontenance: 13.19999981,
        recipient: "flacon(s)",
        unitecontenance: "ml",
      },
      {
        caraccomplrecip: "brun",
        codecip13: "3400930276419",
        dispositif: "avec dispositif(s) pulvérisateur(s)",
        nbrrecipient: 1,
        nom_presentation: "1 flacon en verre brun de 13,2 mL (150 pulvérisations) avec pompe pour pulvérisation PEBD polypropylène",
        nomelement: "solution",
        numdispositif: 3,
        numelement: 1,
        numordreedit: 2,
        numrecipient: 1,
        qtecontenance: 13.19999981,
        recipient: "flacon(s)",
        unitecontenance: "ml",
      },
    ];
    const cleanPresDetails: AgregatePresentationDetails[] = [
      {
        codecip13: "3400930276419",
        dispositifs: [
          {
            dispositif: "avec dispositif(s) pulvérisateur(s)",
            numdispositif: 3,
          }
        ],
        recipients: [
          {
            caraccomplrecips: [
              {
                caraccomplrecip: "en verre",
                numordreedit: 1
              },
              {
                caraccomplrecip: "brun",
                numordreedit: 2,
              },
            ],
            nbrrecipient: 1,
            numrecipient: 1,
            qtecontenance: 13.19999981,
            recipient: "flacon(s)",
            unitecontenance: "ml",
          }
        ],
      }
    ];
    const cleanResult: AgregatePresentationDetails[] = cleanPresentationsDetails(presDetails);
    expect(cleanResult).toStrictEqual(cleanPresDetails);
  });

  it("cleanPresentationsDetails - two recipients", async () => {
    //CIS : 60206332
    const presDetails: PresentationDetail[] = [
      {
        caraccomplrecip: "PVDC",
        codecip13: "3400935753274",
        dispositif: "",
        nbrrecipient: 0,
        nom_presentation: "plaquette(s) PVC-Aluminium PVDC de 12 comprimé(s) - plaquette(s) PVC-Aluminium de 4 comprimé(s)",
        nomelement: "comprimé blanc",
        numdispositif: 0,
        numelement: 1,
        numordreedit: 2,
        numrecipient: 1,
        qtecontenance: 12,
        recipient: "plaquette(s)",
        unitecontenance: "comprimé(s)",
      },
      {
        caraccomplrecip: "PVC-Aluminium",
        codecip13: "3400935753274",
        dispositif: "",
        nbrrecipient: 0,
        nom_presentation: "plaquette(s) PVC-Aluminium PVDC de 12 comprimé(s) - plaquette(s) PVC-Aluminium de 4 comprimé(s)",
        nomelement: "comprimé blanc",
        numdispositif: 0,
        numelement: 1,
        numordreedit: 1,
        numrecipient: 1,
        qtecontenance: 12,
        recipient: "plaquette(s)",
        unitecontenance: "comprimé(s)",
      },
      {
        caraccomplrecip: "PVDC",
        codecip13: "3400935753274",
        dispositif: "",
        nbrrecipient: 0,
        nom_presentation: "plaquette(s) PVC-Aluminium PVDC de 12 comprimé(s) - plaquette(s) PVC-Aluminium de 4 comprimé(s)",
        nomelement: "comprimé bleu",
        numdispositif: 0,
        numelement: 2,
        numordreedit: 2,
        numrecipient: 2,
        qtecontenance: 4,
        recipient: "plaquette(s)",
        unitecontenance: "comprimé(s)",
      },
      {
        caraccomplrecip: "PVC-Aluminium",
        codecip13: "3400935753274",
        dispositif: "",
        nbrrecipient: 0,
        nom_presentation: "plaquette(s) PVC-Aluminium PVDC de 12 comprimé(s) - plaquette(s) PVC-Aluminium de 4 comprimé(s)",
        nomelement: "comprimé bleu",
        numdispositif: 0,
        numelement: 2,
        numordreedit: 1,
        numrecipient: 2,
        qtecontenance: 4,
        recipient: "plaquette(s)",
        unitecontenance: "comprimé(s)",
      },
    ];
    const cleanPresDetails: AgregatePresentationDetails[] = [
      {
        codecip13: "3400935753274",
        dispositifs: [],
        recipients: [
          {
            caraccomplrecips: [
              {
                caraccomplrecip: "PVC-Aluminium",
                numordreedit: 1
              },
              {
                caraccomplrecip: "PVDC",
                numordreedit: 2,
              },
            ],
            nbrrecipient: 0,
            numrecipient: 1,
            qtecontenance: 12,
            recipient: "plaquette(s)",
            unitecontenance: "comprimé(s)",
          },
          {
            caraccomplrecips: [
              {
                caraccomplrecip: "PVC-Aluminium",
                numordreedit: 1
              },
              {
                caraccomplrecip: "PVDC",
                numordreedit: 2,
              },
            ],
            nbrrecipient: 0,
            numrecipient: 2,
            qtecontenance: 4,
            recipient: "plaquette(s)",
            unitecontenance: "comprimé(s)",
          }
        ],
      }
    ];
    const cleanResult: AgregatePresentationDetails[] = cleanPresentationsDetails(presDetails);
    expect(cleanResult).toStrictEqual(cleanPresDetails);
  });
});