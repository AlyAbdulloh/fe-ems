import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GlobalComponent } from '../../global-component';
import { ApiResponse } from '../models/api-response.model';

const API_URL = GlobalComponent.API_URL;

export interface EventRegistrationItemDto {
  ticketTypeId: string;
  quantity: number;
  tickets?: Array<{
    attendeeName: string;
    attendeeEmail: string;
  }>;
}

export interface PromoCodeRegistrationDto {
  id: string;
  code: string;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number;
}

export interface CreateEventRegistrationDto {
  eventId: string;
  pricingType?: 'FREE' | 'PAID';
  promoCode?: PromoCodeRegistrationDto | null;
  totalAmount?: number;
  items?: EventRegistrationItemDto[];
  tickets?: Array<{
    ticketTypeId: string;
    attendeeName: string;
    attendeeEmail: string;
  }>;
  attendees?: Array<{
    attendeeName: string;
    attendeeEmail: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class EventRegistrationService {
  constructor(private http: HttpClient) { }

  /**
   * Mendaftarkan pengguna ke suatu event
   */
  async create(data: CreateEventRegistrationDto): Promise<any> {
    return await firstValueFrom(
      this.http.post<any>(`${API_URL}event-registrations`, data)
    );
  }

  /**
   * Mengambil riwayat pendaftaran pengguna saat ini
   */
  async findMyRegistrations(query?: any): Promise<ApiResponse<any>> {
    return await firstValueFrom(
      this.http.get<ApiResponse<any>>(`${API_URL}event-registrations/my`, { params: query })
    );
  }

  /**
   * Mengambil daftar pendaftaran untuk event tertentu
   */
  async findByEventId(eventId: string): Promise<ApiResponse<any>> {
    return await firstValueFrom(
      this.http.get<ApiResponse<any>>(`${API_URL}event-registrations/event/${eventId}`)
    );
  }
}
