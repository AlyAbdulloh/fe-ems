import { Component, OnInit, OnDestroy, HostListener, ElementRef, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthenticationService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { EventService, EventItem } from '../../core/services/event.service';
import { EventCategoryService, EventCategory } from '../../core/services/event-category.service';
import { EventDisplayService } from './services/event-display.service';

@Component({
  selector: 'app-discover',
  templateUrl: './discover.component.html',
  styleUrls: ['./discover.component.scss'],
})
export class DiscoverComponent implements OnInit, OnDestroy {
  // Authentication State
  currentUser: User | null = null;
  private authSub?: Subscription;

  // Event Data State
  events: EventItem[] = [];
  spotlightEvent: EventItem | null = null;
  otherEvents: EventItem[] = [];
  categories: EventCategory[] = [];
  loading = true;
  loadError = false;
  totalEvents = 0;

  // Filter Models
  searchQuery = '';
  cityQuery = '';
  selectedMode = 'ALL'; // ALL | OFFLINE | ONLINE | HYBRID
  selectedPricing = 'ALL'; // ALL | FREE | PAID
  selectedCategoryId = 'ALL';

  // Detail Modal State
  selectedDetailEvent: EventItem | null = null;
  isDetailModalOpen = false;

  // Registration Modal State
  selectedRegisterEvent: EventItem | null = null;
  isRegisterModalOpen = false;

  // Debounce timer for search
  private searchTimer?: any;

  constructor(
    private router: Router,
    private authService: AuthenticationService,
    private eventService: EventService,
    private categoryService: EventCategoryService,
    private display: EventDisplayService,
    private elRef: ElementRef,
    private renderer: Renderer2,
  ) {}

  ngOnInit(): void {
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

  async loadCategories(): Promise<void> {
    try {
      const res = await this.categoryService.findAll();
      this.categories = res?.data || [];
    } catch (err) {
      console.warn('Could not load categories:', err);
    }
  }

  async loadEvents(): Promise<void> {
    this.loading = true;
    this.loadError = false;
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

      if (allFetched.length > 0) {
        this.spotlightEvent = allFetched[0];
        this.otherEvents = allFetched.slice(1);
      } else {
        this.spotlightEvent = null;
        this.otherEvents = [];
      }
    } catch (err) {
      console.error('Failed to load events:', err);
      this.loadError = true;
      this.events = [];
      this.spotlightEvent = null;
      this.otherEvents = [];
      this.totalEvents = 0;
    } finally {
      this.loading = false;
    }
  }

  onSearchInput(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => {
      this.loadEvents();
    }, 350);
  }

  onFilterChange(): void {
    this.loadEvents();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.cityQuery = '';
    this.selectedMode = 'ALL';
    this.selectedPricing = 'ALL';
    this.selectedCategoryId = 'ALL';
    this.loadEvents();
  }

  get hasActiveFilters(): boolean {
    return (
      !!this.searchQuery.trim() ||
      !!this.cityQuery.trim() ||
      this.selectedMode !== 'ALL' ||
      this.selectedPricing !== 'ALL' ||
      this.selectedCategoryId !== 'ALL'
    );
  }

  onRegisterEvent(event: EventItem): void {
    if (!event) return;

    if (this.display.isEventPast(event)) {
      Swal.fire({
        title: 'Event Telah Berakhir',
        html: `
          <div class="text-center py-2">
            <p class="text-muted mb-3" style="font-size: 14px; line-height: 1.5;">
              Mohon maaf, waktu pelaksanaan event ini telah selesai atau masa pendaftaran tiket telah ditutup.
            </p>
            <div class="p-3 bg-light rounded-3 text-start mb-2 border">
              <div class="fw-bold text-dark fs-14">${this.display.escapeHtml(event.title)}</div>
              <div class="text-muted fs-12 mt-1">
                <i class="ri-calendar-line me-1 text-danger"></i> Berakhir: ${this.display.formatEventDate(event.endDatetime || event.startDatetime)}
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
              <div class="fw-bold text-dark fs-14">${this.display.escapeHtml(event.title)}</div>
              <div class="text-muted fs-12 mt-1">
                <i class="ri-calendar-line me-1 text-primary"></i> ${this.display.formatEventDate(event.startDatetime)}
              </div>
              <div class="text-muted fs-12 mt-1">
                <i class="ri-map-pin-line me-1 text-danger"></i> ${event.venue ? this.display.escapeHtml(event.venue.name) : 'Online Event'}
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

    if (this.display.isMyEvent(user, event)) {
      Swal.fire({
        title: 'Event Milik Anda',
        html: `
          <div class="text-center py-2">
            <p class="text-muted mb-3" style="font-size: 14px; line-height: 1.5;">
              Anda adalah penyelenggara event ini. Anda tidak perlu melakukan pendaftaran tiket untuk event yang Anda kelola sendiri.
            </p>
            <div class="p-3 bg-light rounded-3 text-start mb-2 border">
              <div class="fw-bold text-dark fs-14 mb-1">${this.display.escapeHtml(event.title)}</div>
              <div class="text-muted fs-12">
                <i class="ri-calendar-line me-1 text-primary"></i> ${this.display.formatEventDate(event.startDatetime)}
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

    this.openRegisterModal(event);
  }

  openDetailModal(event: EventItem): void {
    this.selectedDetailEvent = event;
    this.isDetailModalOpen = true;
    this.lockBodyScroll(true);
    this.focusFirstFocusable(this.elRef.nativeElement.querySelector('.modal-dialog-custom'));
  }

  closeDetailModal(): void {
    this.isDetailModalOpen = false;
    this.selectedDetailEvent = null;
    this.lockBodyScroll(false);
  }

  openRegisterModal(event: EventItem): void {
    this.selectedRegisterEvent = event;
    this.isRegisterModalOpen = true;
    this.lockBodyScroll(true);
    this.focusFirstFocusable(this.elRef.nativeElement.querySelector('.modal-dialog-custom'));
  }

  closeRegisterModal(): void {
    this.isRegisterModalOpen = false;
    this.selectedRegisterEvent = null;
    this.lockBodyScroll(false);
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: '/discover' },
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/']);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    this.currentUser = null;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: KeyboardEvent): void {
    if (this.isDetailModalOpen) {
      event.stopPropagation();
      this.closeDetailModal();
    } else if (this.isRegisterModalOpen) {
      event.stopPropagation();
      this.closeRegisterModal();
    }
  }

  private lockBodyScroll(lock: boolean): void {
    const body = document.body;
    if (lock) {
      this.renderer.addClass(body, 'modal-open');
    } else if (body.classList.contains('modal-open')) {
      this.renderer.removeClass(body, 'modal-open');
    }
    this.renderer.setStyle(body, 'overflow', lock ? 'hidden' : '');
  }

  private focusFirstFocusable(container: HTMLElement): void {
    const focusable = container?.querySelector<HTMLElement>(
      'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    requestAnimationFrame(() => focusable?.focus());
  }
}
