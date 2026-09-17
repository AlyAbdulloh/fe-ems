import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Venue, VenueService } from '../../core/services/venue.service';
import { PaginationMeta } from '../../core/models/api-response.model';
import { latLng, tileLayer, marker, icon, Layer, Map, LeafletMouseEvent } from 'leaflet';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-venue-manage',
  templateUrl: './venue-manage.component.html',
  styleUrls: ['./venue-manage.component.scss'],
})
export class VenueManageComponent implements OnInit, OnDestroy {
  venues: Venue[] = [];
  loading = false;
  saving = false;
  error = '';

  page = 1;
  limit = 10;
  typeFilter = '';
  searchQuery = '';
  meta: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 };

  private searchSubject = new Subject<string>();
  private searchSub!: Subscription;

  venueForm!: UntypedFormGroup;
  submitted = false;
  editingVenue: Venue | null = null;
  isModalOpen = false;

  // Leaflet Map Picker Properties
  map!: Map;
  mapOptions = {
    layers: [
      tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }),
    ],
    zoom: 12,
    center: latLng(-6.2088, 106.8456), // Jakarta default
  };
  mapLayers: Layer[] = [];

  private markerIcon = icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  constructor(
    private formBuilder: UntypedFormBuilder,
    private venueService: VenueService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadVenues();

    this.searchSub = this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((query) => {
        this.searchQuery = query;
        this.page = 1;
        this.loadVenues();
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

  initForm() {
    this.venueForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(150)]],
      type: ['OFFLINE', Validators.required],
      city: ['', [Validators.maxLength(100)]],
      address: [''],
      capacity: [null, [Validators.min(1)]],
      latitude: [null],
      longitude: [null],
      meetingUrl: ['', [Validators.maxLength(500)]],
    });
  }

  get f() {
    return this.venueForm.controls;
  }

  onMapReady(map: Map) {
    this.map = map;
    setTimeout(() => {
      this.map.invalidateSize();
    }, 300);
  }

  onMapClick(event: LeafletMouseEvent) {
    const lat = parseFloat(event.latlng.lat.toFixed(6));
    const lng = parseFloat(event.latlng.lng.toFixed(6));

    this.venueForm.patchValue({
      latitude: lat,
      longitude: lng,
    });

    this.setMarker(lat, lng);
  }

  setMarker(lat: number, lng: number) {
    const newMarker = marker([lat, lng], { icon: this.markerIcon });
    this.mapLayers = [newMarker];
    if (this.map) {
      this.map.setView([lat, lng], Math.max(this.map.getZoom(), 14));
    }
  }

  async loadVenues() {
    this.loading = true;
    this.error = '';

    try {
      const res = await this.venueService.findAll({
        page: this.page,
        limit: this.limit,
        type: (this.typeFilter as any) || undefined,
        search: this.searchQuery || undefined,
      });

      this.venues = res.data || [];
      if (res.meta) {
        this.meta = res.meta;
      }
    } catch (err: any) {
      this.error = err?.message || 'Gagal memuat lokasi/venue event.';
    } finally {
      this.loading = false;
    }
  }

  onSearch() {
    this.page = 1;
    this.loadVenues();
  }

  onFilterChange() {
    this.page = 1;
    this.loadVenues();
  }

  changePage(newPage: number) {
    if (newPage < 1 || newPage > this.meta.totalPages) return;
    this.page = newPage;
    this.loadVenues();
  }

  openCreateModal() {
    this.editingVenue = null;
    this.submitted = false;
    this.venueForm.reset({
      type: 'OFFLINE',
    });
    this.mapLayers = [];
    this.isModalOpen = true;

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
        this.map.setView([-6.2088, 106.8456], 12);
      }
    }, 300);
  }

  openEditModal(venue: Venue) {
    this.editingVenue = venue;
    this.submitted = false;
    this.venueForm.patchValue({
      name: venue.name,
      type: venue.type || 'OFFLINE',
      city: venue.city || '',
      address: venue.address || '',
      capacity: venue.capacity || null,
      latitude: venue.latitude || null,
      longitude: venue.longitude || null,
      meetingUrl: venue.meetingUrl || '',
    });
    this.isModalOpen = true;

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
        if (venue.latitude && venue.longitude) {
          this.setMarker(venue.latitude, venue.longitude);
        } else {
          this.mapLayers = [];
          this.map.setView([-6.2088, 106.8456], 12);
        }
      }
    }, 300);
  }

  closeModal() {
    this.isModalOpen = false;
  }

  async onSubmit() {
    this.submitted = true;
    if (this.venueForm.invalid) return;

    this.saving = true;
    const payload = this.venueForm.value;

    try {
      if (this.editingVenue) {
        await this.venueService.update(this.editingVenue.id, payload);
        Swal.fire({
          title: 'Berhasil!',
          text: 'Data venue berhasil diperbarui.',
          icon: 'success',
          confirmButtonColor: '#3577f1',
        });
      } else {
        await this.venueService.create(payload);
        Swal.fire({
          title: 'Berhasil!',
          text: 'Venue baru berhasil ditambahkan.',
          icon: 'success',
          confirmButtonColor: '#3577f1',
        });
      }
      this.closeModal();
      await this.loadVenues();
    } catch (err: any) {
      Swal.fire({
        title: 'Gagal!',
        text: err?.message || 'Gagal menyimpan data venue.',
        icon: 'error',
        confirmButtonColor: '#f06548',
      });
    } finally {
      this.saving = false;
    }
  }


  async deleteVenue(venue: Venue) {
    const result = await Swal.fire({
      title: 'Hapus Venue?',
      text: `Apakah Anda yakin ingin menghapus venue "${venue.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f06548',
      cancelButtonColor: '#74788d',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
    });

    if (!result.isConfirmed) return;

    try {
      await this.venueService.remove(venue.id);
      Swal.fire({
        title: 'Terhapus!',
        text: 'Venue telah berhasil dihapus.',
        icon: 'success',
        confirmButtonColor: '#3577f1',
      });
      await this.loadVenues();
    } catch (err: any) {
      Swal.fire({
        title: 'Gagal!',
        text: err?.message || 'Gagal menghapus venue.',
        icon: 'error',
        confirmButtonColor: '#f06548',
      });
    }
  }

  getVenueBadgeClass(type?: string): string {
    switch (type) {
      case 'OFFLINE':
        return 'badge bg-primary-subtle text-primary';
      case 'ONLINE':
        return 'badge bg-info-subtle text-info';
      case 'HYBRID':
        return 'badge bg-warning-subtle text-warning';
      default:
        return 'badge bg-secondary-subtle text-secondary';
    }
  }
}
