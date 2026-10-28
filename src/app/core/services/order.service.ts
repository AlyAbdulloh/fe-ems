import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GlobalComponent } from '../../global-component';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';

const API_URL = GlobalComponent.API_URL;

export type OrderStatusType = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'EXPIRED';
export type PaymentStatusType = 'PENDING' | 'PAID' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'EXPIRED' | 'UNPAID';

export interface OrderTicketTypeView {
  name: string | null;
  price: number | null;
}

export interface OrderItemView {
  id: string;
  quantity: number;
  subtotal: number;
  ticketType: OrderTicketTypeView;
}

export interface OrderEventView {
  id: string;
  title: string;
  slug: string;
  bannerImage?: string;
  startDatetime: string;
  endDatetime: string;
  venue?: {
    name?: string;
    city?: string;
  };
}

export interface OrderPaymentView {
  method: string | null;
  amount: number;
  status: PaymentStatusType;
  paidAt: string | null;
}

export interface OrderView {
  id: string;
  totalAmount: number;
  status: OrderStatusType;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  payment: OrderPaymentView;
  items: OrderItemView[];
  event: OrderEventView;
}

export interface QueryOrderParams {
  page?: number;
  limit?: number;
  status?: OrderStatusType;
}

export type PaymentMethod = 'BANK_TRANSFER' | 'VIRTUAL_ACCOUNT' | 'EWALLET' | 'CREDIT_CARD';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private http: HttpClient) {}

  async findMyOrders(params?: QueryOrderParams): Promise<PaginatedResponse<OrderView>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.status) httpParams = httpParams.set('status', params.status);
    }
    return await firstValueFrom(
      this.http.get<PaginatedResponse<OrderView>>(`${API_URL}orders/my`, {
        params: httpParams,
      }),
    );
  }

  async findOne(id: string): Promise<ApiResponse<OrderView>> {
    return await firstValueFrom(
      this.http.get<ApiResponse<OrderView>>(`${API_URL}orders/${id}`),
    );
  }

  async pay(id: string, data: { paymentMethod: PaymentMethod }): Promise<ApiResponse<OrderView>> {
    return await firstValueFrom(
      this.http.post<ApiResponse<OrderView>>(`${API_URL}orders/${id}/pay`, data),
    );
  }
}
