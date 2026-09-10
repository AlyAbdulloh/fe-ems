export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  user?: T;
  access_token?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T = any> {
  message: string;
  data: T[];
  meta: PaginationMeta;
}
