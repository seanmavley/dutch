import {
  Component,
  HostListener,
  Inject,
  Input,
  Optional,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { Subject, Subscription, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { iCompany, iIndustry, iKvkItem } from '../models/dutch.interface';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { UtilsService } from '../services/utils.service';
import { DutchService } from '../services/dutch.service';
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
export class CardComponent implements OnInit, OnDestroy, OnChanges {
  @Input() company!: iCompany | null;
  search_url: string = '';
  copiedKvk: boolean = false;

  list_of_industries: iIndustry[] = this.utils.getIndustryList();

  // KvK details state
  kvkDetails: iKvkItem | null = null;
  loadingKvk: boolean = false;
  kvkError: boolean = false;

  // Race condition protection: subject + switchMap cancels previous pending requests
  private kvkQuerySubject = new Subject<string>();
  private kvkSubscription!: Subscription;

  constructor(
    @Optional() private _bottomSheetRef: MatBottomSheetRef<CardComponent>,
    @Optional() @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
    private utils: UtilsService,
    private dutchService: DutchService,
    private cdr: ChangeDetectorRef
  ) {
    if (data) {
      this.company = data;
      this.updateSearchUrl();
    }
  }

  ngOnInit(): void {
    // Setup RxJS switchMap to strictly prevent race conditions
    // When the user clicks rapidly between companies, previous in-flight HTTP requests are automatically cancelled
    this.kvkSubscription = this.kvkQuerySubject.pipe(
      tap(() => {
        this.loadingKvk = true;
        this.kvkError = false;
        this.kvkDetails = null;
        this.cdr.markForCheck();
      }),
      switchMap((query) => {
        if (!query) {
          return of({ query, item: null, error: false });
        }
        return this.dutchService.getKvkDetails(query).pipe(
          catchError(() => of(null)),
          switchMap((item) => of({ query, item, error: !item }))
        );
      })
    ).subscribe((result) => {
      // Secondary race-condition guard: check that the result belongs to current selected company
      const currentQuery = this.company?.kvk || this.company?.name || '';
      if (result.query !== currentQuery) {
        return; // Discard stale responses
      }

      this.loadingKvk = false;
      this.kvkDetails = result.item;
      this.kvkError = result.error;
      this.cdr.markForCheck();
    });

    if (this.company) {
      this.triggerKvkSearch();
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

  ngOnChanges(changes: SimpleChanges): void {
    this.updateSearchUrl();
    if (changes['company']) {
      this.triggerKvkSearch();
    }
  }

  ngOnDestroy(): void {
    if (this.kvkSubscription) {
      this.kvkSubscription.unsubscribe();
    }
  }

  private triggerKvkSearch(): void {
    const query = this.company?.kvk || this.company?.name || '';
    if (query) {
      this.kvkQuerySubject.next(query);
    } else {
      this.kvkDetails = null;
      this.loadingKvk = false;
      this.kvkError = false;
      this.cdr.markForCheck();
    }
  }

  retryKvk(): void {
    this.triggerKvkSearch();
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
