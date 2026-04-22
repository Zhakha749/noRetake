import { Component, OnInit, inject, input, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SubjectService } from '../../../core/services/subject.service';
import { MaterialService } from '../../../core/services/material.service';
import { AuthService } from '../../../core/services/auth.service';
import { DifficultyBarComponent } from '../../../shared/components/difficulty-bar/difficulty-bar.component';
import { RatingBadgeComponent } from '../../../shared/components/rating-badge/rating-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { Subject as SubjectModel, StudyMaterial, SubjectTeacherEntry } from '../../../core/models';

@Component({
  selector: 'app-subject-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatTableModule, MatSortModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatTooltipModule,
    DifficultyBarComponent, RatingBadgeComponent, LoadingSpinnerComponent,
  ],
  templateUrl: './subject-detail.component.html',
  styleUrls: ['./subject-detail.component.scss'],
})
export class SubjectDetailComponent implements OnInit {
  id = input.required<string>();

  private readonly svc         = inject(SubjectService);
  private readonly materialSvc = inject(MaterialService);
  private readonly auth        = inject(AuthService);
  private readonly snack       = inject(MatSnackBar);
  private readonly fb          = inject(FormBuilder);
  private readonly router      = inject(Router);

  subject            = signal<SubjectModel | null>(null);
  materials          = signal<StudyMaterial[]>([]);
  loading            = signal(true);
  teachers           = signal<SubjectTeacherEntry[]>([]);
  showMaterialForm   = signal(false);
  submittingMaterial = signal(false);

  readonly teacherCols = ['teacher_name', 'avg_difficulty', 'avg_rating', 'grade_avg', 'actions'];

  selectedFile = signal<File | null>(null);

  materialForm = this.fb.group({
    title: ['', Validators.required],
    type:  ['lecture', Validators.required],
    link:  [''],
  });

  dependencyLabel(ratio: number): string {
    if (ratio > 2) return 'High';
    if (ratio > 1) return 'Medium';
    return 'Low';
  }

  ngOnInit(): void {
    this.svc.getById(+this.id()).subscribe({
      next: s => {
        this.subject.set(s);
        this.teachers.set(s.teachers ?? []);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.router.navigate(['/subjects']); },
    });
    this.materialSvc.getApproved(+this.id()).subscribe(r => this.materials.set(r.results));
  }

  sortTeachers(sort: Sort): void {
    const data = [...this.teachers()];
    if (!sort.active || sort.direction === '') { this.teachers.set(data); return; }
    this.teachers.set(data.sort((a, b) => {
      const dir = sort.direction === 'asc' ? 1 : -1;
      return ((a as unknown as Record<string, number>)[sort.active] - (b as unknown as Record<string, number>)[sort.active]) * dir;
    }));
  }

  goToCompare(ciId: number): void {
    this.router.navigate(['/compare'], { queryParams: { ids: ciId } });
  }

  toggleMaterialForm(): void {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/login']); return; }
    this.showMaterialForm.update(v => !v);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile.set(input.files?.[0] ?? null);
  }

  submitMaterial(): void {
    if (this.materialForm.invalid) { this.materialForm.markAllAsTouched(); return; }
    const link = this.materialForm.value.link ?? '';
    if (!link && !this.selectedFile()) {
      this.snack.open('Please provide a link or upload a file.', 'Close', { duration: 4000, panelClass: ['error-snack'] });
      return;
    }
    this.submittingMaterial.set(true);
    const fd = new FormData();
    fd.append('title',   this.materialForm.value.title!);
    fd.append('type',    this.materialForm.value.type!);
    fd.append('subject', this.id());
    if (link) fd.append('link', link);
    if (this.selectedFile()) fd.append('file', this.selectedFile()!);
    this.materialSvc.submit(fd).subscribe({
      next: () => {
        this.snack.open('Material submitted for review!', 'Close', { duration: 4000 });
        this.materialForm.reset({ type: 'lecture' });
        this.selectedFile.set(null);
        this.showMaterialForm.set(false);
        this.submittingMaterial.set(false);
      },
      error: () => {
        this.snack.open('Submission failed.', 'Close', { duration: 4000, panelClass: ['error-snack'] });
        this.submittingMaterial.set(false);
      },
    });
  }
}
