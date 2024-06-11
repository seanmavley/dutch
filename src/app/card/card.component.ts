import { Component, Inject, Input, Optional } from '@angular/core';
import { iCompany, iIndustry } from '../models/dutch.interface';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { UtilsService } from '../services/utils.service';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatBottomSheetModule,
    MatCardModule,
    MatDividerModule,
    MatTooltipModule,
    MatButtonModule
  ],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class CardComponent {

  @Input() company!: iCompany | null;
  url!: string;

  constructor(
    @Optional() @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
    private utils: UtilsService,
    // private _bottomSheetRef: MatBottomSheetRef<CardComponent>
  ) {
    this.company = data;
  }

  list_of_industries: iIndustry[] = this.utils.getIndustryList();

  ngOnInit(): void { }

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

  /**
   * 
   * @param company 
   * @param key 
   * @returns 
   */
  getCompanyProperty(company: any, key: string): any {
    if (!company) return null;

    const lowerCaseKey = key.toLowerCase();
    const sentenceCaseKey = key.charAt(0).toUpperCase() + key.slice(1);

    return company[lowerCaseKey] || company[sentenceCaseKey];
  }

}
