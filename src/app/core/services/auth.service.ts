import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { GlobalComponent } from '../../global-component';
import { User } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';
import { LoginRequest, RegisterRequest } from '../models/auth.model';

const AUTH_API = GlobalComponent.AUTH_API;

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Fetch current authenticated user from BE /auth/me
   */
  async getMe(): Promise<User | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<User>>(`${AUTH_API}me`),
      );
      const user = response?.data || null;
      this.currentUserSubject.next(user);
      return user;
    } catch {
      this.currentUserSubject.next(null);
      return null;
    }
  }

  /**
   * Login user with credentials
   */
  async login(
    credentialsOrEmail: LoginRequest | string,
    password?: string,
  ): Promise<ApiResponse> {
    const credentials: LoginRequest =
      typeof credentialsOrEmail === 'string'
        ? { email: credentialsOrEmail, password: password! }
        : credentialsOrEmail;

    const response = await firstValueFrom(
      this.http.post<ApiResponse>(`${AUTH_API}login`, credentials),
    );
    await this.getMe();
    return response;
  }

  /**
   * Register new user
   */
  async register(
    dataOrEmail: RegisterRequest | string,
    nameOrFirstName?: string,
    password?: string,
  ): Promise<ApiResponse> {
    let data: RegisterRequest;
    if (typeof dataOrEmail === 'string') {
      data = {
        name: nameOrFirstName!,
        email: dataOrEmail,
        password: password!,
      };
    } else {
      data = dataOrEmail;
    }

    return await firstValueFrom(
      this.http.post<ApiResponse>(`${AUTH_API}register`, data),
    );
  }

  /**
   * Logout user and clear session state
   */
  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${AUTH_API}logout`, {}));
    } catch {
      // Ignore network errors during logout cleanup
    } finally {
      this.currentUserSubject.next(null);
      this.router.navigate(['/auth/login']);
    }
  }
}
