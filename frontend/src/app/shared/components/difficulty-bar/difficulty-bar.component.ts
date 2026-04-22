import { Component, Input, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-difficulty-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="diff-bar">
      <div class="diff-bar__track">
        <div class="diff-bar__fill" [style.width]="fillWidth()"></div>
      </div>
      <span class="diff-bar__label">{{ value() | number:'1.1-1' }}/{{ max() }}</span>
    </div>
  `,
  styles: [`
    .diff-bar { display:flex; align-items:center; gap:10px; }
    .diff-bar__track {
      flex:1; height:8px; background:var(--color-border);
      border-radius:4px; overflow:hidden;
    }
    .diff-bar__fill {
      height:100%; border-radius:4px;
      background:linear-gradient(90deg,#43a047 0%,#fb8c00 60%,#e53935 100%);
      transition:width .4s ease;
    }
    .diff-bar__label { font-size:.8rem; color:var(--color-text-muted); white-space:nowrap; }
  `],
})
export class DifficultyBarComponent {
  value = input.required<number>();
  max   = input<number>(10);

  fillWidth = computed(() => `${Math.min((this.value() / this.max()) * 100, 100)}%`);
}
