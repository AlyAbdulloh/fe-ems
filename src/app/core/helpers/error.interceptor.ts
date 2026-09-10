import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          // If 401 Unauthorized, redirect to login unless already on login/register route
          const currentUrl = this.router.url;
          if (!currentUrl.includes('/auth/login') && !currentUrl.includes('/auth/register')) {
            this.router.navigate(['/auth/login'], {
              queryParams: { returnUrl: currentUrl },
            });
          }
        }
        const errorMsg =
          err.error?.message || err.statusText || 'An unexpected error occurred';
        return throwError(() => new Error(typeof errorMsg === 'string' ? errorMsg : errorMsg[0]));
      }),
    );
  }
}
