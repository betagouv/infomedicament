export type MarrPdf = {
  filename: string,
  fileUrl: string,
  type: string,
}

export type Marr = {
  CIS: string,
  ansmUrl: string,
  pdf: MarrPdf[],
}