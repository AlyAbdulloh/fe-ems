import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';
import { AuthenticationService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { EventService, EventItem, EventPricingType } from '../../core/services/event.service';
import { PromoCodeService } from 'src/app/core/services/promo-code.service';
import { EventCategoryService, EventCategory } from '../../core/services/event-category.service';
import { EventRegistrationService } from '../../core/services/event-registration.service';

export interface TicketAttendeeInput {
  ticketTypeId: string;
  ticketTypeName: string;
  ticketPrice: number;
  ticketIndex: number;
  typeIndex: number;
  attendeeName: string;
  attendeeEmail: string;
}

export interface TicketAttendeePayload {
  attendeeName: string;
  attendeeEmail: string;
}

export interface OrderItemPayload {
  ticketTypeId: string;
  quantity: number;
  tickets: TicketAttendeePayload[];
}

export interface PromoCodePayload {
  id: string;
  code: string;
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number;
}

export interface EventRegistrationPayload {
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
  selector: 'app-discover',
  templateUrl: './discover.component.html',
  styleUrls: ['./discover.component.scss'],
})
export class DiscoverComponent implements OnInit, OnDestroy {
  apiUrl = environment.url;

  // Authentication State
  currentUser: User | null = null;
  private authSub?: Subscription;

  // Event Data State
  events: EventItem[] = [];
  spotlightEvent: EventItem | null = null;
  otherEvents: EventItem[] = [];
  categories: EventCategory[] = [];
  loading = true;
  totalEvents = 0;

  // Filter Models
  searchQuery: string = '';
  cityQuery: string = '';
  selectedMode: string = 'ALL'; // ALL | OFFLINE | ONLINE | HYBRID
  selectedPricing: string = 'ALL'; // ALL | FREE | PAID
  selectedCategoryId: string = 'ALL';

  // Detail Modal State
  selectedDetailEvent: EventItem | null = null;
  isDetailModalOpen = false;

  // Registration Modal State
  selectedRegisterEvent: EventItem | null = null;
  isRegisterModalOpen = false;
  selectedTicketQuantities: { [ticketTypeId: string]: number } = {};
  isSubmittingRegistration = false;

  // Attendee Information State per Ticket
  ticketAttendees: TicketAttendeeInput[] = [];

  // Promo Code State
  promoCodeInput: string = '';
  appliedPromo: {
    id?: string;
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
  } | null = null;
  promoError: string = '';
  isApplyingPromo: boolean = false;

  // Mobile Nav Toggle
  isMobileNavOpen = false;

  // Debounce timer for search
  private searchTimer?: any;

  constructor(
    private router: Router,
    private authService: AuthenticationService,
    private eventService: EventService,
    private categoryService: EventCategoryService,
    private promoCodeService: PromoCodeService,
    private eventRegistrationService: EventRegistrationService,
  ) { }

  ngOnInit(): void {
    // Subscribe to auth state so UI reacts instantly if user logs in/out
    this.authSub = this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    this.loadCategories();
    this.loadEvents();
  }

  ngOnDestroy(): void {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  }

  /**
   * Load categories for filter dropdown
   */
  async loadCategories(): Promise<void> {
    try {
      const res = await this.categoryService.findAll();
      this.categories = res?.data || [];
    } catch (err) {
      console.warn('Could not load categories:', err);
    }
  }

  /**
   * Load published events with active filters
   */
  async loadEvents(): Promise<void> {
    this.loading = true;
    try {
      const params: any = {
        page: 1,
        limit: 50,
        status: 'PUBLISHED',
      };

      if (this.searchQuery.trim()) {
        params.search = this.searchQuery.trim();
      }

      if (this.cityQuery.trim()) {
        params.city = this.cityQuery.trim();
      }

      if (this.selectedMode && this.selectedMode !== 'ALL') {
        params.venueType = this.selectedMode;
      }

      if (this.selectedPricing && this.selectedPricing !== 'ALL') {
        params.pricingType = this.selectedPricing;
      }

      if (this.selectedCategoryId && this.selectedCategoryId !== 'ALL') {
        params.categoryId = this.selectedCategoryId;
      }

      const res = await this.eventService.findAll(params);
      const allFetched = res?.data || [];
      this.totalEvents = res?.meta?.total || allFetched.length;
      this.events = allFetched;

      // Assign Spotlight (first event, or nearest upcoming) and remainder to otherEvents
      if (allFetched.length > 0) {
        this.spotlightEvent = allFetched[0];
        this.otherEvents = allFetched.slice(1);
      } else {
        this.spotlightEvent = null;
        this.otherEvents = [];
      }
    } catch (err) {
      console.error('Failed to load events:', err);
      this.events = [];
      this.spotlightEvent = null;
      this.otherEvents = [];
      this.totalEvents = 0;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Debounced search input handler
   */
  onSearchInput(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => {
      this.loadEvents();
    }, 350);
  }

  /**
   * Filter select change handler
   */
  onFilterChange(): void {
    this.loadEvents();
  }

  /**
   * Reset all search and filter values
   */
  resetFilters(): void {
    this.searchQuery = '';
    this.cityQuery = '';
    this.selectedMode = 'ALL';
    this.selectedPricing = 'ALL';
    this.selectedCategoryId = 'ALL';
    this.loadEvents();
  }

  /**
   * Check if any filter is active
   */
  get hasActiveFilters(): boolean {
    return (
      !!this.searchQuery.trim() ||
      !!this.cityQuery.trim() ||
      this.selectedMode !== 'ALL' ||
      this.selectedPricing !== 'ALL' ||
      this.selectedCategoryId !== 'ALL'
    );
  }

  /**
   * Cek apakah event sudah berakhir (waktu selesai terlampaui atau status selesai/dibatalkan)
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
   * Cek apakah event merupakan milik user yang sedang login (sebagai penyelenggara)
   */
  isMyEvent(event: EventItem | null | undefined): boolean {
    if (!this.currentUser || !event) return false;
    const currentUserId = this.currentUser.id;
    const currentOrganizerId = this.currentUser.organizer?.id;

    // Cek kecocokan User ID penyelenggara
    if (event.organizer?.user?.id && event.organizer.user.id === currentUserId) {
      return true;
    }

    // Cek kecocokan Organizer ID penyelenggara
    if (currentOrganizerId && (event.organizerId === currentOrganizerId || event.organizer?.id === currentOrganizerId)) {
      return true;
    }

    return false;
  }

  /**
   * Handle "Register Now" button click
   * If user is unauthenticated, prompts login with Swal
   * If event has ended or belongs to current user, guards appropriately
   * If authenticated, opens registration modal
   */
  onRegisterEvent(event: EventItem): void {
    if (!event) return;

    // Guard 1: Event sudah berakhir / waktu selesai sudah terlampaui
    if (this.isEventPast(event)) {
      Swal.fire({
        title: 'Event Telah Berakhir',
        html: `
          <div class="text-center py-2">
            <p class="text-muted mb-3" style="font-size: 14px; line-height: 1.5;">
              Mohon maaf, waktu pelaksanaan event ini telah selesai atau masa pendaftaran tiket telah ditutup.
            </p>
            <div class="p-3 bg-light rounded-3 text-start mb-2 border">
              <div class="fw-bold text-dark fs-14">${this.escapeHtml(event.title)}</div>
              <div class="text-muted fs-12 mt-1">
                <i class="ri-calendar-line me-1 text-danger"></i> Berakhir: ${this.formatEventDate(event.endDatetime || event.startDatetime)}
              </div>
            </div>
          </div>
        `,
        icon: 'warning',
        confirmButtonText: 'Mengerti',
        confirmButtonColor: '#0f172a',
        customClass: {
          confirmButton: 'btn btn-dark px-4 py-2 rounded-3',
        },
        buttonsStyling: false,
      });
      return;
    }

    const user = this.authService.currentUserValue;

    if (!user) {
      Swal.fire({
        title: 'Login Diperlukan',
        html: `
          <div class="text-center py-2">
            <p class="text-muted mb-3" style="font-size: 14px; line-height: 1.5;">
              Silakan login ke akun Anda terlebih dahulu untuk melakukan pendaftaran atau pemesanan tiket event ini.
            </p>
            <div class="p-3 bg-light rounded-3 text-start mb-2 border">
              <div class="fw-bold text-dark fs-14">${this.escapeHtml(event.title)}</div>
              <div class="text-muted fs-12 mt-1">
                <i class="ri-calendar-line me-1 text-primary"></i> ${this.formatEventDate(event.startDatetime)}
              </div>
              <div class="text-muted fs-12 mt-1">
                <i class="ri-map-pin-line me-1 text-danger"></i> ${event.venue ? this.escapeHtml(event.venue.name) : 'Online Event'}
              </div>
            </div>
          </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: '<i class="ri-login-box-line me-1"></i> Login Sekarang',
        cancelButtonText: 'Nanti Saja',
        confirmButtonColor: '#0f172a',
        cancelButtonColor: '#94a3b8',
        customClass: {
          confirmButton: 'btn btn-dark px-4 py-2 rounded-3 me-2',
          cancelButton: 'btn btn-outline-secondary px-4 py-2 rounded-3',
        },
        buttonsStyling: false,
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/auth/login'], {
            queryParams: { returnUrl: '/discover' },
          });
        }
      });
      return;
    }

    // Guard 2: Event adalah milik user yang sedang login
    if (this.isMyEvent(event)) {
      Swal.fire({
        title: 'Event Milik Anda',
        html: `
          <div class="text-center py-2">
            <p class="text-muted mb-3" style="font-size: 14px; line-height: 1.5;">
              Anda adalah penyelenggara event ini. Anda tidak perlu melakukan pendaftaran tiket untuk event yang Anda kelola sendiri.
            </p>
            <div class="p-3 bg-light rounded-3 text-start mb-2 border">
              <div class="fw-bold text-dark fs-14 mb-1">${this.escapeHtml(event.title)}</div>
              <div class="text-muted fs-12">
                <i class="ri-calendar-line me-1 text-primary"></i> ${this.formatEventDate(event.startDatetime)}
              </div>
            </div>
          </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: '<i class="ri-dashboard-line me-1"></i> Buka Kelola Event',
        cancelButtonText: 'Tutup',
        confirmButtonColor: '#0f172a',
        cancelButtonColor: '#94a3b8',
        customClass: {
          confirmButton: 'btn btn-dark px-4 py-2 rounded-3 me-2',
          cancelButton: 'btn btn-outline-secondary px-4 py-2 rounded-3',
        },
        buttonsStyling: false,
      }).then((res) => {
        if (res.isConfirmed) {
          this.router.navigate(['/events/detail', event.id]);
        }
      });
      return;
    }

    // Authenticated user: open registration flow
    this.openRegisterModal(event);
  }

  /**
   * Open Event Detail Modal
   */
  openDetailModal(event: EventItem): void {
    this.selectedDetailEvent = event;
    this.isDetailModalOpen = true;
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.selectedDetailEvent = null;
  }

  /**
   * Open Registration Modal
   */
  openRegisterModal(event: EventItem): void {
    this.selectedRegisterEvent = event;
    this.selectedTicketQuantities = {};
    this.promoCodeInput = '';
    this.appliedPromo = null;
    this.promoError = '';

    // Inisialisasi kuantitas tiket pertama = 1 jika tiket tersedia (baik FREE maupun PAID)
    if (event.ticketTypes && event.ticketTypes.length > 0) {
      const firstAvailable = event.ticketTypes.find(
        (t) => (t.quota || 0) - (t.soldCount || 0) > 0
      );
      if (firstAvailable) {
        this.selectedTicketQuantities[firstAvailable.id] = 1;
      }
    }

    this.syncTicketAttendees();
    this.isRegisterModalOpen = true;
  }

  closeRegisterModal(): void {
    this.isRegisterModalOpen = false;
    this.selectedRegisterEvent = null;
    this.selectedTicketQuantities = {};
    this.ticketAttendees = [];
    this.promoCodeInput = '';
    this.appliedPromo = null;
    this.promoError = '';
    this.isSubmittingRegistration = false;
  }

  /**
   * Helper untuk mendapatkan kuantitas tiket berdasarkan ID
   */
  getTicketQuantity(ticketTypeId: string): number {
    return this.selectedTicketQuantities[ticketTypeId] || 0;
  }

  /**
   * Tambah kuantitas tiket (Untuk free event: memilih tiket ini dan membatasi total = 1)
   */
  incrementTicketQuantity(ticket: any): void {
    const availableQuota = (ticket.quota || 0) - (ticket.soldCount || 0);
    if (availableQuota <= 0) return;

    if (this.selectedRegisterEvent?.pricingType === 'FREE') {
      // Event gratis: hanya boleh pilih 1 tiket total.
      // Memilih jenis tiket ini akan otomatis mengeset kuantitas = 1 dan mereset jenis tiket lain.
      this.selectedTicketQuantities = { [ticket.id]: 1 };
      this.syncTicketAttendees();
      return;
    }

    const current = this.getTicketQuantity(ticket.id);
    const maxAllowed = Math.min(availableQuota, 10); // Maksimal 10 tiket per jenis atau sesuai kuota
    if (current < maxAllowed) {
      this.selectedTicketQuantities[ticket.id] = current + 1;
      this.syncTicketAttendees();
    }
  }

  /**
   * Pilih tiket gratis saat kartu tiket diklik
   */
  selectFreeTicket(ticket: any): void {
    if (this.selectedRegisterEvent?.pricingType === 'FREE') {
      this.incrementTicketQuantity(ticket);
    }
  }

  /**
   * Kurangi kuantitas tiket
   */
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

  /**
   * Sinkronisasi data peserta berdasarkan kuantitas tiket yang dipilih
   */
  syncTicketAttendees(): void {
    if (!this.selectedRegisterEvent) {
      this.ticketAttendees = [];
      return;
    }

    // Fallback jika event gratis tidak memiliki daftar ticketTypes di database
    if (
      this.selectedRegisterEvent.pricingType === 'FREE' &&
      (!this.selectedRegisterEvent.ticketTypes || this.selectedRegisterEvent.ticketTypes.length === 0)
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

    // Simpan data nama & email yang sudah sempat diinputkan agar tidak hilang
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

        // Jika tiket pertama dan belum diisi, otomatis isi dengan data akun pengguna saat ini
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

  /**
   * Salin data akun yang sedang login ke peserta tiket tertentu
   */
  useMyAccountForTicket(attendee: TicketAttendeeInput): void {
    if (this.currentUser) {
      attendee.attendeeName = this.currentUser.name || '';
      attendee.attendeeEmail = this.currentUser.email || '';
    }
  }

  /**
   * Cek apakah seluruh data nama dan email peserta sudah terisi dengan format valid
   */
  get isAttendeesValid(): boolean {
    if (this.ticketAttendees.length === 0) {
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.ticketAttendees.every(
      (a) => a.attendeeName.trim().length > 0 && emailRegex.test(a.attendeeEmail.trim())
    );
  }

  /**
   * Daftar tiket yang telah dipilih dengan kuantitas > 0
   */
  get selectedTicketsList(): Array<{ ticket: any; quantity: number; subtotal: number }> {
    if (!this.selectedRegisterEvent?.ticketTypes) return [];
    return this.selectedRegisterEvent.ticketTypes
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

  /**
   * Total tiket yang dipilih
   */
  get totalSelectedTicketsCount(): number {
    if (
      this.selectedRegisterEvent?.pricingType === 'FREE' &&
      (!this.selectedRegisterEvent.ticketTypes || this.selectedRegisterEvent.ticketTypes.length === 0)
    ) {
      return 1;
    }
    return Object.values(this.selectedTicketQuantities).reduce((acc, qty) => acc + (qty || 0), 0);
  }

  /**
   * Total harga tiket yang dipilih (Subtotal)
   */
  get totalSelectedTicketsAmount(): number {
    if (!this.selectedRegisterEvent || this.selectedRegisterEvent.pricingType === 'FREE') return 0;
    return this.selectedTicketsList.reduce((acc, item) => acc + item.subtotal, 0);
  }

  /**
   * Jumlah potongan diskon promo
   */
  get discountAmount(): number {
    if (!this.appliedPromo || this.totalSelectedTicketsAmount <= 0) return 0;
    if (this.appliedPromo.discountType === 'PERCENTAGE') {
      return Math.round((this.totalSelectedTicketsAmount * this.appliedPromo.discountValue) / 100);
    } else {
      return Math.min(this.appliedPromo.discountValue, this.totalSelectedTicketsAmount);
    }
  }

  /**
   * Total pembayaran akhir setelah dipotong diskon promo
   */
  get finalTotalAmount(): number {
    return Math.max(0, this.totalSelectedTicketsAmount - this.discountAmount);
  }

  /**
   * Apply / Validasi kode promo
   */
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
      let { data: checkPromo } = await this.promoCodeService.checkPromoCode(this.promoCodeInput, this.selectedRegisterEvent?.id);

      this.appliedPromo = {
        id: checkPromo?.id || '',
        code: checkPromo?.code || '',
        discountType: checkPromo?.discountType || 'PERCENTAGE',
        discountValue: checkPromo?.discountValue || 0,
      }
    } catch (error) {
      this.promoError = 'Kode promo tidak valid atau telah kedaluwarsa.';
    } finally {
      this.isApplyingPromo = false;
      this.promoCodeInput = rawCode;
    }
  }

  /**
   * Hapus kode promo yang aktif
   */
  removePromoCode(): void {
    this.appliedPromo = null;
    this.promoCodeInput = '';
    this.promoError = '';
  }

  /**
   * Pilih promo via chip saran
   */
  setPromoCode(code: string): void {
    this.promoCodeInput = code;
    this.applyPromoCode(code);
  }

  /**
   * Membentuk payload registrasi / order tiket yang siap dikirimkan ke Backend
   */
  buildRegistrationPayload(): EventRegistrationPayload | null {
    if (!this.selectedRegisterEvent) return null;

    const isFree = this.selectedRegisterEvent.pricingType === 'FREE';

    // 1. Payload untuk Event Gratis (1 Tiket Gratis per Akun)
    if (isFree) {
      const selectedItem = this.selectedTicketsList[0];
      const freeTicketType = selectedItem?.ticket || this.selectedRegisterEvent.ticketTypes?.[0];
      const freeTicketTypeId = freeTicketType?.id || this.selectedRegisterEvent.id;
      const attendee = this.ticketAttendees[0] || {
        attendeeName: this.currentUser?.name || '',
        attendeeEmail: this.currentUser?.email || '',
      };

      const attendeeObj = {
        attendeeName: attendee.attendeeName.trim(),
        attendeeEmail: attendee.attendeeEmail.trim(),
      };

      // Tepat 1 item tiket gratis
      const items: OrderItemPayload[] = [
        {
          ticketTypeId: freeTicketTypeId,
          quantity: 1,
          tickets: [attendeeObj],
        },
      ];

      return {
        eventId: this.selectedRegisterEvent.id,
        pricingType: 'FREE',
        promoCode: null,
        totalAmount: 0,
        items,
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

    // 2. Payload untuk Event Berbayar (Order -> OrderItem[] -> Ticket[])
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
      eventId: this.selectedRegisterEvent.id,
      pricingType: 'PAID',
      promoCode: promoCodeData,
      totalAmount: this.finalTotalAmount,
      items,
      tickets: flatTickets,
    };
  }

  /**
   * Confirm and complete registration
   */
  async confirmRegistration(): Promise<void> {
    if (!this.selectedRegisterEvent) return;

    // Bentuk payload pendaftaran yang siap dikirim ke backend
    const payload = this.buildRegistrationPayload();
    if (!payload) return;

    console.log('=== Sending Event Registration Payload to Backend ===', payload);
    this.isSubmittingRegistration = true;

    try {
      const response = await this.eventRegistrationService.create(payload);
      console.log('=== Event Registration API Response ===', response);

      const eventTitle = this.selectedRegisterEvent?.title || 'Event';
      const eventDate = this.formatEventDate(this.selectedRegisterEvent?.startDatetime || '');
      const isFree = this.selectedRegisterEvent?.pricingType === 'FREE';

      const promoRowHtml = this.appliedPromo
        ? `
        <div class="d-flex justify-content-between py-1 text-danger fs-12 border-top pt-1 mt-1">
          <span><i class="ri-coupon-3-line me-1"></i> Diskon Promo (${this.escapeHtml(this.appliedPromo.code)}):</span>
          <span class="fw-semibold">- ${this.formatRupiah(this.discountAmount)}</span>
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
                <span>Tiket #${a.ticketIndex} (${this.escapeHtml(a.ticketTypeName)}):</span>
                <span class="fw-medium text-dark">${this.escapeHtml(a.attendeeName)} <small class="text-muted">(${this.escapeHtml(a.attendeeEmail)})</small></span>
              </li>`
          )
          .join('')}
          </ul>
        </div>
      `;

      const ticketDetailsHtml = isFree
        ? `
          <div class="text-muted fs-12"><i class="ri-ticket-line me-1 text-success"></i> Tipe: ${this.escapeHtml(this.ticketAttendees[0]?.ticketTypeName || 'Tiket Gratis')}</div>
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
                  <span>${this.escapeHtml(item.ticket.name)} x ${item.quantity}</span>
                  <span class="fw-semibold text-dark">${this.formatRupiah(item.subtotal)}</span>
                </li>`
          )
          .join('')}
            </ul>
            ${promoRowHtml}
            <div class="d-flex justify-content-between pt-2 border-top fw-bold text-dark fs-13">
              <span>Total Pembayaran:</span>
              <span class="text-primary">${this.formatRupiah(this.finalTotalAmount)}</span>
            </div>
            ${attendeesListHtml}
          </div>
        `;

      this.closeRegisterModal();
      this.closeDetailModal();

      Swal.fire({
        title: response?.rollback ? 'Testing Pendaftaran Berhasil!' : 'Pendaftaran Berhasil!',
        html: `
          <div class="text-center py-2">
            <p class="text-muted mb-3" style="font-size: 14px;">
              ${response?.message || 'Selamat! Anda telah terdaftar pada event ini:'}
            </p>
            <div class="p-3 bg-light rounded-3 text-start border mb-3">
              <div class="fw-bold text-dark fs-14 mb-1">${this.escapeHtml(eventTitle)}</div>
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

  /**
   * Format ISO date string into readable Indonesian format
   * Example: "Minggu, 15 Maret 2026 • 09:00 WIB"
   */
  formatEventDate(dateStr?: string): string {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '-';

      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      };
      return d.toLocaleDateString('id-ID', options);
    } catch {
      return dateStr;
    }
  }

  /**
   * Format event time range (HH:mm - HH:mm WIB)
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
   * Format Rupiah currency
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
   * Get Lowest ticket price display
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
        const minPrice = Math.min(...validPrices);
        return `Mulai ${this.formatRupiah(minPrice)}`;
      }
    }
    return 'Berbayar';
  }

  /**
   * Safe image URL getter with aesthetic fallbacks
   */
  getEventImage(event: EventItem, index: number = 0): string {
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
   * Navigate to login page
   */
  goToLogin(): void {
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: '/discover' },
    });
  }

  /**
   * Navigate to internal dashboard
   */
  goToDashboard(): void {
    this.router.navigate(['/']);
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await this.authService.logout();
    this.currentUser = null;
  }

  /**
   * Toggle mobile navigation drawer
   */
  toggleMobileNav(): void {
    this.isMobileNavOpen = !this.isMobileNavOpen;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
