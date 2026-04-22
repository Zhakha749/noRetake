import { Component, OnInit, inject, input, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TeacherService } from '../../../core/services/teacher.service';
import { ReviewService } from '../../../core/services/review.service';
import { AuthService } from '../../../core/services/auth.service';
import { RadarChartComponent } from '../../../shared/components/radar-chart/radar-chart.component';
import { RatingBadgeComponent } from '../../../shared/components/rating-badge/rating-badge.component';
import { ReviewCardComponent } from '../../../shared/components/review-card/review-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { Teacher, TeachingHistory, Review } from '../../../core/models';

type RoleColor = Record<string, string>;
const ROLE_COLORS: RoleColor = {
  Lecturer: '#3949ab', Practice: '#00897b', Labs: '#f57c00', All: '#8e24aa',
};

@Component({
  selector: 'app-teacher-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterLink,
    MatButtonModule, MatIconModule, MatChipsModule,
    MatTooltipModule, MatDividerModule,
    RadarChartComponent, RatingBadgeComponent,
    ReviewCardComponent, LoadingSpinnerComponent,
  ],
  templateUrl: './teacher-profile.component.html',
  styleUrls: ['./teacher-profile.component.scss'],
})
export class TeacherProfileComponent implements OnInit {
  // Route param via withComponentInputBinding
  id = input.required<string>();

  private readonly svc     = inject(TeacherService);
  private readonly reviewSvc = inject(ReviewService);
  private readonly auth    = inject(AuthService);
  private readonly snack   = inject(MatSnackBar);
  private readonly router  = inject(Router);

  teacher  = signal<Teacher | null>(null);
  loading  = signal(true);
  showBiasSection = signal(false);

  readonly roleColors = ROLE_COLORS;

  // Group teaching history by year for the timeline
  timelineGroups = computed(() => {
    const history = this.teacher()?.teaching_history ?? [];
    const map = new Map<string, TeachingHistory[]>();
    for (const item of history) {
      const arr = map.get(item.year_interval) ?? [];
      arr.push(item);
      map.set(item.year_interval, arr);
    }
    return Array.from(map.entries())
      .map(([year, items]) => ({ year, items }))
      .sort((a, b) => a.year.localeCompare(b.year));
  });

  ngOnInit(): void {
    this.svc.getById(+this.id()).subscribe({
      next: t => {
        this.teacher.set(t);
        this.showBiasSection.set(!!t.show_gender_bias);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.router.navigate(['/teachers']); },
    });
  }

  vote(review: Review, dir: 'up' | 'down'): void {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/login']); return; }
    this.reviewSvc.vote(review.id, dir).subscribe({
      next: r => review.helpful_votes = r.helpful_votes,
      error: () => this.snack.open('Could not record vote.', 'Close', { duration: 3000 }),
    });
  }

  reportReview(review: Review): void {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/login']); return; }
    const reason = prompt('Reason for report:');
    if (!reason) return;
    this.reviewSvc.report(review.id, reason).subscribe({
      next: () => this.snack.open('Review reported. Thank you.', 'Close', { duration: 3000 }),
      error: () => this.snack.open('Could not submit report.', 'Close', { duration: 3000 }),
    });
  }

  getRoleColor(role: string): string {
    return ROLE_COLORS[role] ?? '#757575';
  }
}
