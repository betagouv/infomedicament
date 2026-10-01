export enum StockStatusID {
  RUPTURE = 1,
  TENSION = 2,
  ARRET = 3,
  DISPO = 4,
}

export type AnsmStock = {
  CIS: string;
  CIP?: string[];
  status_id: StockStatusID;
  status: string;
  date_begin: Date;
  date_update: Date;
  date_end?: Date;
  link?: string;
}