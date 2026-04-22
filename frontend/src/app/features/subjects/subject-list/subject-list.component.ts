import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Subject, debounceTime, distinctUntilChanged, startWith, takeUntil } from 'rxjs';
import { SubjectService } from '../../../core/services/subject.service';
import { SubjectCardComponent } from '../../../shared/components/subject-card/subject-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { Subject as SubjectModel } from '../../../core/models';

const CATEGORIES = ['all', 'mandatory', 'elective', 'major', 'minor', 'profile'] as const;

@Component({
  selector: 'app-subject-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTabsModule, MatFormFieldModule, MatInputModule,
    MatIconModule, MatPaginatorModule,
    SubjectCardComponent, LoadingSpinnerComponent,
  ],
  templateUrl: './subject-list.component.html',
  styleUrls: ['./subject-list.component.scss'],
})
export class SubjectListComponent implements OnInit, OnDestroy {
  private readonly svc      = inject(SubjectService);
  private readonly destroy$ = new Subject<void>();

  readonly categories = CATEGORIES;
  activeCategory = signal<string>('all');

  searchCtrl = new FormControl('');
  subjects   = signal<SubjectModel[]>([]);
  total      = signal(0);
  loading    = signal(true);
  pageSize   = 20;
  pageIndex  = 0;

  ngOnInit(): void {
    this.searchCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      startWith(''),
      takeUntil(this.destroy$),
    ).subscribe(() => { this.pageIndex = 0; this.fetch(); });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  selectCategory(cat: string): void {
    this.activeCategory.set(cat);
    this.pageIndex = 0;
    this.fetch();
  }

  onPageChange(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize  = e.pageSize;
    this.fetch();
  }

  private fetch(): void {
    this.loading.set(true);
    const cat = this.activeCategory();
    this.svc.getAll({
      search:   this.searchCtrl.value?.trim() || undefined,
      category: cat === 'all' ? undefined : cat,
      page:     this.pageIndex + 1,
    }).subscribe({
      next: res => { this.subjects.set(res.results); this.total.set(res.count); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
