import { Component, HostListener, Inject, Input, Optional } from '@angular/core';
import { iCompany, iIndustry } from '../models/dutch.interface';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { UtilsService } from '../services/utils.service';
import { SharedModule } from '../shared/shared.module';

@Component({
    selector: 'app-card',
    imports: [
        SharedModule,
    ],
    standalone: true,
    templateUrl: './card.component.html',
    styleUrls: ['./card.component.scss']
})
export class CardComponent {
  @Input() company!: iCompany | null;
  search_url!: string;

  constructor(
    @Optional() private _bottomSheetRef: MatBottomSheetRef<CardComponent>,
    @Optional() @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
    private utils: UtilsService,
  ) {
    this.company = data;
  }

  list_of_industries: iIndustry[] = this.utils.getIndustryList();

  @HostListener('window:popstate')
  onPopState() {
    console.log('Popstate triggered')
    if (this._bottomSheetRef && this._bottomSheetRef.dismiss) {
      this._bottomSheetRef.dismiss();
      // Prevent default behavior to avoid actual navigation
      return false;
    }
  }

  ngOnChanges(): void {
    this.search_url = `https://www.google.com/search?q=${this.company?.name}`
  }

  getIndustryName(categorySlug: string): string {
    const industry = this.list_of_industries.find(
      (ind) => ind.slug === categorySlug
    );
    return industry ? industry.name : categorySlug;
  }

  copyText(text: string) {
    navigator.clipboard.writeText(text);
  }

  getCompanyProperty(company: any, key: string): any {
    if (!company) return null;

    const lowerCaseKey = key.toLowerCase();
    const sentenceCaseKey = key.charAt(0).toUpperCase() + key.slice(1);

    return company[lowerCaseKey] || company[sentenceCaseKey];
  }
}
