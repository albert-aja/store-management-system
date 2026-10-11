export interface Employee {
  id: string;
  employeeNumber: string;
  fullName: string;
  nik: string | null;
  phone: string | null;
  email: string | null;
  employmentType: "PERMANENT" | "FREELANCE";
  employmentStatus: "ACTIVE" | "INACTIVE";
  authUserId: string | null;
  roleCodes: string[];
  storeIds: string[];
  supervisorEmployeeId: string | null;
}

export interface EmployeeInput {
  employeeNumber: string;
  fullName: string;
  nik?: string;
  phone?: string;
  email?: string;
  employmentType: "PERMANENT" | "FREELANCE";
}
