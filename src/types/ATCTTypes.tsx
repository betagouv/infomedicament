export interface ATC {
  code: string;
  label: string;
  description: string;
  children?: ATC[];
}

export interface ATC1 extends ATC {
  children: ATC[];
}