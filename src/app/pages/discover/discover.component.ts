import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';
import { AuthenticationService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { EventService, EventItem, EventPricingType } from '../../core/services/event.service';
import { EventCategoryService, EventCategory } from '../../core/services/event-category.service';

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
  selectedTicketTypeId: string = '';
  ticketQuantity: number = 1;
  isSubmittingRegistration = false;

  // Mobile Nav Toggle
  isMobileNavOpen = false;

  // Debounce timer for search
  private searchTimer?: any;

  constructor(
    private router: Router,
    private authService: AuthenticationService,
    private eventService: EventService,
    private categoryService: EventCategoryService,
  ) {}

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
   * Handle "Register Now" button click
   * If user is unauthenticated, triggers SweetAlert prompting to log in
   * If authenticated, opens registration modal
   */
  onRegisterEvent(event: EventItem): void {
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
    this.ticketQuantity = 1;

    // Pick first available ticket type if exists
    if (event.ticketTypes && event.ticketTypes.length > 0) {
      this.selectedTicketTypeId = event.ticketTypes[0].id;
    } else {
      this.selectedTicketTypeId = '';
    }

    this.isRegisterModalOpen = true;
  }

  closeRegisterModal(): void {
    this.isRegisterModalOpen = false;
    this.selectedRegisterEvent = null;
    this.selectedTicketTypeId = '';
    this.ticketQuantity = 1;
    this.isSubmittingRegistration = false;
  }

  /**
   * Get currently selected ticket in register modal
   */
  get currentSelectedTicket(): any {
    if (!this.selectedRegisterEvent?.ticketTypes) return null;
    return this.selectedRegisterEvent.ticketTypes.find(
      (t) => t.id === this.selectedTicketTypeId,
    );
  }

  /**
   * Calculate registration subtotal
   */
  get calculateSubtotal(): number {
    if (!this.selectedRegisterEvent) return 0;
    if (this.selectedRegisterEvent.pricingType === 'FREE') return 0;
    const ticket = this.currentSelectedTicket;
    if (!ticket) return 0;
    const unitPrice = parseFloat(ticket.price) || 0;
    return unitPrice * this.ticketQuantity;
  }

  /**
   * Confirm and complete registration
   */
  async confirmRegistration(): Promise<void> {
    if (!this.selectedRegisterEvent) return;

    this.isSubmittingRegistration = true;

    // Simulate registration processing with a realistic UX feel
    setTimeout(() => {
      this.isSubmittingRegistration = false;
      const eventTitle = this.selectedRegisterEvent?.title || 'Event';
      const eventDate = this.formatEventDate(this.selectedRegisterEvent?.startDatetime || '');
      const isFree = this.selectedRegisterEvent?.pricingType === 'FREE';

      this.closeRegisterModal();
      this.closeDetailModal();

      Swal.fire({
        title: 'Pendaftaran Berhasil!',
        html: `
          <div class="text-center py-2">
            <p class="text-muted mb-3" style="font-size: 14px;">
              Selamat! Anda telah terdaftar pada event ini:
            </p>
            <div class="p-3 bg-light rounded-3 text-start border mb-3">
              <div class="fw-bold text-dark fs-14 mb-1">${this.escapeHtml(eventTitle)}</div>
              <div class="text-muted fs-12 mb-1">
                <i class="ri-calendar-line me-1 text-primary"></i> ${eventDate}
              </div>
              <div class="text-muted fs-12">
                <i class="ri-ticket-line me-1 text-success"></i> Tipe: ${isFree ? 'Tiket Gratis' : 'Tiket Berbayar'}
              </div>
            </div>
            <p class="fs-12 text-success mb-0">
              <i class="ri-checkbox-circle-fill me-1"></i> E-tiket dan rincian acara telah dikonfirmasi untuk akun Anda.
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
    }, 700);
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
