import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EventService, EventItem } from '../../../core/services/event.service';
import { EventSessionService, EventSession } from '../../../core/services/event-session.service';
import { SpeakerService, Speaker } from '../../../core/services/speaker.service';
import { TicketTypeService, TicketType } from '../../../core/services/ticket-type.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.component.html',
  styleUrls: ['./event-detail.component.scss'],
})
export class EventDetailComponent implements OnInit {
  apiUrl = environment.url;
  eventId: string = '';
  event: EventItem | null = null;
  speakers: Speaker[] = [];
  ticketTypes: TicketType[] = [];
  loading = true;
  error = '';

  // Tab State: 1 = Overview, 2 = Sessions, 3 = Ticket Types
  activeTabId = 1;

  // Session Modal State
  isSessionModalOpen = false;
  isEditingSession = false;
  editingSessionId: string | null = null;
  sessionForm!: FormGroup;
  submittingSession = false;

  // Quick Add Speaker Modal State
  isSpeakerModalOpen = false;
  speakerForm!: FormGroup;
  submittingSpeaker = false;

  // Ticket Type Modal State
  isTicketModalOpen = false;
  isEditingTicket = false;
  editingTicketId: string | null = null;
  ticketForm!: FormGroup;
  submittingTicket = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private eventService: EventService,
    private eventSessionService: EventSessionService,
    private speakerService: SpeakerService,
    private ticketTypeService: TicketTypeService,
  ) { }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.params['id'];
    this.initForms();
    if (this.eventId) {
      this.loadData();
    } else {
      this.error = 'ID Event tidak valid.';
      this.loading = false;
    }
  }

  initForms(): void {
    this.sessionForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      roomOrTrack: [''],
      startTime: ['', [Validators.required]],
      endTime: ['', [Validators.required]],
      description: [''],
      speakerId: [''],
    });

    this.speakerForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      company: [''],
      bio: [''],
    });

    this.ticketForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      price: [0, [Validators.required, Validators.min(0)]],
      quota: [100, [Validators.required, Validators.min(1)]],
      saleStartDate: [''],
      saleEndDate: [''],
    });
  }

  async loadData(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      await Promise.all([
        this.loadEventDetail(),
        this.loadSpeakers(),
        this.loadTicketTypes(),
      ]);
    } catch (err: any) {
      console.error('Error loading detail data:', err);
    } finally {
      this.loading = false;
    }
  }

  async loadEventDetail(): Promise<void> {
    const res = await this.eventService.findOne(this.eventId);
    if (res && res.data) {
      this.event = res.data;
      if (res.data.ticketTypes && (!this.ticketTypes || this.ticketTypes.length === 0)) {
        this.ticketTypes = res.data.ticketTypes;
      }
    } else {
      this.error = 'Data event tidak ditemukan.';
    }
  }

  async loadSpeakers(): Promise<void> {
    try {
      const res = await this.speakerService.findAll();
      if (res && res.data) {
        this.speakers = res.data;
      }
    } catch (err) {
      console.error('Gagal memuat master speakers:', err);
    }
  }

  async loadTicketTypes(): Promise<void> {
    try {
      const res = await this.ticketTypeService.findByEventId(this.eventId);
      if (res && res.data) {
        this.ticketTypes = res.data;
      }
    } catch (err) {
      console.error('Gagal memuat daftar jenis tiket:', err);
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'DRAFT':
        return 'badge bg-secondary';
      case 'PUBLISHED':
        return 'badge bg-success';
      case 'COMPLETED':
        return 'badge bg-info';
      case 'CANCELLED':
        return 'badge bg-danger';
      default:
        return 'badge bg-light text-dark';
    }
  }

  formatDatetimeLocal(isoStr?: string): string {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    if (isNaN(date.getTime())) return '';
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  // --- Session Modal Handlers ---

  openAddSessionModal(): void {
    this.isEditingSession = false;
    this.editingSessionId = null;

    const sessions = this.event?.sessions;
    let defaultStart = '';
    let defaultEnd = '';


    if (!sessions || sessions?.length === 0) {
      defaultStart = this.event?.startDatetime
        ? this.formatDatetimeLocal(this.event.startDatetime)
        : '';
      defaultEnd = this.event?.endDatetime
        ? this.formatDatetimeLocal(this.event.endDatetime)
        : '';
    } else {
      const lastSession = sessions[sessions.length - 1];
      defaultStart = lastSession.endTime
        ? this.formatDatetimeLocal(lastSession.endTime)
        : '';
      defaultEnd = this.event?.endDatetime
        ? this.formatDatetimeLocal(this.event.endDatetime)
        : defaultStart;
    }

    this.sessionForm.reset({
      title: '',
      roomOrTrack: '',
      startTime: defaultStart,
      endTime: defaultEnd,
      description: '',
      speakerId: '',
    });

    this.isSessionModalOpen = true;
  }

  openEditSessionModal(session: EventSession): void {
    this.isEditingSession = true;
    this.editingSessionId = session.id;

    this.sessionForm.patchValue({
      title: session.title,
      roomOrTrack: session.roomOrTrack || '',
      startTime: this.formatDatetimeLocal(session.startTime),
      endTime: this.formatDatetimeLocal(session.endTime),
      description: session.description || '',
      speakerId: session.speakerId || '',
    });

    this.isSessionModalOpen = true;
  }

  closeSessionModal(): void {
    this.isSessionModalOpen = false;
    this.submittingSession = false;
  }

  async submitSession(): Promise<void> {
    if (this.sessionForm.invalid) {
      this.sessionForm.markAllAsTouched();
      return;
    }

    const val = this.sessionForm.value;
    const start = new Date(val.startTime);
    const end = new Date(val.endTime);

    if (start >= end) {
      Swal.fire({
        icon: 'error',
        title: 'Waktu Tidak Valid',
        text: 'Waktu mulai sesi harus lebih awal dari waktu selesai.',
      });
      return;
    }

    const payload = {
      eventId: this.eventId,
      title: val.title,
      description: val.description || undefined,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      roomOrTrack: val.roomOrTrack || undefined,
      speakerId: val.speakerId || undefined,
    };

    this.submittingSession = true;
    try {
      if (this.isEditingSession && this.editingSessionId) {
        await this.eventSessionService.update(this.editingSessionId, payload);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Sesi event berhasil diperbarui.',
          timer: 1800,
          showConfirmButton: false,
        });
      } else {
        await this.eventSessionService.create(payload);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Sesi event baru berhasil ditambahkan.',
          timer: 1800,
          showConfirmButton: false,
        });
      }

      this.closeSessionModal();
      await this.loadEventDetail();
    } catch (err: any) {
      console.error('Error saving session:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan Sesi',
        text: err.error?.message || 'Terjadi kesalahan saat menyimpan sesi event.',
      });
    } finally {
      this.submittingSession = false;
    }
  }

  async deleteSession(session: EventSession): Promise<void> {
    const confirm = await Swal.fire({
      title: 'Hapus Sesi Event?',
      text: `Apakah Anda yakin ingin menghapus sesi "${session.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f46a6a',
      cancelButtonColor: '#74788d',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });

    if (!confirm.isConfirmed) return;

    try {
      await this.eventSessionService.delete(session.id);
      Swal.fire({
        icon: 'success',
        title: 'Terhapus',
        text: 'Sesi event berhasil dihapus.',
        timer: 1500,
        showConfirmButton: false,
      });
      await this.loadEventDetail();
    } catch (err: any) {
      console.error('Error deleting session:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menghapus Sesi',
        text: err.error?.message || 'Terjadi kesalahan saat menghapus sesi.',
      });
    }
  }

  // --- Quick Add Speaker Modal Handlers ---

  openAddSpeakerModal(): void {
    this.speakerForm.reset({ name: '', company: '', bio: '' });
    this.isSpeakerModalOpen = true;
  }

  closeSpeakerModal(): void {
    this.isSpeakerModalOpen = false;
    this.submittingSpeaker = false;
  }

  async submitSpeaker(): Promise<void> {
    if (this.speakerForm.invalid) {
      this.speakerForm.markAllAsTouched();
      return;
    }

    this.submittingSpeaker = true;
    try {
      const res = await this.speakerService.create(this.speakerForm.value);
      Swal.fire({
        icon: 'success',
        title: 'Speaker Ditambahkan',
        text: 'Pembicara baru berhasil ditambahkan ke master data.',
        timer: 1500,
        showConfirmButton: false,
      });

      await this.loadSpeakers();
      if (res && res.data) {
        this.sessionForm.patchValue({ speakerId: res.data.id });
      }

      this.closeSpeakerModal();
    } catch (err: any) {
      console.error('Error creating speaker:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menambah Speaker',
        text: err.error?.message || 'Terjadi kesalahan saat menambahkan speaker.',
      });
    } finally {
      this.submittingSpeaker = false;
    }
  }

  // --- Ticket Type Handlers ---

  openAddTicketModal(): void {
    this.isEditingTicket = false;
    this.editingTicketId = null;

    const defaultStart = this.formatDatetimeLocal(new Date().toISOString());
    const defaultEnd = this.event?.startDatetime
      ? this.formatDatetimeLocal(this.event.startDatetime)
      : '';

    this.ticketForm.reset({
      name: '',
      price: 0,
      quota: 100,
      saleStartDate: defaultStart,
      saleEndDate: defaultEnd,
    });

    this.isTicketModalOpen = true;
  }

  openEditTicketModal(ticket: TicketType): void {
    this.isEditingTicket = true;
    this.editingTicketId = ticket.id;

    this.ticketForm.patchValue({
      name: ticket.name,
      price: Number(ticket.price),
      quota: ticket.quota,
      saleStartDate: this.formatDatetimeLocal(ticket.saleStartDate),
      saleEndDate: this.formatDatetimeLocal(ticket.saleEndDate),
    });

    this.isTicketModalOpen = true;
  }

  closeTicketModal(): void {
    this.isTicketModalOpen = false;
    this.submittingTicket = false;
  }

  async submitTicket(): Promise<void> {
    if (this.ticketForm.invalid) {
      this.ticketForm.markAllAsTouched();
      return;
    }

    const val = this.ticketForm.value;
    if (val.saleStartDate && val.saleEndDate) {
      const start = new Date(val.saleStartDate);
      const end = new Date(val.saleEndDate);
      if (start >= end) {
        Swal.fire({
          icon: 'error',
          title: 'Periode Tidak Valid',
          text: 'Waktu mulai penjualan tiket harus lebih awal dari waktu berakhir.',
        });
        return;
      }
    }

    const payload = {
      eventId: this.eventId,
      name: val.name,
      price: Number(val.price),
      quota: Number(val.quota),
      saleStartDate: val.saleStartDate ? new Date(val.saleStartDate).toISOString() : undefined,
      saleEndDate: val.saleEndDate ? new Date(val.saleEndDate).toISOString() : undefined,
    };

    this.submittingTicket = true;
    try {
      if (this.isEditingTicket && this.editingTicketId) {
        await this.ticketTypeService.update(this.editingTicketId, payload);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Jenis tiket berhasil diperbarui.',
          timer: 1800,
          showConfirmButton: false,
        });
      } else {
        await this.ticketTypeService.create(payload);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Jenis tiket baru berhasil ditambahkan.',
          timer: 1800,
          showConfirmButton: false,
        });
      }

      this.closeTicketModal();
      await Promise.all([this.loadTicketTypes(), this.loadEventDetail()]);
    } catch (err: any) {
      console.error('Error saving ticket type:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan Tiket',
        text: err.error?.message || 'Terjadi kesalahan saat menyimpan jenis tiket.',
      });
    } finally {
      this.submittingTicket = false;
    }
  }

  async deleteTicket(ticket: TicketType): Promise<void> {
    const confirm = await Swal.fire({
      title: 'Hapus Jenis Tiket?',
      text: `Apakah Anda yakin ingin menghapus tiket "${ticket.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f46a6a',
      cancelButtonColor: '#74788d',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });

    if (!confirm.isConfirmed) return;

    try {
      await this.ticketTypeService.delete(ticket.id);
      Swal.fire({
        icon: 'success',
        title: 'Terhapus',
        text: 'Jenis tiket berhasil dihapus.',
        timer: 1500,
        showConfirmButton: false,
      });
      await Promise.all([this.loadTicketTypes(), this.loadEventDetail()]);
    } catch (err: any) {
      console.error('Error deleting ticket type:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menghapus Tiket',
        text: err.error?.message || 'Terjadi kesalahan saat menghapus jenis tiket.',
      });
    }
  }

  getTicketSaleStatus(ticket: TicketType): { label: string; badgeClass: string } {
    const now = new Date().getTime();
    if (ticket.soldCount >= ticket.quota) {
      return { label: 'Habis (Sold Out)', badgeClass: 'badge bg-danger' };
    }
    if (ticket.saleStartDate && new Date(ticket.saleStartDate).getTime() > now) {
      return { label: 'Belum Dibuka', badgeClass: 'badge bg-warning' };
    }
    if (ticket.saleEndDate && new Date(ticket.saleEndDate).getTime() < now) {
      return { label: 'Penjualan Berakhir', badgeClass: 'badge bg-secondary' };
    }
    return { label: 'Tersedia', badgeClass: 'badge bg-success' };
  }

  getSoldPercentage(sold: number, quota: number): number {
    if (!quota || quota <= 0) return 0;
    return Math.min(100, Math.round((sold / quota) * 100));
  }

  getTotalTicketQuota(): number {
    return this.ticketTypes.reduce((acc, t) => acc + (t.quota || 0), 0);
  }

  getTotalTicketSold(): number {
    return this.ticketTypes.reduce((acc, t) => acc + (t.soldCount || 0), 0);
  }
}
