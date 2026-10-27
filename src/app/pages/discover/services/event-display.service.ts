import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { EventItem } from '../../../core/services/event.service';
import { User } from '../../../core/models/user.model';

@Injectable({ providedIn: 'root' })
export class EventDisplayService {
  private readonly apiUrl = environment.url;

  /**
   * Format ISO date string into readable Indonesian format.
   * Example: "Minggu, 15 Maret 2026"
   */
  formatEventDate(dateStr?: string): string {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }

  /**
   * Format event time range (HH:mm - HH:mm WIB).
   */
  formatEventTime(startStr?: string, endStr?: string): string {
    if (!startStr) return '-';
    try {
      const start = new Date(startStr);
      const startFormatted = start.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });

      if (endStr) {
        const end = new Date(endStr);
        const endFormatted = end.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        });
        return `${startFormatted} - ${endFormatted} WIB`;
      }
      return `${startFormatted} WIB`;
    } catch {
      return '';
    }
  }

  /**
   * Format Rupiah currency.
   */
  formatRupiah(amount: number | string): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num) || num <= 0) return 'Gratis';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  }

  /**
   * Get lowest ticket price display.
   */
  getStartingPrice(event: EventItem): string {
    if (event.pricingType === 'FREE') {
      return 'Gratis';
    }
    if (event.ticketTypes && event.ticketTypes.length > 0) {
      const validPrices = event.ticketTypes
        .map((t) => parseFloat(t.price))
        .filter((p) => !isNaN(p) && p > 0);
      if (validPrices.length > 0) {
        return `Mulai ${this.formatRupiah(Math.min(...validPrices))}`;
      }
    }
    return 'Berbayar';
  }

  /**
   * Safe image URL getter with aesthetic fallbacks.
   */
  getEventImage(event: EventItem, index = 0): string {
    if (event.bannerImage) {
      if (event.bannerImage.startsWith('http://') || event.bannerImage.startsWith('https://')) {
        return event.bannerImage;
      }
      return `${this.apiUrl}${event.bannerImage.startsWith('/') ? event.bannerImage : '/' + event.bannerImage}`;
    }

    const fallbacks = [
      'assets/images/small/img-3.jpg',
      'assets/images/small/img-4.jpg',
      'assets/images/small/img-7.jpg',
      'assets/images/small/img-8.jpg',
      'assets/images/small/img-10.jpg',
      'assets/images/small/img-1.jpg',
    ];
    return fallbacks[index % fallbacks.length];
  }

  /**
   * Human-friendly venue / format label for an event.
   */
  getVenueLabel(event: EventItem | null | undefined): string {
    if (!event) return '';
    const venue = event.venue;
    if (event.eventType === 'ONLINE') return 'Virtual (Online)';
    if (event.eventType === 'HYBRID') return venue?.name ? `Hybrid: ${venue.name}` : 'Hybrid';
    return venue?.city || venue?.name || 'Offline';
  }

  /**
   * Remix icon class for an event's mode (online / hybrid / offline).
   */
  getEventTypeIcon(event: EventItem | null | undefined): string {
    if (!event) return 'ri-building-line';
    if (event.eventType === 'ONLINE') return 'ri-global-line';
    if (event.eventType === 'HYBRID') return 'ri-shuffle-line';
    return 'ri-building-line';
  }

  /**
   * True when an event has ended or has been cancelled.
   */
  isEventPast(event: EventItem | null | undefined): boolean {
    if (!event) return false;
    if (event.status === 'COMPLETED' || event.status === 'CANCELLED') {
      return true;
    }
    if (event.endDatetime) {
      return new Date(event.endDatetime).getTime() < new Date().getTime();
    }
    return false;
  }

  /**
   * True when the event belongs to the given user (as organizer).
   */
  isMyEvent(user: User | null | undefined, event: EventItem | null | undefined): boolean {
    if (!user || !event) return false;
    if (event.organizer?.user?.id && event.organizer.user.id === user.id) {
      return true;
    }
    if (
      user.organizer?.id &&
      (event.organizerId === user.organizer.id || event.organizer?.id === user.organizer.id)
    ) {
      return true;
    }
    return false;
  }

  /**
   * Escape a string for safe interpolation inside HTML (e.g. Swal markup).
   */
  escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
