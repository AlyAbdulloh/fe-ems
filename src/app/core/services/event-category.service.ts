import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GlobalComponent } from '../../global-component';
import { ApiResponse } from '../models/api-response.model';

const API_URL = GlobalComponent.API_URL;

export interface EventCategory {
  id: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class EventCategoryService {
  constructor(private http: HttpClient) {}

  async findAll(): Promise<ApiResponse<EventCategory[]>> {
    return await firstValueFrom(
      this.http.get<ApiResponse<EventCategory[]>>(`${API_URL}event-categories`),
    );
  }

  async findOne(id: string): Promise<ApiResponse<EventCategory>> {
    return await firstValueFrom(
      this.http.get<ApiResponse<EventCategory>>(`${API_URL}event-categories/${id}`),
    );
  }

  async create(name: string): Promise<ApiResponse<EventCategory>> {
    return await firstValueFrom(
      this.http.post<ApiResponse<EventCategory>>(`${API_URL}event-categories`, { name }),
    );
  }

  async update(id: string, name: string): Promise<ApiResponse<EventCategory>> {
    return await firstValueFrom(
      this.http.patch<ApiResponse<EventCategory>>(`${API_URL}event-categories/${id}`, { name }),
    );
  }

  async remove(id: string): Promise<ApiResponse<null>> {
    return await firstValueFrom(
      this.http.delete<ApiResponse<null>>(`${API_URL}event-categories/${id}`),
    );
  }
}
