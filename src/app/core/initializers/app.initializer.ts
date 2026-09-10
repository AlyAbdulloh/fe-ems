import { AuthenticationService } from '../services/auth.service';

export function initializeAuth(authService: AuthenticationService): () => Promise<void> {
  return async () => {
    try {
      await authService.getMe();
    } catch {
      // User is unauthenticated on initial boot, application continues gracefully
    }
  };
}
