import { Component, HostListener, Inject, Input, Optional, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./card.component.scss']
})
export class CardComponent {
  @Input() company!: iCompany | null;
  search_url: string = '';
  copiedKvk: boolean = false;

  list_of_industries: iIndustry[] = this.utils.getIndustryList();

  constructor(
    @Optional() private _bottomSheetRef: MatBottomSheetRef<CardComponent>,
    @Optional() @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
    private utils: UtilsService,
    private cdr: ChangeDetectorRef
  ) {
    if (data) {
      this.company = data;
      this.updateSearchUrl();
    }
  }

  @HostListener('window:popstate')
  onPopState() {
    if (this._bottomSheetRef && this._bottomSheetRef.dismiss) {
      this._bottomSheetRef.dismiss();
      return false;
    }
    return true;
  }

  ngOnChanges(): void {
    this.updateSearchUrl();
  }

  private updateSearchUrl(): void {
    if (this.company?.name) {
      this.search_url = `https://www.google.com/search?q=${encodeURIComponent(this.company.name)}`;
    }
  }

  getIndustryName(categorySlug?: string): string {
    if (!categorySlug) return 'Other';
    const industry = this.list_of_industries.find(
      (ind) => ind.slug.toLowerCase() === categorySlug.toLowerCase()
    );
    return industry ? industry.name : categorySlug;
  }

  copyKvk(kvk?: string): void {
    if (!kvk) return;
    navigator.clipboard.writeText(kvk).then(() => {
      this.copiedKvk = true;
      this.cdr.markForCheck();
      setTimeout(() => {
        this.copiedKvk = false;
        this.cdr.markForCheck();
      }, 1500);
    });
  }

  closeSheet(): void {
    if (this._bottomSheetRef) {
      this._bottomSheetRef.dismiss();
    }
  }
}
