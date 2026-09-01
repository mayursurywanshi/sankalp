import { UserRole } from "../../generated/prisma/enums";

export type AuthenticatedUser = {
  id: string;
  loginId: string;
  fullName: string;
  role: UserRole;
};

export type CreatedAuthenticationSession = {
  token: string;
  expiresAt: Date;
  user: AuthenticatedUser;
};
