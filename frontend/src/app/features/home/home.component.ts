import { Component, inject, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { TeacherService } from '../../core/services/teacher.service';
import { SubjectService } from '../../core/services/subject.service';
import { Teacher, Subject } from '../../core/models';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatChipsModule,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  private readonly teacherSvc = inject(TeacherService);
  private readonly subjectSvc = inject(SubjectService);
  private readonly router     = inject(Router);

  searchCtrl = new FormControl('');

  topTeachers  = signal<Teacher[]>([]);
  subjects     = signal<Subject[]>([]);
  stats        = signal({ teachers: 0, subjects: 0, reviews: 0 });

  ngOnInit(): void {
    this.teacherSvc.getAll({ ordering: '-avg_overall' }).subscribe(res => {
      this.topTeachers.set(res.results.slice(0, 6));
      this.stats.update(s => ({ ...s, teachers: res.count }));
    });
    this.subjectSvc.getAll().subscribe(res => {
      this.subjects.set(res.results.slice(0, 8));
      this.stats.update(s => ({ ...s, subjects: res.count }));
    });
  }

  search(): void {
    const q = this.searchCtrl.value?.trim();
    if (q) this.router.navigate(['/teachers'], { queryParams: { search: q } });
  }

  getRatingClass(rating: number): string {
    if (rating >= 8) return 'rating-high';
    if (rating >= 5) return 'rating-mid';
    return 'rating-low';
  }

  getDifficultyWidth(difficulty: number): string {
    return `${(difficulty / 10) * 100}%`;
  }
}
