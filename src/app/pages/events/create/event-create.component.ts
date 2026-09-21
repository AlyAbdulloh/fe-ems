import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { EventCategory, EventCategoryService } from '../../../core/services/event-category.service';
import { Venue, VenueService } from '../../../core/services/venue.service';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-event-create',
  templateUrl: './event-create.component.html',
  styleUrls: ['./event-create.component.scss'],
})
export class EventCreateComponent implements OnInit {
  apiUrl = environment.url;

  eventForm!: UntypedFormGroup;
  submitted = false;
  loading = false;
  error = '';

  isEditMode = false;
  eventId = '';

  categories: EventCategory[] = [];
  venues: Venue[] = [];
  loadingOptions = true;

  selectedFile: File | null = null;
  bannerPreviewUrl: string = '';

  constructor(
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private eventService: EventService,
    private categoryService: EventCategoryService,
    private venueService: VenueService,
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.checkEditMode();
  }

  initForm() {
    this.eventForm = this.formBuilder.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      categoryId: [''],
      venueId: [''],
      bannerImage: [''],
      startDatetime: ['', Validators.required],
      endDatetime: ['', Validators.required],
      description: [''],
      status: ['DRAFT', Validators.required],
    });
  }

  get f() {
    return this.eventForm.controls;
  }

  private formatDatetimeLocal(isoString?: string): string {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async checkEditMode() {
    await this.loadDropdownOptions();

    const paramId = this.route.snapshot.params['id'];
    if (paramId) {
      this.isEditMode = true;
      this.eventId = paramId;
      await this.loadEventDetail(paramId);
    }
  }

  async loadEventDetail(id: string) {
    this.loading = true;
    try {
      const res = await this.eventService.findOne(id);
      const ev = res.data;
      if (ev) {
        this.eventForm.patchValue({
          title: ev.title,
          categoryId: ev.categoryId || '',
          venueId: ev.venueId || '',
          bannerImage: ev.bannerImage || '',
          startDatetime: this.formatDatetimeLocal(ev.startDatetime),
          endDatetime: this.formatDatetimeLocal(ev.endDatetime),
          description: ev.description || '',
          status: ev.status || 'DRAFT',
        });

        if (ev.bannerImage) {
          this.bannerPreviewUrl = this.apiUrl + ev.bannerImage;
        }
      }
    } catch (err: any) {
      this.error = err?.message || 'Gagal memuat detail event.';
    } finally {
      this.loading = false;
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files?.[0];
    if (!file) {
      this.selectedFile = null;
      this.bannerPreviewUrl = this.eventForm.value.bannerImage || '';
      return;
    }

    const allowedExtensions = ['jpg', 'jpeg', 'png'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

    if (!fileExt || !allowedExtensions.includes(fileExt) || file.size > maxSizeBytes) {
      Swal.fire({
        title: 'File Banner Tidak Valid',
        text: 'File banner harus berupa gambar dengan format JPG, JPEG, atau PNG dan berukuran maksimal 5 MB.',
        icon: 'warning',
        confirmButtonColor: '#f06548',
      });
      event.target.value = '';
      this.selectedFile = null;
      this.bannerPreviewUrl = this.eventForm.value.bannerImage || '';
      return;
    }

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.bannerPreviewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  async loadDropdownOptions() {
    this.loadingOptions = true;
    try {
      const [catRes, venueRes] = await Promise.all([
        this.categoryService.findAll(),
        this.venueService.findAll({ limit: 100 }),
      ]);

      this.categories = catRes.data || [];
      this.venues = venueRes.data || [];
    } catch (err: any) {
      this.error = 'Gagal memuat pilihan kategori dan venue event.';
    } finally {
      this.loadingOptions = false;
    }
  }

  async checkVenueAvailability(): Promise<boolean> {
    const venueId = this.eventForm.value.venueId;
    const start = this.eventForm.value.startDatetime;
    const end = this.eventForm.value.endDatetime;

    if (!venueId || !start || !end) return true;

    const startDate = new Date(start);
    const endDate = new Date(end);
    if (startDate >= endDate) return true;

    try {
      const res = await this.eventService.checkVenueAvailability(
        venueId,
        new Date(start).toISOString(),
        new Date(end).toISOString(),
        this.isEditMode ? this.eventId : undefined,
      );

      const data = res.data || (res as any);
      if (data && data.available === false) {
        Swal.fire({
          title: 'Venue Sudah Dibooking!',
          text: data.message || 'Venue ini sudah dibooking pada tanggal & waktu tersebut. Silakan pilih venue atau waktu lain.',
          icon: 'warning',
          confirmButtonColor: '#f06548',
        });
        return false;
      }
      return true;
    } catch (err: any) {
      const msg = err?.error?.message || err?.message;
      if (msg) {
        Swal.fire({
          title: 'Venue Tidak Tersedia!',
          text: msg,
          icon: 'warning',
          confirmButtonColor: '#f06548',
        });
        return false;
      }
      return true;
    }
  }

  async onSubmit() {
    this.submitted = true;
    this.error = '';

    if (this.eventForm.invalid) {
      return;
    }

    const start = new Date(this.eventForm.value.startDatetime);
    const end = new Date(this.eventForm.value.endDatetime);

    if (start >= end) {
      this.error = 'Waktu mulai event harus lebih awal dari waktu selesai.';
      return;
    }

    const isAvailable = await this.checkVenueAvailability();
    if (!isAvailable) {
      return;
    }

    this.loading = true;

    try {
      let bannerUrl = this.eventForm.value.bannerImage;

      if (this.selectedFile) {
        const uploadRes = await this.eventService.uploadBanner(this.selectedFile);
        bannerUrl = uploadRes.data?.url || (uploadRes as any).url || bannerUrl;
      }

      const payload = {
        title: this.eventForm.value.title.trim(),
        categoryId: this.eventForm.value.categoryId || undefined,
        venueId: this.eventForm.value.venueId || undefined,
        bannerImage: bannerUrl || undefined,
        startDatetime: new Date(this.eventForm.value.startDatetime).toISOString(),
        endDatetime: new Date(this.eventForm.value.endDatetime).toISOString(),
        description: this.eventForm.value.description || undefined,
        status: this.eventForm.value.status,
      };

      if (this.isEditMode) {
        await this.eventService.update(this.eventId, payload as any);
        Swal.fire({
          title: 'Berhasil!',
          text: 'Data event berhasil diperbarui.',
          icon: 'success',
          confirmButtonColor: '#3577f1',
        });
      } else {
        await this.eventService.create(payload as any);
        Swal.fire({
          title: 'Berhasil!',
          text: 'Event baru berhasil dibuat.',
          icon: 'success',
          confirmButtonColor: '#3577f1',
        });
      }

      this.router.navigate(['/events/manage']);
    } catch (err: any) {
      this.error = err?.error?.message || err?.message || 'Gagal menyimpan data event.';
    } finally {
      this.loading = false;
    }
  }
}


