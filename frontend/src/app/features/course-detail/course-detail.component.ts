import { Component, OnInit, inject, input, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CourseService } from '../../core/services/course.service';
import { ReviewService } from '../../core/services/review.service';
import { AuthService } from '../../core/services/auth.service';
import { GradeChartComponent } from '../../shared/components/grade-chart/grade-chart.component';
import { RadarChartComponent } from '../../shared/components/radar-chart/radar-chart.component';
import { RatingBadgeComponent } from '../../shared/components/rating-badge/rating-badge.component';
import { ReviewCardComponent } from '../../shared/components/review-card/review-card.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { CourseInstance, Review, ReviewCreatePayload } from '../../core/models';

type ReviewSort = 'helpful' | 'recent';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatExpansionModule, MatTableModule,
    MatChipsModule, MatFormFieldModule, MatInputModule, MatCheckboxModule,
    MatSelectModule, MatSliderModule, MatDividerModule, MatTooltipModule,
    GradeChartComponent, RadarChartComponent, RatingBadgeComponent,
    ReviewCardComponent, LoadingSpinnerComponent,
  ],
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.scss'],
})
export class CourseDetailComponent implements OnInit {
  id = input.required<string>();

  private readonly svc       = inject(CourseService);
  private readonly reviewSvc = inject(ReviewService);
  readonly auth              = inject(AuthService);
  private readonly snack     = inject(MatSnackBar);
  private readonly fb        = inject(FormBuilder);
  private readonly router    = inject(Router);

  course       = signal<CourseInstance | null>(null);
  loading      = signal(true);
  reviewSort   = signal<ReviewSort>('helpful');
  showForm     = signal(false);
  submitting   = signal(false);

  readonly syllabusCols = ['year', 'uploaded_by_name', 'uploaded_at', 'file'];

  sortedReviews = computed(() => {
    const reviews = this.course()?.reviews ?? [];
    return [...reviews].sort((a, b) =>
      this.reviewSort() === 'helpful'
        ? b.helpful_votes - a.helpful_votes
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });

  reviewForm = this.fb.group({
    text:                 ['', [Validators.required, Validators.minLength(20)]],
    rating:               [7, [Validators.required, Validators.min(1), Validators.max(10)]],
    difficulty_rating:    [5, [Validators.required, Validators.min(1), Validators.max(10)]],
    clarity_rating:       [7],
    objectivity_rating:   [7],
    accessibility_rating: [7],
    workload_rating:      [5],
    is_anonymous:         [true],
    took_this_course:     [false],
    gender_bias:          [false],
    favoritism:           [false],
  });

  ngOnInit(): void {
    this.svc.getById(+this.id()).subscribe({
      next: c => { this.course.set(c); this.loading.set(false); },
      error: () => { this.loading.set(false); this.router.navigate(['/']); },
    });
  }

  toggleForm(): void {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/login']); return; }
    this.showForm.update(v => !v);
  }

  submitReview(): void {
    if (this.reviewForm.invalid) { this.reviewForm.markAllAsTouched(); return; }
    this.submitting.set(true);
    const v = this.reviewForm.value;

    const payload: ReviewCreatePayload = {
      course_instance:      +this.id(),
      text:                 v.text!,
      rating:               v.rating!,
      difficulty_rating:    v.difficulty_rating!,
      clarity_rating:       v.clarity_rating!,
      objectivity_rating:   v.objectivity_rating!,
      accessibility_rating: v.accessibility_rating!,
      workload_rating:      v.workload_rating!,
      is_anonymous:         !!v.is_anonymous,
      took_this_course:     !!v.took_this_course,
      sensitive_markers:    { gender_bias: !!v.gender_bias, favoritism: !!v.favoritism },
    };

    this.reviewSvc.create(payload).subscribe({
      next: review => {
        this.course.update(c => c ? { ...c, reviews: [review, ...(c.reviews ?? [])] } : c);
        this.showForm.set(false);
        this.reviewForm.reset({
          rating: 7, difficulty_rating: 5, clarity_rating: 7,
          objectivity_rating: 7, accessibility_rating: 7, workload_rating: 5,
          is_anonymous: true,
        });
        this.submitting.set(false);
        this.snack.open('Review submitted!', 'Close', { duration: 3000 });
      },
      error: err => {
        this.submitting.set(false);
        const msg = err?.error?.detail ?? 'Could not submit review.';
        this.snack.open(msg, 'Close', { duration: 4000, panelClass: ['error-snack'] });
      },
    });
  }

  vote(review: Review, dir: 'up' | 'down'): void {
    this.reviewSvc.vote(review.id, dir).subscribe({
      next: r => review.helpful_votes = r.helpful_votes,
      error: () => this.snack.open('Vote failed.', 'Close', { duration: 2000 }),
    });
  }

  report(review: Review): void {
    const reason = prompt('Reason for report:');
    if (!reason) return;
    this.reviewSvc.report(review.id, reason).subscribe({
      next: () => this.snack.open('Reported. Thank you.', 'Close', { duration: 3000 }),
      error: () => this.snack.open('Could not report.', 'Close', { duration: 2000 }),
    });
  }

  goCompare(): void {
    this.router.navigate(['/compare'], { queryParams: { ids: this.id() } });
  }

  sliderLabel(v: number): string { return `${v}`; }
}
