import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GlobalComponent } from '../../global-component';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';

const API_URL = GlobalComponent.API_URL;

export interface Venue {
  id: string;
  name: string;
  address?: string;
  city?: string;
  capacity?: number;
  latitude?: number;
  longitude?: number;
  type: 'OFFLINE' | 'ONLINE' | 'HYBRID';
  meetingUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVenueRequest {
  name: string;
  address?: string;
  city?: string;
  capacity?: number;
  latitude?: number;
  longitude?: number;
  type?: 'OFFLINE' | 'ONLINE' | 'HYBRID';
  meetingUrl?: string;
}

export interface QueryVenueParams {
  page?: number;
  limit?: number;
  city?: string;
  type?: 'OFFLINE' | 'ONLINE' | 'HYBRID';
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class VenueService {
  constructor(private http: HttpClient) {}

  async findAll(params?: QueryVenueParams): Promise<PaginatedResponse<Venue>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.city) httpParams = httpParams.set('city', params.city);
      if (params.type) httpParams = httpParams.set('type', params.type);
      if (params.search) httpParams = httpParams.set('search', params.search);
    }

    return await firstValueFrom(
      this.http.get<PaginatedResponse<Venue>>(`${API_URL}venues`, {
        params: httpParams,
      }),
    );
  }

  async findOne(id: string): Promise<ApiResponse<Venue>> {
    return await firstValueFrom(
      this.http.get<ApiResponse<Venue>>(`${API_URL}venues/${id}`),
    );
  }

  async create(data: CreateVenueRequest): Promise<ApiResponse<Venue>> {
    return await firstValueFrom(
      this.http.post<ApiResponse<Venue>>(`${API_URL}venues`, data),
    );
  }

  async update(id: string, data: Partial<CreateVenueRequest>): Promise<ApiResponse<Venue>> {
    return await firstValueFrom(
      this.http.patch<ApiResponse<Venue>>(`${API_URL}venues/${id}`, data),
    );
  }

  async remove(id: string): Promise<ApiResponse<null>> {
    return await firstValueFrom(
      this.http.delete<ApiResponse<null>>(`${API_URL}venues/${id}`),
    );
  }
}
