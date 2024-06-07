import { Component, Inject, Input, Optional } from '@angular/core';
import { iCompany, iIndustry } from '../models/dutch.interface';
import { SharedModule } from '../shared/shared.module';
import { MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { UtilsService } from '../services/utils.service';

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

  constructor(
    @Optional() @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
    private utils: UtilsService
  ) {
    this.company = data;
  }

  // TODO: Find somewhere to put this and access from
  // everywhere. Heavily considering localstorage. Duh!
  list_of_industries: iIndustry[] = this.utils.getIndustryList();

  ngOnInit(): void {}

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

  /**
   * Copy text into clipboard
   */
  copyText(text: string) {
    navigator.clipboard.writeText(text);
  }
}
