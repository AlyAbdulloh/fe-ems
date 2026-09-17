import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject, Observable, firstValueFrom, Subscription } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { GlobalComponent } from '../../global-component';
import { ApiResponse, PaginatedResponse } from '../models/api-response.model';
import { Venue } from './venue.service';
import { EventCategory } from './event-category.service';

const API_URL = GlobalComponent.API_URL;

interface LayoutEvent {
  type: string;
  payload?: any;
}

export type EventStatusType = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';

export interface EventItem {
  id: string;
  organizerId: string;
  venueId?: string;
  categoryId?: string;
  title: string;
  slug: string;
  description?: string;
  bannerImage?: string;
  startDatetime: string;
  endDatetime: string;
  status: EventStatusType;
  createdAt: string;
  updatedAt: string;
  organizer?: {
    id: string;
    organizationName: string;
    status: string;
    user?: {
      id: string;
      name: string;
      email: string;
    };
  };
  venue?: Venue;
  category?: EventCategory;
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  categoryId?: string;
  venueId?: string;
  bannerImage?: string;
  startDatetime: string;
  endDatetime: string;
  status?: EventStatusType;
}

export interface QueryEventParams {
  page?: number;
  limit?: number;
  status?: EventStatusType;
  categoryId?: string;
  venueId?: string;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class EventService {
  private handler = new Subject<LayoutEvent>();

  constructor(private http: HttpClient) {}

  /**
   * Broadcast the layout event
   */
  broadcast(type: string, payload?: any) {
    this.handler.next({ type, payload });
  }

  /**
   * Subscribe to the layout event
   */
  subscribe(type: string, callback: (payload: any) => void): Subscription {
    return this.handler
      .pipe(
        filter((event) => event.type === type),
        map((event) => event.payload),
      )
      .subscribe(callback);
  }

  /**
   * Create a new event (Approved Organizer)
   */
  async create(data: CreateEventRequest): Promise<ApiResponse<EventItem>> {
    return await firstValueFrom(
      this.http.post<ApiResponse<EventItem>>(`${API_URL}events`, data),
    );
  }

  /**
   * Get logged-in organizer's own events
   */
  async findMyEvents(params?: QueryEventParams): Promise<PaginatedResponse<EventItem>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.categoryId) httpParams = httpParams.set('categoryId', params.categoryId);
      if (params.search) httpParams = httpParams.set('search', params.search);
    }

    return await firstValueFrom(
      this.http.get<PaginatedResponse<EventItem>>(`${API_URL}events/my-events`, {
        params: httpParams,
      }),
    );
  }

  /**
   * Get all public/filtered events
   */
  async findAll(params?: QueryEventParams): Promise<PaginatedResponse<EventItem>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.categoryId) httpParams = httpParams.set('categoryId', params.categoryId);
      if (params.venueId) httpParams = httpParams.set('venueId', params.venueId);
      if (params.search) httpParams = httpParams.set('search', params.search);
    }

    return await firstValueFrom(
      this.http.get<PaginatedResponse<EventItem>>(`${API_URL}events`, {
        params: httpParams,
      }),
    );
  }

  /**
   * Get event details by ID
   */
  async findOne(id: string): Promise<ApiResponse<EventItem>> {
    return await firstValueFrom(
      this.http.get<ApiResponse<EventItem>>(`${API_URL}events/${id}`),
    );
  }

  /**
   * Get event details by Slug
   */
  async findBySlug(slug: string): Promise<ApiResponse<EventItem>> {
    return await firstValueFrom(
      this.http.get<ApiResponse<EventItem>>(`${API_URL}events/slug/${slug}`),
    );
  }

  /**
   * Update event details (Owner only)
   */
  async update(id: string, data: Partial<CreateEventRequest>): Promise<ApiResponse<EventItem>> {
    return await firstValueFrom(
      this.http.patch<ApiResponse<EventItem>>(`${API_URL}events/${id}`, data),
    );
  }

  /**
   * Update event lifecycle status (Owner only)
   */
  async updateStatus(id: string, status: EventStatusType): Promise<ApiResponse<EventItem>> {
    return await firstValueFrom(
      this.http.patch<ApiResponse<EventItem>>(`${API_URL}events/${id}/status`, { status }),
    );
  }

  /**
   * Upload event banner image (Max 5MB, JPG/JPEG/PNG)
   */
  async uploadBanner(file: File): Promise<ApiResponse<{ message: string; url: string; filename: string }>> {
    const formData = new FormData();
    formData.append('bannerImage', file);
    return await firstValueFrom(
      this.http.post<ApiResponse<{ message: string; url: string; filename: string }>>(
        `${API_URL}events/upload-banner`,
        formData,
      ),
    );
  }
}

