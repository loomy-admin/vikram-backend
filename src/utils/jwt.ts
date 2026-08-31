import jwt from 'jsonwebtoken';
import { config } from '../config';
import { TokenPayload } from '../types';

export function signJwt(payload: TokenPayload, customExpiresIn?: string): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: (customExpiresIn || config.jwt.expiresIn) as any,
  });
}

export function verifyJwt(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}
