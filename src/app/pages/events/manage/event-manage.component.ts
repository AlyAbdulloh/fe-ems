import { Component, OnDestroy, OnInit } from '@angular/core';
import { EventItem, EventPricingType, EventService, EventStatusType } from '../../../core/services/event.service';
import { PaginationMeta } from '../../../core/models/api-response.model';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-event-manage',
  templateUrl: './event-manage.component.html',
  styleUrls: ['./event-manage.component.scss'],
})
export class EventManageComponent implements OnInit, OnDestroy {

  apiUrl: string = environment.url;
  events: EventItem[] = [];
  loading = false;
  error = '';

  page = 1;
  limit = 10;
  statusFilter = '';
  pricingTypeFilter = '';
  searchQuery = '';
  meta: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 };

  isPublishModalOpen = false;
  selectedEventForPublish: EventItem | null = null;
  publishing = false;

  private searchSubject = new Subject<string>();
  private searchSub!: Subscription;

  constructor(private eventService: EventService) { }

  ngOnInit(): void {
    this.loadMyEvents();

    this.searchSub = this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query) => {
        this.searchQuery = query;
        this.page = 1;
        this.loadMyEvents();
      });
  }

  ngOnDestroy(): void {
    if (this.searchSub) {
      this.searchSub.unsubscribe();
    }
  }

  onSearchInput(event: any) {
    const val = event.target?.value || '';
    this.searchSubject.next(val);
  }

  async loadMyEvents() {
    this.loading = true;
    this.error = '';

    try {
      const res = await this.eventService.findMyEvents({
        page: this.page,
        limit: this.limit,
        status: (this.statusFilter as EventStatusType) || undefined,
        pricingType: (this.pricingTypeFilter as EventPricingType) || undefined,
        search: this.searchQuery || undefined,
      });

      this.events = res.data || [];
      if (res.meta) {
        this.meta = res.meta;
      }
    } catch (err: any) {
      this.error = err?.message || 'Gagal memuat daftar event Anda.';
    } finally {
      this.loading = false;
    }
  }

  onSearch() {
    this.page = 1;
    this.loadMyEvents();
  }

  onFilterChange() {
    this.page = 1;
    this.loadMyEvents();
  }

  changePage(newPage: number) {
    this.page = newPage;
    this.loadMyEvents();
  }

  openPublishModal(eventItem: EventItem) {
    this.selectedEventForPublish = eventItem;
    this.isPublishModalOpen = true;
  }

  closePublishModal() {
    this.isPublishModalOpen = false;
    this.selectedEventForPublish = null;
    this.publishing = false;
  }

  async confirmPublish() {
    if (!this.selectedEventForPublish) return;

    this.publishing = true;
    try {
      await this.eventService.updateStatus(this.selectedEventForPublish.id, 'PUBLISHED');
      this.closePublishModal();
      Swal.fire({
        title: 'Event Berhasil Dipublikasikan!',
        text: 'Event Anda sekarang telah aktif dan dapat dilihat oleh publik.',
        icon: 'success',
        confirmButtonColor: '#3577f1',
      });
      await this.loadMyEvents();
    } catch (err: any) {
      Swal.fire({
        title: 'Gagal Mempublikasikan!',
        text: err?.error?.message || err?.message || 'Gagal mengubah status event.',
        icon: 'error',
        confirmButtonColor: '#f06548',
      });
    } finally {
      this.publishing = false;
    }
  }

  async updateStatus(eventItem: EventItem, newStatus: EventStatusType) {
    if (newStatus === 'PUBLISHED') {
      this.openPublishModal(eventItem);
      return;
    }

    const statusLabels: Record<EventStatusType, string> = {
      DRAFT: 'Draf',
      PUBLISHED: 'Publikasikan',
      COMPLETED: 'Selesai',
      CANCELLED: 'Batalkan Event',
    };

    const result = await Swal.fire({
      title: `Ubah Status Event?`,
      text: `Apakah Anda yakin ingin mengubah status event "${eventItem.title}" menjadi ${statusLabels[newStatus]}?`,
      icon: newStatus === 'CANCELLED' ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonColor: newStatus === 'CANCELLED' ? '#f06548' : '#3577f1',
      cancelButtonColor: '#74788d',
      confirmButtonText: 'Ya, Ubah Status',
      cancelButtonText: 'Batal',
    });

    if (!result.isConfirmed) return;

    try {
      await this.eventService.updateStatus(eventItem.id, newStatus);
      Swal.fire({
        title: 'Berhasil!',
        text: `Status event berhasil diubah menjadi ${newStatus}.`,
        icon: 'success',
        confirmButtonColor: '#3577f1',
      });
      await this.loadMyEvents();
    } catch (err: any) {
      Swal.fire({
        title: 'Gagal!',
        text: err?.error?.message || err?.message || 'Gagal mengubah status event.',
        icon: 'error',
        confirmButtonColor: '#f06548',
      });
    }
  }

  getStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'PUBLISHED':
        return 'badge bg-success-subtle text-success';
      case 'DRAFT':
        return 'badge bg-warning-subtle text-warning';
      case 'COMPLETED':
        return 'badge bg-info-subtle text-info';
      case 'CANCELLED':
        return 'badge bg-danger-subtle text-danger';
      default:
        return 'badge bg-secondary-subtle text-secondary';
    }
  }
}
