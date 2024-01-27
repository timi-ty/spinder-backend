import { Request, Response } from "express";

export function authenticateRequest(
  req: Request,
  res: Response,
  next: (error: Error) => void
) {}
