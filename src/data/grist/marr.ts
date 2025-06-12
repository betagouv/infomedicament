import "server-only";
import { getGristTableData } from "@/data/grist/index";
import { MarrPdf } from "@/types/MarrTypes";

export async function getMarr(CIS: string): Promise<MarrPdf[]> {
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

  //Key is URL
  marrCis.forEach(( marrByCIS ) => {
    const allCIS: string[] = (marrByCIS.fields.CIS as string).split(','); //For the URL
    if(!allCIS.find((c:string) => c.trim() === CIS)) {
      return;
    }

    marrPdf.forEach(
      (pdf) => {
        if(marrByCIS.id === (pdf.fields.URL as number)){
          allPDF.push({
            ansmUrl: (marrByCIS.fields.URL as string).trim(),
            filename: (pdf.fields.Nom_document as string).trim(),
            fileUrl: `https://ansm.sante.fr${(pdf.fields.URL_document as string).trim()}`,
            type: (pdf.fields.Type as string).trim(),
          })
        }
      }
    ); //PDF for the URL (array)
  });

  return allPDF;
}
