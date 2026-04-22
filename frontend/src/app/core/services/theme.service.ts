import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'kbtu_dark_mode';
  private _isDark$ = new BehaviorSubject<boolean>(false);
  readonly isDark$ = this._isDark$.asObservable();

  /** Call once from AppComponent.ngOnInit to restore saved preference. */
  init(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved !== null ? saved === 'true' : prefersDark;
    this.apply(isDark);
  }

  toggle(): void {
    this.apply(!this._isDark$.value);
  }

  get isDark(): boolean {
    return this._isDark$.value;
  }

  private apply(isDark: boolean): void {
    this._isDark$.next(isDark);
    document.body.classList.toggle('dark-theme', isDark);
    localStorage.setItem(this.STORAGE_KEY, String(isDark));
  }
}
