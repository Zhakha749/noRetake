import { Component, Input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="spinner-wrap" [style.min-height]="minHeight">
      <mat-spinner [diameter]="diameter" />
    </div>
  `,
  styles: [`.spinner-wrap { display:flex; align-items:center; justify-content:center; width:100%; }`],
})
export class LoadingSpinnerComponent {
  @Input() diameter = 48;
  @Input() minHeight = '200px';
}
