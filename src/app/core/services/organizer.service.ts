import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GlobalComponent } from '../../global-component';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';
import { OrganizerProfile } from '../models/user.model';

const API_URL = GlobalComponent.API_URL;

export interface ApplyOrganizerRequest {
  organizationName: string;
  description?: string;
}

export interface UpdateOrganizerRequest {
  organizationName?: string;
  description?: string;
}

export interface QueryOrganizerParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class OrganizerService {
  constructor(private http: HttpClient) {}

  /**
   * Apply to become an organizer
   */
  async apply(data: ApplyOrganizerRequest): Promise<ApiResponse<OrganizerProfile>> {
    return await firstValueFrom(
      this.http.post<ApiResponse<OrganizerProfile>>(
        `${API_URL}organizers/apply`,
        data,
      ),
    );
  }

  /**
   * Get current user's organizer profile
   */
  async getProfile(): Promise<ApiResponse<OrganizerProfile>> {
    return await firstValueFrom(
      this.http.get<ApiResponse<OrganizerProfile>>(`${API_URL}organizers/me`),
    );
  }

  /**
   * Update current user's organizer profile
   */
  async updateProfile(
    data: UpdateOrganizerRequest,
  ): Promise<ApiResponse<OrganizerProfile>> {
    return await firstValueFrom(
      this.http.patch<ApiResponse<OrganizerProfile>>(
        `${API_URL}organizers/me`,
        data,
      ),
    );
  }

  /**
   * List all organizers (Admin or public search)
   */
  async findAll(
    params?: QueryOrganizerParams,
  ): Promise<PaginatedResponse<OrganizerProfile>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.search) httpParams = httpParams.set('search', params.search);
    }

    return await firstValueFrom(
      this.http.get<PaginatedResponse<OrganizerProfile>>(
        `${API_URL}organizers`,
        { params: httpParams },
      ),
    );
  }

  /**
   * Get organizer detail by ID
   */
  async findOne(id: string): Promise<ApiResponse<OrganizerProfile>> {
    return await firstValueFrom(
      this.http.get<ApiResponse<OrganizerProfile>>(`${API_URL}organizers/${id}`),
    );
  }

  /**
   * Admin updates organizer application status (APPROVED, REJECTED, SUSPENDED)
   */
  async updateStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'PENDING',
  ): Promise<ApiResponse<OrganizerProfile>> {
    return await firstValueFrom(
      this.http.patch<ApiResponse<OrganizerProfile>>(
        `${API_URL}organizers/${id}/status`,
        { status },
      ),
    );
  }
}
