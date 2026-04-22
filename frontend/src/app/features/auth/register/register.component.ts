import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

function kbtuEmailValidator(ctrl: AbstractControl): ValidationErrors | null {
  const v: string = ctrl.value ?? '';
  if (v && !v.endsWith('@kbtu.kz')) {
    return { kbtuEmail: true };
  }
  return null;
}

function passwordMatchValidator(ctrl: AbstractControl): ValidationErrors | null {
  const pw  = ctrl.get('password')?.value;
  const pw2 = ctrl.get('password2')?.value;
  return pw && pw2 && pw !== pw2 ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  private readonly fb       = inject(FormBuilder);
  private readonly auth     = inject(AuthService);
  private readonly router   = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  form = this.fb.group({
    username:  ['', [Validators.required, Validators.minLength(3)]],
    email:     ['', [Validators.required, Validators.email, kbtuEmailValidator]],
    password:  ['', [Validators.required, Validators.minLength(8)]],
    password2: ['', Validators.required],
  }, { validators: passwordMatchValidator });

  loading = false;
  hidePassword = true;
  hidePassword2 = true;

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;

    const { username, email, password, password2 } = this.form.value;
    this.auth.register(username!, email!, password!, password2!).subscribe({
      next: () => {
        this.snackBar.open('Account created! Please log in.', 'Close', { duration: 4000 });
        this.router.navigate(['/login']);
      },
      error: err => {
        this.loading = false;
        const errors = err?.error;
        let msg = 'Registration failed. Please check your details.';
        if (errors) {
          const first = Object.values(errors)[0];
          if (Array.isArray(first)) msg = first[0] as string;
        }
        this.snackBar.open(msg, 'Close', { duration: 5000, panelClass: ['error-snack'] });
      },
    });
  }
}
