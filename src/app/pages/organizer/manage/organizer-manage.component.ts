import { Component, OnInit } from '@angular/core';
import { OrganizerService } from '../../../core/services/organizer.service';
import { OrganizerProfile } from '../../../core/models/user.model';
import { PaginationMeta } from '../../../core/models/api-response.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-organizer-manage',
  templateUrl: './organizer-manage.component.html',
  styleUrls: ['./organizer-manage.component.scss'],
})
export class OrganizerManageComponent implements OnInit {
  organizers: OrganizerProfile[] = [];
  loading = false;
  error = '';
  successMsg = '';

  page = 1;
  limit = 10;
  statusFilter = '';
  searchQuery = '';
  meta: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 };

  constructor(private organizerService: OrganizerService) {}

  ngOnInit(): void {
    this.loadOrganizers();
  }

  async loadOrganizers() {
    this.loading = true;
    this.error = '';

    try {
      const res = await this.organizerService.findAll({
        page: this.page,
        limit: this.limit,
        status: this.statusFilter || undefined,
        search: this.searchQuery || undefined,
      });

      this.organizers = res.data || [];
      if (res.meta) {
        this.meta = res.meta;
      }
    } catch (err: any) {
      this.error = err?.message || 'Gagal memuat daftar organizer.';
    } finally {
      this.loading = false;
    }
  }

  onFilterChange() {
    this.page = 1;
    this.loadOrganizers();
  }

  onSearch() {
    this.page = 1;
    this.loadOrganizers();
  }

  async updateStatus(
    organizer: OrganizerProfile,
    newStatus: 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'PENDING',
  ) {
    const result = await Swal.fire({
      title: 'Konfirmasi Perubahan Status',
      text: `Apakah Anda yakin ingin mengubah status "${organizer.organizationName}" menjadi ${newStatus}?`,
      icon: newStatus === 'APPROVED' ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3577f1',
      cancelButtonColor: '#f06548',
      confirmButtonText: 'Ya, Ubah Status',
      cancelButtonText: 'Batal',
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await this.organizerService.updateStatus(organizer.id, newStatus);
      Swal.fire({
        title: 'Berhasil!',
        text: `Status untuk "${organizer.organizationName}" berhasil diubah menjadi ${newStatus}.`,
        icon: 'success',
        confirmButtonColor: '#3577f1',
      });
      await this.loadOrganizers();
    } catch (err: any) {
      Swal.fire({
        title: 'Gagal!',
        text: err?.message || 'Gagal mengubah status organizer.',
        icon: 'error',
        confirmButtonColor: '#f06548',
      });
    }
  }

  changePage(newPage: number) {
    if (newPage < 1 || newPage > this.meta.totalPages) return;
    this.page = newPage;
    this.loadOrganizers();
  }

  getStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'APPROVED':
        return 'badge bg-success-subtle text-success';
      case 'PENDING':
        return 'badge bg-warning-subtle text-warning';
      case 'REJECTED':
        return 'badge bg-danger-subtle text-danger';
      case 'SUSPENDED':
        return 'badge bg-secondary-subtle text-secondary';
      default:
        return 'badge bg-info-subtle text-info';
    }
  }
}
