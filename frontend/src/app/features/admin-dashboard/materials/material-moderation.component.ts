import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SelectionModel } from '@angular/cdk/collections';
import { AdminService } from '../../../core/services/admin.service';
import { StudyMaterial } from '../../../core/models';

@Component({
  selector: 'app-material-moderation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule,
    MatCheckboxModule, MatChipsModule, MatProgressSpinnerModule, MatTooltipModule,
  ],
  template: `
    <div class="mod">
      <div class="mod__header">
        <h1 class="mod__title">Material Moderation</h1>
        @if (selection.hasValue()) {
          <button mat-raised-button color="primary" (click)="approveSelected()">
            <mat-icon>done_all</mat-icon>
            Approve selected ({{ selection.selected.length }})
          </button>
        }
      </div>

      @if (loading()) {
        <div class="mod__spinner">
          <mat-spinner diameter="48" />
        </div>
      } @else if (materials().length === 0) {
        <div class="mod__empty">
          <mat-icon>check_circle_outline</mat-icon>
          <p>No pending materials — queue is clear!</p>
        </div>
      } @else {
        <table mat-table [dataSource]="materials()" class="mod__table">

          <!-- Select -->
          <ng-container matColumnDef="select">
            <th mat-header-cell *matHeaderCellDef>
              <mat-checkbox
                [checked]="isAllSelected()"
                [indeterminate]="selection.hasValue() && !isAllSelected()"
                (change)="toggleAll()">
              </mat-checkbox>
            </th>
            <td mat-cell *matCellDef="let row">
              <mat-checkbox
                [checked]="selection.isSelected(row)"
                (change)="selection.toggle(row)">
              </mat-checkbox>
            </td>
          </ng-container>

          <!-- Title -->
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef>Title</th>
            <td mat-cell *matCellDef="let row">
              <span class="mod__mat-title">{{ row.title }}</span>
            </td>
          </ng-container>

          <!-- Type -->
          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>Type</th>
            <td mat-cell *matCellDef="let row">
              <span class="mod__chip mod__chip--{{ row.type }}">{{ row.type }}</span>
            </td>
          </ng-container>

          <!-- Contributor -->
          <ng-container matColumnDef="contributor_name">
            <th mat-header-cell *matHeaderCellDef>Contributor</th>
            <td mat-cell *matCellDef="let row">{{ row.contributor_name }}</td>
          </ng-container>

          <!-- Date -->
          <ng-container matColumnDef="created_at">
            <th mat-header-cell *matHeaderCellDef>Submitted</th>
            <td mat-cell *matCellDef="let row" class="text-muted">{{ row.created_at | date:'mediumDate' }}</td>
          </ng-container>

          <!-- Link -->
          <ng-container matColumnDef="link">
            <th mat-header-cell *matHeaderCellDef>Link</th>
            <td mat-cell *matCellDef="let row">
              @if (row.link) {
                <a [href]="row.link" target="_blank" mat-icon-button matTooltip="Open link">
                  <mat-icon>open_in_new</mat-icon>
                </a>
              }
            </td>
          </ng-container>

          <!-- Actions -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button color="primary" matTooltip="Approve"
                      (click)="approve(row); $event.stopPropagation()">
                <mat-icon>check_circle</mat-icon>
              </button>
              <button mat-icon-button color="warn" matTooltip="Reject"
                      (click)="reject(row); $event.stopPropagation()">
                <mat-icon>cancel</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let row; columns: cols;"
              [class.mod__row--selected]="selection.isSelected(row)"></tr>
        </table>

        <p class="text-muted mod__count">{{ materials().length }} pending material(s)</p>
      }
    </div>
  `,
  styles: [`
    .mod {
      max-width: 960px;
    }
    .mod__header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
    }
    .mod__title { font-size: 1.5rem; font-weight: 800; margin: 0; }
    .mod__spinner { display: flex; justify-content: center; padding: 60px 0; }
    .mod__empty {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 60px 0; color: var(--color-text-muted);
      mat-icon { font-size: 48px; height: 48px; width: 48px; color: var(--color-success); }
    }
    .mod__table { width: 100%; background: var(--color-surface); }
    .mod__mat-title { font-weight: 500; font-size: .9rem; }
    .mod__chip {
      font-size: .72rem; padding: 2px 9px; border-radius: 12px; font-weight: 600;
      text-transform: capitalize;
    }
    .mod__chip--lecture { background: #e8eaf6; color: #3949ab; }
    .mod__chip--exam    { background: #fce4ec; color: #880e4f; }
    .mod__chip--book    { background: #e8f5e9; color: #2e7d32; }
    .mod__chip--other   { background: #f5f5f5; color: #616161; }
    .mod__row--selected { background: rgba(57,73,171,.06); }
    .mod__count { margin-top: 12px; }
  `],
})
export class MaterialModerationComponent implements OnInit {
  private readonly adminSvc = inject(AdminService);
  private readonly snack    = inject(MatSnackBar);
  private readonly cdr      = inject(ChangeDetectorRef);

  readonly cols = ['select', 'title', 'type', 'contributor_name', 'created_at', 'link', 'actions'];
  readonly selection = new SelectionModel<StudyMaterial>(true, []);

  loading   = signal(true);
  materials = signal<StudyMaterial[]>([]);

  ngOnInit(): void {
    this.load();
  }

  isAllSelected(): boolean {
    return this.selection.selected.length === this.materials().length && this.materials().length > 0;
  }

  toggleAll(): void {
    this.isAllSelected() ? this.selection.clear() : this.selection.select(...this.materials());
  }

  approve(m: StudyMaterial): void {
    this.adminSvc.approveMaterial(m.id).subscribe({
      next: () => {
        this.materials.update(list => list.filter(x => x.id !== m.id));
        this.selection.deselect(m);
        this.snack.open(`"${m.title}" approved.`, 'Close', { duration: 3000 });
        this.cdr.markForCheck();
      },
      error: () => this.snack.open('Approval failed.', 'Close', { duration: 3000, panelClass: ['error-snack'] }),
    });
  }

  reject(m: StudyMaterial): void {
    this.adminSvc.rejectMaterial(m.id).subscribe({
      next: () => {
        this.materials.update(list => list.filter(x => x.id !== m.id));
        this.selection.deselect(m);
        this.snack.open(`"${m.title}" rejected.`, 'Close', { duration: 3000 });
        this.cdr.markForCheck();
      },
      error: () => this.snack.open('Rejection failed.', 'Close', { duration: 3000, panelClass: ['error-snack'] }),
    });
  }

  approveSelected(): void {
    const selected = [...this.selection.selected];
    selected.forEach(m => this.approve(m));
  }

  private load(): void {
    this.loading.set(true);
    this.adminSvc.getPendingMaterials().subscribe({
      next: r => {
        this.materials.set(r.results);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => this.loading.set(false),
    });
  }
}
