export interface PediatricsInfo {
  indication: boolean;
  contraindication: boolean;
  doctorAdvice: boolean;
  mention:boolean;
}

export interface AllPediatricsInfo extends PediatricsInfo {
  CIS: string;
}