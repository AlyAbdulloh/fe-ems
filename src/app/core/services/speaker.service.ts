import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GlobalComponent } from '../../global-component';
import { ApiResponse } from '../models/api-response.model';

const API_URL = GlobalComponent.API_URL;

export interface Speaker {
  id: string;
  name: string;
  bio?: string;
  company?: string;
  photo?: string;
}

export interface CreateSpeakerRequest {
  name: string;
  bio?: string;
  company?: string;
  photo?: string;
}

@Injectable({ providedIn: 'root' })
export class SpeakerService {
  constructor(private http: HttpClient) {}

  async findAll(search?: string): Promise<ApiResponse<Speaker[]>> {
    let params = new HttpParams();
    if (search) {
      params = params.set('search', search);
    }
    return await firstValueFrom(
      this.http.get<ApiResponse<Speaker[]>>(`${API_URL}speakers`, { params }),
    );
  }

  async findOne(id: string): Promise<ApiResponse<Speaker>> {
    return await firstValueFrom(
      this.http.get<ApiResponse<Speaker>>(`${API_URL}speakers/${id}`),
    );
  }

  async create(data: CreateSpeakerRequest): Promise<ApiResponse<Speaker>> {
    return await firstValueFrom(
      this.http.post<ApiResponse<Speaker>>(`${API_URL}speakers`, data),
    );
  }

  async update(id: string, data: Partial<CreateSpeakerRequest>): Promise<ApiResponse<Speaker>> {
    return await firstValueFrom(
      this.http.patch<ApiResponse<Speaker>>(`${API_URL}speakers/${id}`, data),
    );
  }

  async delete(id: string): Promise<ApiResponse<any>> {
    return await firstValueFrom(
      this.http.delete<ApiResponse<any>>(`${API_URL}speakers/${id}`),
    );
  }
}
