import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EventService, EventItem } from '../../../core/services/event.service';
import { EventSessionService, EventSession } from '../../../core/services/event-session.service';
import { SpeakerService, Speaker } from '../../../core/services/speaker.service';
import { TicketTypeService, TicketType } from '../../../core/services/ticket-type.service';
import { PromoCodeService, PromoCode, DiscountType } from '../../../core/services/promo-code.service';
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
  promoCodes: PromoCode[] = [];
  loading = true;
  error = '';

  // Tab State: 1 = Overview, 2 = Sessions, 3 = Ticket Types, 4 = Kode Promo
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

  // Promo Code Modal State
  isPromoModalOpen = false;
  isEditingPromo = false;
  editingPromoId: string | null = null;
  promoCodeForm!: FormGroup;
  submittingPromo = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private eventService: EventService,
    private eventSessionService: EventSessionService,
    private speakerService: SpeakerService,
    private ticketTypeService: TicketTypeService,
    private promoCodeService: PromoCodeService,
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

    this.promoCodeForm = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(50)]],
      discountType: ['PERCENTAGE', [Validators.required]],
      discountValue: [10, [Validators.required, Validators.min(1)]],
      maxUsage: [100, [Validators.required, Validators.min(1)]],
      validFrom: [''],
      validUntil: [''],
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
        this.loadPromoCodes(),
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

  async loadPromoCodes(): Promise<void> {
    try {
      const res = await this.promoCodeService.findByEventId(this.eventId);
      if (res && res.data) {
        this.promoCodes = res.data;
      }
    } catch (err) {
      console.error('Gagal memuat daftar kode promo:', err);
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

    const ticketPrice = this.event?.pricingType === 'FREE' ? 0 : Number(ticket.price);

    this.ticketForm.patchValue({
      name: ticket.name,
      price: ticketPrice,
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

    if (this.event?.pricingType === 'FREE' && Number(val.price) !== 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Harga Tiket Tidak Valid',
        text: 'Harga harus 0 karena event gratis.',
        confirmButtonColor: '#3577f1',
      });
      return;
    }

    if (val.saleStartDate && val.saleEndDate) {
      const start = new Date(val.saleStartDate);
      const end = new Date(val.saleEndDate);
      if (start >= end) {
        Swal.fire({
          icon: 'error',
          title: 'Periode Tidak Valid',
          text: 'Waktu mulai penjualan tiket harus lebih awal dari waktu selesai.',
        });
        return;
      }
    }

    const ticketPrice = this.event?.pricingType === 'FREE' ? 0 : Number(val.price);

    const payload = {
      eventId: this.eventId,
      name: val.name,
      price: ticketPrice,
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

  // --- Promo Code Handlers ---

  openAddPromoModal(): void {
    if (this.event?.pricingType === 'FREE') {
      Swal.fire({
        icon: 'info',
        title: 'Event Gratis',
        text: 'Event gratis tidak dapat menambahkan kode promo.',
        confirmButtonColor: '#3577f1',
      });
      return;
    }

    this.isEditingPromo = false;
    this.editingPromoId = null;

    const defaultStart = this.formatDatetimeLocal(new Date().toISOString());
    const defaultEnd = this.event?.endDatetime
      ? this.formatDatetimeLocal(this.event.endDatetime)
      : '';

    this.promoCodeForm.reset({
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxUsage: 100,
      validFrom: defaultStart,
      validUntil: defaultEnd,
    });

    this.isPromoModalOpen = true;
  }

  openEditPromoModal(promo: PromoCode): void {
    this.isEditingPromo = true;
    this.editingPromoId = promo.id;

    this.promoCodeForm.patchValue({
      code: promo.code,
      discountType: promo.discountType || 'PERCENTAGE',
      discountValue: Number(promo.discountValue),
      maxUsage: promo.maxUsage,
      validFrom: this.formatDatetimeLocal(promo.validFrom),
      validUntil: this.formatDatetimeLocal(promo.validUntil),
    });

    this.isPromoModalOpen = true;
  }

  closePromoModal(): void {
    this.isPromoModalOpen = false;
    this.submittingPromo = false;
  }

  async submitPromo(): Promise<void> {
    if (this.event?.pricingType === 'FREE') {
      Swal.fire({
        icon: 'warning',
        title: 'Event Gratis',
        text: 'Event gratis tidak dapat menambahkan kode promo.',
        confirmButtonColor: '#3577f1',
      });
      return;
    }

    if (this.promoCodeForm.invalid) {
      this.promoCodeForm.markAllAsTouched();
      return;
    }

    const val = this.promoCodeForm.value;
    if (val.validFrom && val.validUntil) {
      const start = new Date(val.validFrom);
      const end = new Date(val.validUntil);
      if (start >= end) {
        Swal.fire({
          icon: 'error',
          title: 'Periode Tidak Valid',
          text: 'Waktu mulai promo harus lebih awal dari waktu berakhir.',
        });
        return;
      }
    }

    if (val.discountType === 'PERCENTAGE' && Number(val.discountValue) > 100) {
      Swal.fire({
        icon: 'error',
        title: 'Diskon Tidak Valid',
        text: 'Diskon persentase tidak boleh lebih dari 100%.',
      });
      return;
    }

    const payload = {
      eventId: this.eventId,
      code: val.code.toUpperCase().trim(),
      discountType: val.discountType as DiscountType,
      discountValue: Number(val.discountValue),
      maxUsage: Number(val.maxUsage),
      validFrom: val.validFrom ? new Date(val.validFrom).toISOString() : undefined,
      validUntil: val.validUntil ? new Date(val.validUntil).toISOString() : undefined,
    };

    this.submittingPromo = true;
    try {
      if (this.isEditingPromo && this.editingPromoId) {
        await this.promoCodeService.update(this.editingPromoId, payload);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Kode promo berhasil diperbarui.',
          timer: 1800,
          showConfirmButton: false,
        });
      } else {
        await this.promoCodeService.create(payload);
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Kode promo baru berhasil ditambahkan.',
          timer: 1800,
          showConfirmButton: false,
        });
      }

      this.closePromoModal();
      await this.loadPromoCodes();
    } catch (err: any) {
      console.error('Error saving promo code:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan Kode Promo',
        text: err.error?.message || 'Terjadi kesalahan saat menyimpan kode promo.',
      });
    } finally {
      this.submittingPromo = false;
    }
  }

  async deletePromo(promo: PromoCode): Promise<void> {
    const confirm = await Swal.fire({
      title: 'Hapus Kode Promo?',
      text: `Apakah Anda yakin ingin menghapus kode promo "${promo.code}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f46a6a',
      cancelButtonColor: '#74788d',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });

    if (!confirm.isConfirmed) return;

    try {
      await this.promoCodeService.delete(promo.id);
      Swal.fire({
        icon: 'success',
        title: 'Terhapus',
        text: 'Kode promo berhasil dihapus.',
        timer: 1500,
        showConfirmButton: false,
      });
      await this.loadPromoCodes();
    } catch (err: any) {
      console.error('Error deleting promo code:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menghapus Kode Promo',
        text: err.error?.message || 'Terjadi kesalahan saat menghapus kode promo.',
      });
    }
  }

  getPromoStatus(promo: PromoCode): { label: string; badgeClass: string } {
    const now = new Date().getTime();
    if (promo.maxUsage && promo.usedCount !== undefined && promo.usedCount >= promo.maxUsage) {
      return { label: 'Batas Pemakaian Tercapai', badgeClass: 'badge bg-danger' };
    }
    if (promo.validFrom && new Date(promo.validFrom).getTime() > now) {
      return { label: 'Belum Berlaku', badgeClass: 'badge bg-warning' };
    }
    if (promo.validUntil && new Date(promo.validUntil).getTime() < now) {
      return { label: 'Kedaluwarsa', badgeClass: 'badge bg-secondary' };
    }
    return { label: 'Aktif', badgeClass: 'badge bg-success' };
  }

  getPromoUsagePercentage(used: number = 0, max: number): number {
    if (!max || max <= 0) return 0;
    return Math.min(100, Math.round((used / max) * 100));
  }
}
