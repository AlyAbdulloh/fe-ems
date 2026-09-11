import { Injectable } from '@angular/core';
import {
  Router,
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { AuthenticationService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthenticationService,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean | UrlTree {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      return this.router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: state.url },
      });
    }

    const expectedRoles: string[] = route.data['roles'] || [];
    if (expectedRoles.length === 0) {
      return true;
    }

    const userRoles: string[] = currentUser.roles?.map((r: any) =>
      typeof r === 'string' ? r : r.role?.name
    ) || [];

    const hasRole = expectedRoles.some((role) => userRoles.includes(role));

    if (hasRole) {
      return true;
    }

    return this.router.createUrlTree(['/']);
  }
}
