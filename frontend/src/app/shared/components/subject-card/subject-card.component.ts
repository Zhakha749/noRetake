import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DifficultyBarComponent } from '../difficulty-bar/difficulty-bar.component';
import { Subject } from '../../../core/models';

@Component({
  selector: 'app-subject-card',
  standalone: true,
  imports: [CommonModule, RouterLink, DifficultyBarComponent],
  templateUrl: './subject-card.component.html',
  styleUrls: ['./subject-card.component.scss'],
})
export class SubjectCardComponent {
  subject = input.required<Subject>();
}
