import { Component, Input, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rating-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [class]="badgeClass()">
      {{ value() | number:'1.1-1' }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 44px; padding: 4px 10px;
      border-radius: 20px; font-weight: 700; font-size: .9rem;
    }
    .badge-high { background:#e8f5e9; color:#2e7d32; }
    .badge-mid  { background:#fff3e0; color:#e65100; }
    .badge-low  { background:#ffebee; color:#c62828; }
    .dark-theme .badge-high { background:#1b3a1f; color:#81c784; }
    .dark-theme .badge-mid  { background:#3a2a00; color:#ffb74d; }
    .dark-theme .badge-low  { background:#3a0a0a; color:#ef9a9a; }
  `],
})
export class RatingBadgeComponent {
  value = input.required<number>();

  badgeClass = computed(() => {
    const v = this.value();
    if (v >= 8) return 'badge badge-high';
    if (v >= 5) return 'badge badge-mid';
    return 'badge badge-low';
  });
}
