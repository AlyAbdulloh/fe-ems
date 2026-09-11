import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { OrganizerService } from '../../../core/services/organizer.service';
import { AuthenticationService } from '../../../core/services/auth.service';
import { OrganizerProfile, User } from '../../../core/models/user.model';

@Component({
  selector: 'app-organizer-apply',
  templateUrl: './organizer-apply.component.html',
  styleUrls: ['./organizer-apply.component.scss'],
})
export class OrganizerApplyComponent implements OnInit {
  organizerForm!: UntypedFormGroup;
  submitted = false;
  loading = false;
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
    try {
      const res = await this.organizerService.getProfile();
      if (res?.data) {
        this.organizerProfile = res.data;
        this.organizerForm.patchValue({
          organizationName: res.data.organizationName,
          description: res.data.description || '',
        });
      }
    } catch {
      // Profile not created yet
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
      if (this.organizerProfile) {
        // Update existing profile
        const res = await this.organizerService.updateProfile(this.organizerForm.value);
        this.organizerProfile = res.data || this.organizerProfile;
        this.successMsg = 'Organizer profile updated successfully.';
      } else {
        // Submit new application
        const res = await this.organizerService.apply(this.organizerForm.value);
        this.organizerProfile = res.data || null;
        this.successMsg = 'Organizer application submitted successfully and is pending review.';
      }
      await this.authService.getMe();
    } catch (err: any) {
      this.error = err?.message || 'Failed to submit organizer application.';
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
