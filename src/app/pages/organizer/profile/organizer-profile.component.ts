import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { OrganizerService } from '../../../core/services/organizer.service';
import { AuthenticationService } from '../../../core/services/auth.service';
import { OrganizerProfile, User } from '../../../core/models/user.model';

@Component({
  selector: 'app-organizer-profile',
  templateUrl: './organizer-profile.component.html',
  styleUrls: ['./organizer-profile.component.scss'],
})
export class OrganizerProfileComponent implements OnInit {
  organizerForm!: UntypedFormGroup;
  submitted = false;
  loading = false;
  fetching = true;
  error = '';
  successMsg = '';

  currentUser: User | null = null;
  organizerProfile: OrganizerProfile | null = null;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private organizerService: OrganizerService,
    private authService: AuthenticationService,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.organizerProfile = this.currentUser?.organizer || null;

    this.organizerForm = this.formBuilder.group({
      organizationName: [
        this.organizerProfile?.organizationName || '',
        [Validators.required, Validators.maxLength(150)],
      ],
      description: [this.organizerProfile?.description || ''],
    });

    this.fetchProfile();
  }

  get f() {
    return this.organizerForm.controls;
  }

  async fetchProfile() {
    this.fetching = true;
    try {
      const res = await this.organizerService.getProfile();
      if (res?.data) {
        this.organizerProfile = res.data;
        this.organizerForm.patchValue({
          organizationName: res.data.organizationName,
          description: res.data.description || '',
        });
      }
    } catch (err: any) {
      this.error = err?.message || 'Gagal memuat profil organizer.';
    } finally {
      this.fetching = false;
    }
  }

  async onSubmit() {
    this.submitted = true;
    this.error = '';
    this.successMsg = '';

    if (this.organizerForm.invalid) {
      return;
    }

    this.loading = true;

    try {
      const res = await this.organizerService.updateProfile(this.organizerForm.value);
      if (res?.data) {
        this.organizerProfile = res.data;
      }
      this.successMsg = 'Identitas organizer berhasil diperbarui.';
      await this.authService.getMe();
    } catch (err: any) {
      this.error = err?.message || 'Gagal memperbarui profil organizer.';
    } finally {
      this.loading = false;
    }
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
