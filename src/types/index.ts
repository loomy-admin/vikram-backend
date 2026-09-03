import { Request } from 'express';
import { SchoolStatus, StudentStatus, ClassStatus, AccessCodeStatus, AdminStatus, SubjectStatus, ChapterStatus, TopicStatus, ContentType, ContentStatus } from './enums';

export type UserRole = 'STUDENT' | 'ADMIN' | 'UNREGISTERED_STUDENT';

export interface TokenPayload {
  userId: number;
  role: UserRole;
  email?: string | null;
  phone?: string | null;
  schoolId?: number;
  classId?: number;
  status?: string;
  isTemporary?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  code?: string;
  errors?: any;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
