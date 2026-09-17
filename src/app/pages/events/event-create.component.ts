import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EventService } from '../../core/services/event.service';
import { EventCategory, EventCategoryService } from '../../core/services/event-category.service';
import { Venue, VenueService } from '../../core/services/venue.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-event-create',
  templateUrl: './event-create.component.html',
  styleUrls: ['./event-create.component.scss'],
})
export class EventCreateComponent implements OnInit {
  eventForm!: UntypedFormGroup;
  submitted = false;
  loading = false;
  error = '';

  categories: EventCategory[] = [];
  venues: Venue[] = [];
  loadingOptions = true;

  selectedFile: File | null = null;
  bannerPreviewUrl: string = '';

  constructor(
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private eventService: EventService,
    private categoryService: EventCategoryService,
    private venueService: VenueService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadDropdownOptions();
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

  onFileSelected(event: any) {
    const file: File = event.target.files?.[0];
    if (!file) {
      this.selectedFile = null;
      this.bannerPreviewUrl = '';
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
      this.bannerPreviewUrl = '';
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

      await this.eventService.create(payload as any);

      Swal.fire({
        title: 'Berhasil!',
        text: 'Event baru berhasil dibuat.',
        icon: 'success',
        confirmButtonColor: '#3577f1',
      });

      this.router.navigate(['/events/manage']);
    } catch (err: any) {
      this.error = err?.error?.message || err?.message || 'Gagal membuat event.';
    } finally {
      this.loading = false;
    }
  }
}

