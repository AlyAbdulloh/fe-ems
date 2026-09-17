import { Component, OnDestroy, OnInit } from '@angular/core';
import { EventItem, EventService, EventStatusType } from '../../core/services/event.service';
import { PaginationMeta } from '../../core/models/api-response.model';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-event-manage',
  templateUrl: './event-manage.component.html',
  styleUrls: ['./event-manage.component.scss'],
})
export class EventManageComponent implements OnInit, OnDestroy {
  events: EventItem[] = [];
  loading = false;
  error = '';

  page = 1;
  limit = 10;
  statusFilter = '';
  searchQuery = '';
  meta: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 };

  private searchSubject = new Subject<string>();
  private searchSub!: Subscription;

  constructor(private eventService: EventService) {}

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
    if (newPage < 1 || newPage > this.meta.totalPages) return;
    this.page = newPage;
    this.loadMyEvents();
  }

  async updateStatus(eventItem: EventItem, newStatus: EventStatusType) {
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
        text: err?.message || 'Gagal mengubah status event.',
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
