import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatSidenavModule, MatListModule, MatIconModule],
  template: `
    <div class="admin-layout">
      <nav class="admin-sidebar">
        <h2 class="admin-sidebar__title">Admin</h2>
        <mat-nav-list>
          <a mat-list-item routerLink="overview" routerLinkActive="active-link">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Overview</span>
          </a>
          <a mat-list-item routerLink="materials" routerLinkActive="active-link">
            <mat-icon matListItemIcon>description</mat-icon>
            <span matListItemTitle>Materials</span>
          </a>
          <a mat-list-item routerLink="reports" routerLinkActive="active-link">
            <mat-icon matListItemIcon>flag</mat-icon>
            <span matListItemTitle>Reports</span>
          </a>
        </mat-nav-list>
      </nav>
      <main class="admin-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .admin-layout { display: flex; min-height: calc(100vh - 64px); }
    .admin-sidebar {
      width: 220px;
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
      padding: 24px 0;
      flex-shrink: 0;
    }
    .admin-sidebar__title { padding: 0 16px 8px; font-size: 1rem; font-weight: 700; margin: 0; }
    .active-link { background: rgba(57,73,171,.10); color: var(--color-primary) !important; }
    .admin-content { flex: 1; padding: 24px; overflow: auto; }
  `],
})
export class AdminDashboardComponent {}
