import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EventService, EventItem } from '../../../core/services/event.service';
import { EventSessionService, EventSession } from '../../../core/services/event-session.service';
import { SpeakerService, Speaker } from '../../../core/services/speaker.service';
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
  loading = true;
  error = '';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private eventService: EventService,
    private eventSessionService: EventSessionService,
    private speakerService: SpeakerService,
  ) {}

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
  }

  async loadData(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      await Promise.all([this.loadEventDetail(), this.loadSpeakers()]);
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

    const defaultStart = this.event?.startDatetime
      ? this.formatDatetimeLocal(this.event.startDatetime)
      : '';
    const defaultEnd = this.event?.endDatetime
      ? this.formatDatetimeLocal(this.event.endDatetime)
      : '';

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
}
