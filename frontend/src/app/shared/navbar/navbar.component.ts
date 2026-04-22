import {
  Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  Subject, debounceTime, distinctUntilChanged, takeUntil, filter,
} from 'rxjs';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';

import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { TeacherService } from '../../core/services/teacher.service';
import { SubjectService } from '../../core/services/subject.service';
import { Teacher, Subject as SubjectModel } from '../../core/models';

interface SearchResult {
  type: 'teacher' | 'subject';
  id: number;
  label: string;
  sublabel: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterLink, RouterLinkActive, ReactiveFormsModule,
    MatToolbarModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatMenuModule, MatTooltipModule,
    MatAutocompleteModule, MatDividerModule, MatBadgeModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  readonly auth    = inject(AuthService);
  readonly theme   = inject(ThemeService);
  private readonly router  = inject(Router);
  private readonly teacherSvc = inject(TeacherService);
  private readonly subjectSvc = inject(SubjectService);

  searchCtrl = new FormControl('');
  searchResults: SearchResult[] = [];
  isSearching = false;

  /** Used as [displayWith] on mat-autocomplete. Accepts value param to satisfy Angular Material's (value: any) => string signature. */
  displayFn(_value: unknown): string { return ''; }

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.searchCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(q => typeof q === 'string'),
      takeUntil(this.destroy$),
    ).subscribe(query => {
      const q = (query as string).trim();
      if (q.length < 2) { this.searchResults = []; return; }
      this.runSearch(q);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private runSearch(query: string): void {
    this.isSearching = true;
    const results: SearchResult[] = [];
    let pending = 2;

    const done = () => {
      pending--;
      if (pending === 0) {
        this.searchResults = results.slice(0, 8);
        this.isSearching = false;
      }
    };

    this.teacherSvc.getAll({ search: query }).subscribe({
      next: res => {
        res.results.slice(0, 4).forEach((t: Teacher) =>
          results.push({ type: 'teacher', id: t.id, label: t.full_name, sublabel: t.age_range })
        );
        done();
      },
      error: () => done(),
    });

    this.subjectSvc.getAll({ search: query }).subscribe({
      next: res => {
        res.results.slice(0, 4).forEach((s: SubjectModel) =>
          results.push({ type: 'subject', id: s.id, label: s.title, sublabel: s.category })
        );
        done();
      },
      error: () => done(),
    });
  }

  onResultSelected(result: SearchResult): void {
    this.searchCtrl.setValue('', { emitEvent: false });
    this.searchResults = [];
    if (result.type === 'teacher') {
      this.router.navigate(['/teachers', result.id]);
    } else {
      this.router.navigate(['/subjects', result.id]);
    }
  }

  onSearchSubmit(): void {
    const q = this.searchCtrl.value?.trim();
    if (q) this.router.navigate(['/teachers'], { queryParams: { search: q } });
  }

  logout(): void {
    this.auth.logout();
  }
}
