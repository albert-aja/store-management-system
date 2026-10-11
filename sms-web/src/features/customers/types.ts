export interface Customer {
  id: string;
  fullName: string;
  nik: string | null;
  primaryPhone: string | null;
  primaryEmail: string | null;
  active: boolean;
}

export interface CustomerInput {
  fullName: string;
  nik?: string;
  primaryPhone?: string;
  primaryEmail?: string;
}

export interface CustomerContact {
  id: string;
  contactType: string;
  label: string | null;
  value: string;
  notes: string | null;
  active: boolean;
}

export interface ContactInput {
  contactType: string;
  label?: string;
  value: string;
  notes?: string;
}

export interface CustomerAddress {
  id: string;
  label: string | null;
  addressLine: string;
  notes: string | null;
  primary: boolean;
  active: boolean;
}

export interface AddressInput {
  label?: string;
  addressLine: string;
  notes?: string;
  primary: boolean;
}
