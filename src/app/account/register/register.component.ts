import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  signupForm!: UntypedFormGroup;
  submitted = false;
  successmsg = false;
  error = '';
  year: number = new Date().getFullYear();

  constructor(
    private formBuilder: UntypedFormBuilder,
    private router: Router,
    private authenticationService: AuthenticationService,
  ) {}

  ngOnInit(): void {
    this.signupForm = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get f() {
    return this.signupForm.controls;
  }

  async onSubmit() {
    this.submitted = true;
    this.error = '';
    this.successmsg = false;

    if (this.signupForm.invalid) {
      return;
    }

    try {
      await this.authenticationService.register(this.signupForm.value);
      this.successmsg = true;
      setTimeout(() => {
        this.router.navigate(['/auth/login']);
      }, 1500);
    } catch (err: any) {
      this.error = err?.message || 'Registration failed. Please try again.';
    }
  }
}
