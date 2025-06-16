import "server-only";
import { getGristTableData } from "@/data/grist/index";
import { Marr, MarrPdf } from "@/types/MarrTypes";

export async function getMarr(CIS: string): Promise<Marr> {
  const marrCis = await getGristTableData("MARR_URL_CIS", [
    "URL",
    "CIS"
  ]);
  const marrPdf = await getGristTableData("MARR_URL_PDF", [
    "URL", //Ref to marrCis
    "Nom_document",
    "URL_document",
    "Type",
  ]);

  const allPDF: MarrPdf[] = [];
  const marr: Marr = {
    CIS: CIS,
    ansmUrl: "",
    pdf: [],
  };

  //Key is URL
  marrCis.forEach(( marrByCIS ) => {
    const allCIS: string[] = (marrByCIS.fields.CIS as string).split(','); //For the URL
    if(!allCIS.find((c:string) => c.trim() === CIS)) {
      return;
    }

    marr.ansmUrl = (marrByCIS.fields.URL as string).trim(),
    marrPdf.forEach(
      (pdf) => {
        if(marrByCIS.id === (pdf.fields.URL as number)){
          marr.pdf.push({
            filename: (pdf.fields.Nom_document as string).trim(),
            fileUrl: `https://ansm.sante.fr${(pdf.fields.URL_document as string).trim()}`,
            type: (pdf.fields.Type as string).trim(),
          })
        }
      }
    ); //PDF for the URL (array)
  });

  return marr;
}
