import { Component, Input, SimpleChanges } from '@angular/core';
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

  ngOnChanges(): void {
    this.url = `https://www.google.com/search?q=${this.company?.name}` 
  }
}
