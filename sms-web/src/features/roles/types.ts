export interface Role {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export interface Permission {
  id: string;
  code: string;
  description: string | null;
}
