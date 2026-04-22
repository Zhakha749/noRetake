import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthTokens, JwtPayload, Student } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly ACCESS_KEY  = 'kbtu_access';
  private readonly REFRESH_KEY = 'kbtu_refresh';

  private _isLoggedIn$ = new BehaviorSubject<boolean>(this.hasValidToken());
  readonly isLoggedIn$ = this._isLoggedIn$.asObservable();

  // ── Public API ─────────────────────────────────────────────────────────────

  register(username: string, email: string, password: string, password2: string): Observable<Student> {
    return this.http.post<Student>(`${environment.apiUrl}/auth/register/`, {
      username,
      university_email: email,
      password,
      password2,
    });
  }

  login(email: string, password: string): Observable<AuthTokens> {
    return this.http.post<AuthTokens>(`${environment.apiUrl}/auth/login/`, {
      university_email: email,
      password,
    }).pipe(
      tap(tokens => this.storeTokens(tokens)),
    );
  }

  refreshToken(): Observable<{ access: string }> {
    const refresh = this.getRefreshToken();
    return this.http.post<{ access: string }>(`${environment.apiUrl}/auth/refresh/`, { refresh }).pipe(
      tap(res => localStorage.setItem(this.ACCESS_KEY, res.access)),
    );
  }

  logout(): void {
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    this._isLoggedIn$.next(false);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.hasValidToken();
  }

  isAdmin(): boolean {
    const payload = this.decodeToken();
    return !!payload?.is_staff;
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  getUserPayload(): JwtPayload | null {
    return this.decodeToken();
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.ACCESS_KEY, tokens.access);
    localStorage.setItem(this.REFRESH_KEY, tokens.refresh);
    this._isLoggedIn$.next(true);
  }

  private hasValidToken(): boolean {
    const token = localStorage.getItem(this.ACCESS_KEY);
    if (!token) return false;
    const payload = this.decodeTokenStr(token);
    if (!payload) return false;
    return payload.exp * 1000 > Date.now();
  }

  private decodeToken(): JwtPayload | null {
    const token = this.getAccessToken();
    return token ? this.decodeTokenStr(token) : null;
  }

  private decodeTokenStr(token: string): JwtPayload | null {
    try {
      const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(base64)) as JwtPayload;
    } catch {
      return null;
    }
  }
}
