import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Review } from '../../../core/models';

@Component({
  selector: 'app-review-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule, MatChipsModule],
  templateUrl: './review-card.component.html',
  styleUrls: ['./review-card.component.scss'],
})
export class ReviewCardComponent {
  review        = input.required<Review>();
  canVote       = input(false);
  canReport     = input(false);
  voteClicked   = output<'up' | 'down'>();
  reportClicked = output<void>();

  getRatingClass(r: number): string {
    if (r >= 8) return 'rating-high';
    if (r >= 5) return 'rating-mid';
    return 'rating-low';
  }
}
