import { Request } from "express";

const BEARER_TOKEN_PATTERN = /^Bearer\s+([a-f\d]{64})$/i;

export const getBearerToken = (request: Request): string | undefined => {
  const authorization = request.header("authorization")?.trim();
  if (!authorization) return undefined;
  return BEARER_TOKEN_PATTERN.exec(authorization)?.[1];
};
