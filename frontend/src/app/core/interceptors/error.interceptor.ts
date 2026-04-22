import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth    = inject(AuthService);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expired or invalid — log out silently
        auth.logout();
        snackBar.open('Session expired. Please log in again.', 'Close', {
          duration: 4000,
          panelClass: ['error-snack'],
        });
      } else if (error.status === 403) {
        snackBar.open('You do not have permission to do that.', 'Close', {
          duration: 4000,
          panelClass: ['error-snack'],
        });
      } else if (error.status === 500) {
        snackBar.open('A server error occurred. Please try again later.', 'Close', {
          duration: 5000,
          panelClass: ['error-snack'],
        });
      }
      return throwError(() => error);
    }),
  );
};
