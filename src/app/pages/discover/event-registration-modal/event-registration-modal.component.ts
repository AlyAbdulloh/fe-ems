import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import Swal from 'sweetalert2';
import { EventItem } from '../../../core/services/event.service';
import { PromoCodeService } from '../../../core/services/promo-code.service';
import { EventRegistrationService } from '../../../core/services/event-registration.service';
import { User } from '../../../core/models/user.model';
import { EventDisplayService } from '../services/event-display.service';

interface TicketAttendeeInput {
  ticketTypeId: string;
  ticketTypeName: string;
  ticketPrice: number;
  ticketIndex: number;
  typeIndex: number;
  attendeeName: string;
  attendeeEmail: string;
}

interface TicketAttendeePayload {
  attendeeName: string;
  attendeeEmail: string;
}

interface OrderItemPayload {
  ticketTypeId: string;
  quantity: number;
  tickets: TicketAttendeePayload[];
}

interface PromoCodePayload {
  id: string;
  code: string;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number;
}

interface EventRegistrationPayload {
  eventId: string;
  pricingType: 'FREE' | 'PAID';
  promoCode?: PromoCodePayload | null;
  items?: OrderItemPayload[];
  tickets?: Array<{
    ticketTypeId: string;
    attendeeName: string;
    attendeeEmail: string;
  }>;
  attendees?: TicketAttendeePayload[];
  totalAmount?: number;
}

@Component({
  selector: 'app-event-registration-modal',
  templateUrl: './event-registration-modal.component.html',
  styleUrls: ['./event-registration-modal.component.scss'],
})
export class EventRegistrationModalComponent implements OnInit {
  @Input() event!: EventItem;
  @Input() currentUser: User | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() registered = new EventEmitter<void>();

  selectedTicketQuantities: { [ticketTypeId: string]: number } = {};
  isSubmittingRegistration = false;
  ticketAttendees: TicketAttendeeInput[] = [];
  promoCodeInput = '';
  appliedPromo: {
    id?: string;
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
  } | null = null;
  promoError = '';
  isApplyingPromo = false;

  constructor(
    private promoCodeService: PromoCodeService,
    private eventRegistrationService: EventRegistrationService,
    readonly display: EventDisplayService,
  ) {}

  ngOnInit(): void {
    // Initialise quantity of the first available ticket.
    if (this.event.ticketTypes && this.event.ticketTypes.length > 0) {
      const firstAvailable = this.event.ticketTypes.find(
        (t) => (t.quota || 0) - (t.soldCount || 0) > 0,
      );
      if (firstAvailable) {
        this.selectedTicketQuantities[firstAvailable.id] = 1;
      }
    }
    this.syncTicketAttendees();
  }

  close(): void {
    this.closed.emit();
  }

  getTicketQuantity(ticketTypeId: string): number {
    return this.selectedTicketQuantities[ticketTypeId] || 0;
  }

  incrementTicketQuantity(ticket: any): void {
    const availableQuota = (ticket.quota || 0) - (ticket.soldCount || 0);
    if (availableQuota <= 0) return;

    if (this.event.pricingType === 'FREE') {
      this.selectedTicketQuantities = { [ticket.id]: 1 };
      this.syncTicketAttendees();
      return;
    }

    const current = this.getTicketQuantity(ticket.id);
    const maxAllowed = Math.min(availableQuota, 10);
    if (current < maxAllowed) {
      this.selectedTicketQuantities[ticket.id] = current + 1;
      this.syncTicketAttendees();
    }
  }

  selectFreeTicket(ticket: any): void {
    if (this.event.pricingType === 'FREE') {
      this.incrementTicketQuantity(ticket);
    }
  }

  decrementTicketQuantity(ticket: any): void {
    const current = this.getTicketQuantity(ticket.id);
    if (current > 0) {
      const next = current - 1;
      if (next === 0) {
        delete this.selectedTicketQuantities[ticket.id];
      } else {
        this.selectedTicketQuantities[ticket.id] = next;
      }
      this.syncTicketAttendees();
    }
  }

  syncTicketAttendees(): void {
    if (
      this.event.pricingType === 'FREE' &&
      (!this.event.ticketTypes || this.event.ticketTypes.length === 0)
    ) {
      const prev = this.ticketAttendees[0];
      this.ticketAttendees = [
        {
          ticketTypeId: 'FREE',
          ticketTypeName: 'Tiket Gratis',
          ticketPrice: 0,
          ticketIndex: 1,
          typeIndex: 1,
          attendeeName: prev?.attendeeName || this.currentUser?.name || '',
          attendeeEmail: prev?.attendeeEmail || this.currentUser?.email || '',
        },
      ];
      return;
    }

    const newAttendees: TicketAttendeeInput[] = [];
    let globalIndex = 1;

    const existingMap = new Map<string, { attendeeName: string; attendeeEmail: string }>();
    this.ticketAttendees.forEach((a) => {
      existingMap.set(`${a.ticketTypeId}_${a.typeIndex}`, {
        attendeeName: a.attendeeName,
        attendeeEmail: a.attendeeEmail,
      });
      if (!existingMap.has('FIRST_ATTENDEE')) {
        existingMap.set('FIRST_ATTENDEE', {
          attendeeName: a.attendeeName,
          attendeeEmail: a.attendeeEmail,
        });
      }
    });

    for (const item of this.selectedTicketsList) {
      for (let i = 1; i <= item.quantity; i++) {
        const key = `${item.ticket.id}_${i}`;
        const existing = existingMap.get(key) || (globalIndex === 1 ? existingMap.get('FIRST_ATTENDEE') : null);

        let defaultName = existing ? existing.attendeeName : '';
        let defaultEmail = existing ? existing.attendeeEmail : '';

        if (globalIndex === 1 && !defaultName && !defaultEmail) {
          defaultName = this.currentUser?.name || '';
          defaultEmail = this.currentUser?.email || '';
        }

        newAttendees.push({
          ticketTypeId: item.ticket.id,
          ticketTypeName: item.ticket.name,
          ticketPrice: parseFloat(item.ticket.price) || 0,
          ticketIndex: globalIndex,
          typeIndex: i,
          attendeeName: defaultName,
          attendeeEmail: defaultEmail,
        });

        globalIndex++;
      }
    }

    this.ticketAttendees = newAttendees;
  }

  useMyAccountForTicket(attendee: TicketAttendeeInput): void {
    if (this.currentUser) {
      attendee.attendeeName = this.currentUser.name || '';
      attendee.attendeeEmail = this.currentUser.email || '';
    }
  }

  get isAttendeesValid(): boolean {
    if (this.ticketAttendees.length === 0) {
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.ticketAttendees.every(
      (a) => a.attendeeName.trim().length > 0 && emailRegex.test(a.attendeeEmail.trim()),
    );
  }

  get selectedTicketsList(): Array<{ ticket: any; quantity: number; subtotal: number }> {
    if (!this.event.ticketTypes) return [];
    return this.event.ticketTypes
      .filter((t) => this.getTicketQuantity(t.id) > 0)
      .map((t) => {
        const qty = this.getTicketQuantity(t.id);
        const price = parseFloat(t.price) || 0;
        return {
          ticket: t,
          quantity: qty,
          subtotal: qty * price,
        };
      });
  }

  get totalSelectedTicketsCount(): number {
    if (
      this.event.pricingType === 'FREE' &&
      (!this.event.ticketTypes || this.event.ticketTypes.length === 0)
    ) {
      return 1;
    }
    return Object.values(this.selectedTicketQuantities).reduce((acc, qty) => acc + (qty || 0), 0);
  }

  get totalSelectedTicketsAmount(): number {
    if (!this.event || this.event.pricingType === 'FREE') return 0;
    return this.selectedTicketsList.reduce((acc, item) => acc + item.subtotal, 0);
  }

  get discountAmount(): number {
    if (!this.appliedPromo || this.totalSelectedTicketsAmount <= 0) return 0;
    if (this.appliedPromo.discountType === 'PERCENTAGE') {
      return Math.round((this.totalSelectedTicketsAmount * this.appliedPromo.discountValue) / 100);
    }
    return Math.min(this.appliedPromo.discountValue, this.totalSelectedTicketsAmount);
  }

  get finalTotalAmount(): number {
    return Math.max(0, this.totalSelectedTicketsAmount - this.discountAmount);
  }

  async applyPromoCode(code?: string): Promise<void> {
    const rawCode = (code || this.promoCodeInput || '').trim().toUpperCase();
    this.promoError = '';

    if (!rawCode) {
      this.promoError = 'Silakan masukkan kode promo terlebih dahulu.';
      return;
    }

    if (this.totalSelectedTicketsCount === 0 || this.totalSelectedTicketsAmount === 0) {
      this.promoError = 'Pilih tiket terlebih dahulu sebelum menerapkan promo.';
      return;
    }

    this.isApplyingPromo = true;

    try {
      const { data: checkPromo } = await this.promoCodeService.checkPromoCode(
        this.promoCodeInput,
        this.event.id,
      );

      this.appliedPromo = {
        id: checkPromo?.id || '',
        code: checkPromo?.code || '',
        discountType: checkPromo?.discountType || 'PERCENTAGE',
        discountValue: checkPromo?.discountValue || 0,
      };
    } catch {
      this.promoError = 'Kode promo tidak valid atau telah kedaluwarsa.';
    } finally {
      this.isApplyingPromo = false;
      this.promoCodeInput = rawCode;
    }
  }

  removePromoCode(): void {
    this.appliedPromo = null;
    this.promoCodeInput = '';
    this.promoError = '';
  }

  setPromoCode(code: string): void {
    this.promoCodeInput = code;
    this.applyPromoCode(code);
  }

  buildRegistrationPayload(): EventRegistrationPayload | null {
    const isFree = this.event.pricingType === 'FREE';

    if (isFree) {
      const selectedItem = this.selectedTicketsList[0];
      const freeTicketType = selectedItem?.ticket || this.event.ticketTypes?.[0];
      const freeTicketTypeId = freeTicketType?.id || this.event.id;
      const attendee = this.ticketAttendees[0] || {
        attendeeName: this.currentUser?.name || '',
        attendeeEmail: this.currentUser?.email || '',
      };

      const attendeeObj = {
        attendeeName: attendee.attendeeName.trim(),
        attendeeEmail: attendee.attendeeEmail.trim(),
      };

      return {
        eventId: this.event.id,
        pricingType: 'FREE',
        promoCode: null,
        totalAmount: 0,
        items: [
          {
            ticketTypeId: freeTicketTypeId,
            quantity: 1,
            tickets: [attendeeObj],
          },
        ],
        tickets: [
          {
            ticketTypeId: freeTicketTypeId,
            attendeeName: attendeeObj.attendeeName,
            attendeeEmail: attendeeObj.attendeeEmail,
          },
        ],
        attendees: [attendeeObj],
      };
    }

    const items: OrderItemPayload[] = this.selectedTicketsList.map((item) => {
      const ticketsForThisType: TicketAttendeePayload[] = this.ticketAttendees
        .filter((a) => a.ticketTypeId === item.ticket.id)
        .map((a) => ({
          attendeeName: a.attendeeName.trim(),
          attendeeEmail: a.attendeeEmail.trim(),
        }));

      return {
        ticketTypeId: item.ticket.id,
        quantity: item.quantity,
        tickets: ticketsForThisType,
      };
    });

    const flatTickets = this.ticketAttendees.map((a) => ({
      ticketTypeId: a.ticketTypeId,
      attendeeName: a.attendeeName.trim(),
      attendeeEmail: a.attendeeEmail.trim(),
    }));

    const promoCodeData: PromoCodePayload | null = this.appliedPromo
      ? {
          id: this.appliedPromo.id || '',
          code: this.appliedPromo.code,
          discountType: this.appliedPromo.discountType,
          discountValue: this.appliedPromo.discountValue,
        }
      : null;

    return {
      eventId: this.event.id,
      pricingType: 'PAID',
      promoCode: promoCodeData,
      totalAmount: this.finalTotalAmount,
      items,
      tickets: flatTickets,
    };
  }

  async confirmRegistration(): Promise<void> {
    const payload = this.buildRegistrationPayload();
    if (!payload) return;

    this.isSubmittingRegistration = true;

    try {
      const response = await this.eventRegistrationService.create(payload);

      const eventTitle = this.event?.title || 'Event';
      const eventDate = this.display.formatEventDate(this.event?.startDatetime || '');
      const isFree = this.event?.pricingType === 'FREE';

      const promoRowHtml = this.appliedPromo
        ? `
        <div class="d-flex justify-content-between py-1 text-danger fs-12 border-top pt-1 mt-1">
          <span><i class="ri-coupon-3-line me-1"></i> Diskon Promo (${this.display.escapeHtml(this.appliedPromo.code)}):</span>
          <span class="fw-semibold">- ${this.display.formatRupiah(this.discountAmount)}</span>
        </div>`
        : '';

      const attendeesListHtml = `
        <div class="mt-2 border-top pt-2">
          <div class="fw-semibold text-dark fs-12 mb-1">Data Peserta:</div>
          <ul class="list-unstyled mb-0 fs-12 text-muted">
            ${this.ticketAttendees
          .map(
            (a) => `
              <li class="d-flex justify-content-between py-1">
                <span>Tiket #${a.ticketIndex} (${this.display.escapeHtml(a.ticketTypeName)}):</span>
                <span class="fw-medium text-dark">${this.display.escapeHtml(a.attendeeName)} <small class="text-muted">(${this.display.escapeHtml(a.attendeeEmail)})</small></span>
              </li>`,
          )
          .join('')}
          </ul>
        </div>
      `;

      const ticketDetailsHtml = isFree
        ? `
          <div class="text-muted fs-12"><i class="ri-ticket-line me-1 text-success"></i> Tipe: ${this.display.escapeHtml(this.ticketAttendees[0]?.ticketTypeName || 'Tiket Gratis')}</div>
          ${attendeesListHtml}
        `
        : `
          <div class="mt-2 border-top pt-2">
            <div class="fw-semibold text-dark fs-12 mb-1">Tiket yang Dipesan (${this.totalSelectedTicketsCount} tiket):</div>
            <ul class="list-unstyled mb-0 fs-12 text-muted">
              ${this.selectedTicketsList
          .map(
            (item) => `
                <li class="d-flex justify-content-between py-1">
                  <span>${this.display.escapeHtml(item.ticket.name)} x ${item.quantity}</span>
                  <span class="fw-semibold text-dark">${this.display.formatRupiah(item.subtotal)}</span>
                </li>`,
          )
          .join('')}
            </ul>
            ${promoRowHtml}
            <div class="d-flex justify-content-between pt-2 border-top fw-bold text-dark fs-13">
              <span>Total Pembayaran:</span>
              <span class="text-primary">${this.display.formatRupiah(this.finalTotalAmount)}</span>
            </div>
            ${attendeesListHtml}
          </div>
        `;

      this.close();

      Swal.fire({
        title: response?.rollback ? 'Testing Pendaftaran Berhasil!' : 'Pendaftaran Berhasil!',
        html: `
          <div class="text-center py-2">
            <p class="text-muted mb-3" style="font-size: 14px;">
              ${response?.message || 'Selamat! Anda telah terdaftar pada event ini:'}
            </p>
            <div class="p-3 bg-light rounded-3 text-start border mb-3">
              <div class="fw-bold text-dark fs-14 mb-1">${this.display.escapeHtml(eventTitle)}</div>
              <div class="text-muted fs-12 mb-1">
                <i class="ri-calendar-line me-1 text-primary"></i> ${eventDate}
              </div>
              ${ticketDetailsHtml}
            </div>
            <p class="fs-12 text-success mb-0">
              <i class="ri-checkbox-circle-fill me-1"></i> ${response?.rollback ? 'Transaksi API divalidasi dengan sukses (Mode Rollback Aktif).' : 'E-tiket dan konfirmasi telah berhasil diterbitkan untuk akun Anda.'}
            </p>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'Selesai',
        confirmButtonColor: '#0f172a',
        customClass: {
          confirmButton: 'btn btn-dark px-4 py-2 rounded-3',
        },
        buttonsStyling: false,
      });

      this.registered.emit();
    } catch (error: any) {
      console.error('Registration API Error:', error);
      const rawMessage = error?.error?.message || error?.message || 'Gagal melakukan pendaftaran event. Silakan periksa kembali data Anda.';
      const errorMessage = Array.isArray(rawMessage) ? rawMessage.join(', ') : rawMessage;

      Swal.fire({
        title: 'Pendaftaran Gagal',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'Tutup',
        confirmButtonColor: '#0f172a',
        customClass: {
          confirmButton: 'btn btn-dark px-4 py-2 rounded-3',
        },
        buttonsStyling: false,
      });
    } finally {
      this.isSubmittingRegistration = false;
    }
  }
}
