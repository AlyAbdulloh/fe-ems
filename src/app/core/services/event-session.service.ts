import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GlobalComponent } from '../../global-component';
import { ApiResponse } from '../models/api-response.model';
import { Speaker } from './speaker.service';

const API_URL = GlobalComponent.API_URL;

export interface EventSession {
  id: string;
  eventId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  roomOrTrack?: string;
  speakerId?: string;
  speaker?: Speaker;
}

export interface CreateEventSessionRequest {
  eventId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  roomOrTrack?: string;
  speakerId?: string;
}

@Injectable({ providedIn: 'root' })
export class EventSessionService {
  constructor(private http: HttpClient) {}

  async findByEventId(eventId: string): Promise<ApiResponse<EventSession[]>> {
    return await firstValueFrom(
      this.http.get<ApiResponse<EventSession[]>>(`${API_URL}event-sessions/event/${eventId}`),
    );
  }

  async create(data: CreateEventSessionRequest): Promise<ApiResponse<EventSession>> {
    return await firstValueFrom(
      this.http.post<ApiResponse<EventSession>>(`${API_URL}event-sessions`, data),
    );
  }

  async update(id: string, data: Partial<CreateEventSessionRequest>): Promise<ApiResponse<EventSession>> {
    return await firstValueFrom(
      this.http.patch<ApiResponse<EventSession>>(`${API_URL}event-sessions/${id}`, data),
    );
  }

  async delete(id: string): Promise<ApiResponse<any>> {
    return await firstValueFrom(
      this.http.delete<ApiResponse<any>>(`${API_URL}event-sessions/${id}`),
    );
  }
}
