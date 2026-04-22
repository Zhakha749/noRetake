import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RatingBadgeComponent } from '../rating-badge/rating-badge.component';
import { RadarChartComponent } from '../radar-chart/radar-chart.component';
import { Teacher } from '../../../core/models';

@Component({
  selector: 'app-teacher-card',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatChipsModule, MatTooltipModule,
            RatingBadgeComponent, RadarChartComponent],
  templateUrl: './teacher-card.component.html',
  styleUrls: ['./teacher-card.component.scss'],
})
export class TeacherCardComponent {
  teacher = input.required<Teacher>();
  showRadar = false;
}
