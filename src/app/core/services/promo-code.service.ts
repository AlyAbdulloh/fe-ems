import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GlobalComponent } from '../../global-component';
import { ApiResponse } from '../models/api-response.model';

const API_URL = GlobalComponent.API_URL;

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export interface PromoCode {
  id: string;
  eventId: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  maxUsage: number;
  usedCount?: number;
  validFrom?: string;
  validUntil?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePromoCodeRequest {
  eventId: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  maxUsage: number;
  validFrom?: string;
  validUntil?: string;
}

@Injectable({ providedIn: 'root' })
export class PromoCodeService {
  constructor(private http: HttpClient) { }

  async findByEventId(eventId: string): Promise<ApiResponse<PromoCode[]>> {
    return await firstValueFrom(
      this.http.get<ApiResponse<PromoCode[]>>(`${API_URL}promo-codes/event/${eventId}`),
    );
  }

  async create(data: CreatePromoCodeRequest): Promise<ApiResponse<PromoCode>> {
    return await firstValueFrom(
      this.http.post<ApiResponse<PromoCode>>(`${API_URL}promo-codes`, data),
    );
  }

  async update(id: string, data: Partial<CreatePromoCodeRequest>): Promise<ApiResponse<PromoCode>> {
    return await firstValueFrom(
      this.http.patch<ApiResponse<PromoCode>>(`${API_URL}promo-codes/${id}`, data),
    );
  }

  async delete(id: string): Promise<ApiResponse<any>> {
    return await firstValueFrom(
      this.http.delete<ApiResponse<any>>(`${API_URL}promo-codes/${id}`),
    );
  }

  async checkPromoCode(code?: string, eventId?: string): Promise<ApiResponse<PromoCode>> {
    return await firstValueFrom(
      this.http.post<ApiResponse<PromoCode>>(`${API_URL}promo-codes/check`, { code, eventId }),
    );
  }
}
