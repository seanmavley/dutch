import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { iCompany } from '../models/dutch.interface';
import { SharedModule } from '../shared/shared.module';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class CardComponent {

  @Input() company!: iCompany;
  url!: string;

  constructor() { }

  ngOnInit(): void {
    console.log(this.company);
    this.url = `https://www.google.com/search?q= + ${this.company?.website}`
  }

}
