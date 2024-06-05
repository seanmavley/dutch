import { Component, Input, SimpleChanges } from '@angular/core';
import { iCompany, iIndustry } from '../models/dutch.interface';
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

  // TODO: Find somewhere to put this and access from
  // everywhere. Heavily considering localstorage. Duh!
  list_of_industries: iIndustry[] = [
    { "slug": "mi", "name": "Manufacturing and Industrials", "id": 2 },
    { "slug": "eu", "name": "Energy and Utilities", "id": 3 },
    { "slug": "cgr", "name": "Consumer Goods and Retail", "id": 4 },
    { "slug": "fre", "name": "Finance and Real Estate", "id": 5 },
    { "slug": "hp", "name": "Healthcare and Pharmaceuticals", "id": 6 },
    { "slug": "tt", "name": "Technology and Telecommunications", "id": 7 }
  ]

  constructor() { }

  ngOnChanges(): void {
    this.url = `https://www.google.com/search?q=${this.company?.name}` 
  }

  /**
   * Get the full name of the industry slug
   * @param categorySlug the category slug
   * @returns string
   */
  getIndustryName(categorySlug: string): string {
    const industry = this.list_of_industries.find(
      (ind) => ind.slug === categorySlug
    );
    return industry ? industry.name : categorySlug; // Fallback to slug if not found
  }
}
