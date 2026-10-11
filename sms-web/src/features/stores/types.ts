export interface Store {
  id: string;
  code: string;
  name: string;
  address: string | null;
  active: boolean;
}

export interface StoreInput {
  code: string;
  name: string;
  address?: string;
}
