import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CourseService } from '../../core/services/course.service';
import { GradeChartComponent } from '../../shared/components/grade-chart/grade-chart.component';
import { RadarChartComponent } from '../../shared/components/radar-chart/radar-chart.component';
import { RatingBadgeComponent } from '../../shared/components/rating-badge/rating-badge.component';
import { DifficultyBarComponent } from '../../shared/components/difficulty-bar/difficulty-bar.component';
import { CourseInstance } from '../../core/models';

@Component({
  selector: 'app-compare',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterLink,
    MatButtonModule, MatIconModule, MatDividerModule, MatProgressSpinnerModule,
    GradeChartComponent, RadarChartComponent, RatingBadgeComponent, DifficultyBarComponent,
  ],
  templateUrl: './compare.component.html',
  styleUrls: ['./compare.component.scss'],
})
export class CompareComponent implements OnInit {
  private readonly svc   = inject(CourseService);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr   = inject(ChangeDetectorRef);

  loading  = signal(true);
  courses  = signal<CourseInstance[]>([]);
  errorMsg = signal('');

  ngOnInit(): void {
    const idsParam = this.route.snapshot.queryParamMap.get('ids') ?? '';
    const ids = idsParam.split(',').map(Number).filter(n => n > 0);

    if (ids.length < 1) {
      this.errorMsg.set('No course IDs provided. Use ?ids=1,2 in the URL.');
      this.loading.set(false);
      return;
    }

    this.svc.compare(ids).subscribe({
      next: courses => {
        this.courses.set(courses);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMsg.set('Could not load courses for comparison.');
        this.loading.set(false);
        this.cdr.markForCheck();
      },
    });
  }
}
