import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GlobalComponent } from '../../global-component';
import { ApiResponse } from '../models/api-response.model';

const API_URL = GlobalComponent.API_URL;

export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  price: number;
  quota: number;
  soldCount: number;
  saleStartDate?: string;
  saleEndDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTicketTypeRequest {
  eventId: string;
  name: string;
  price: number;
  quota: number;
  saleStartDate?: string;
  saleEndDate?: string;
}

@Injectable({ providedIn: 'root' })
export class TicketTypeService {
  constructor(private http: HttpClient) {}

  async findByEventId(eventId: string): Promise<ApiResponse<TicketType[]>> {
    return await firstValueFrom(
      this.http.get<ApiResponse<TicketType[]>>(`${API_URL}ticket-types/event/${eventId}`),
    );
  }

  async findOne(id: string): Promise<ApiResponse<TicketType>> {
    return await firstValueFrom(
      this.http.get<ApiResponse<TicketType>>(`${API_URL}ticket-types/${id}`),
    );
  }

  async create(data: CreateTicketTypeRequest): Promise<ApiResponse<TicketType>> {
    return await firstValueFrom(
      this.http.post<ApiResponse<TicketType>>(`${API_URL}ticket-types`, data),
    );
  }

  async update(id: string, data: Partial<CreateTicketTypeRequest>): Promise<ApiResponse<TicketType>> {
    return await firstValueFrom(
      this.http.patch<ApiResponse<TicketType>>(`${API_URL}ticket-types/${id}`, data),
    );
  }

  async delete(id: string): Promise<ApiResponse<any>> {
    return await firstValueFrom(
      this.http.delete<ApiResponse<any>>(`${API_URL}ticket-types/${id}`),
    );
  }
}
