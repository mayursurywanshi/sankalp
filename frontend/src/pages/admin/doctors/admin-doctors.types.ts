export type DoctorCredentialStatus = "PENDING" | "ACTIVE";

export type Doctor = {
  doctorId: string;
  loginId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  designation: string;
  joiningDate: string;
  dateOfBirth: string;
  credentialStatus: DoctorCredentialStatus;
  isActive: boolean;
  createdAt: string;
};

export type DoctorForm = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  designation: string;
  joiningDate: string;
  dateOfBirth: string;
  password: string;
};

export type DoctorResponse = { success: boolean; message: string; data?: Doctor; errors?: Record<string, string[]> };
export type DoctorListResponse = { success: boolean; message?: string; data?: Doctor[] };
export type DeleteDoctorResponse = { success: boolean; message: string; data?: { doctorId: string } };
