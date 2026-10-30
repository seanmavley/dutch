import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, AfterContentInit } from '@angular/core';
import { DutchService } from './services/dutch.service';
import { iCompany, iCategory, iIndustry } from './models/dutch.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CardComponent } from './card/card.component';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AboutDialogComponent } from './partials/about-dialog/about-dialog.component';
import { SwUpdate } from '@angular/service-worker';
import { FormControl } from '@angular/forms';
import { SharedModule } from './shared/shared.module';
import { UtilsService } from './services/utils.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    SharedModule,
    CardComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, AfterContentInit {
  busy: boolean = false;
  is_done: boolean = false;
  active_company: iCompany | null = null;
  filteredCompanies: iCompany[] = [];
  activeCategory: string = 'all';
  isDarkMode: boolean = true;
  sortAscending: boolean = true;

  list_of_categories: iCategory[] = [];
  list_of_industries: iIndustry[] = [];
  searchTerm = new FormControl('');

  constructor(
    private _bottomSheet: MatBottomSheet,
    private dutchService: DutchService,
    private utils: UtilsService,
    private snack: MatSnackBar,
    private ref: ChangeDetectorRef,
    private updates: SwUpdate,
  ) {
    this.list_of_industries = this.utils.getIndustryList();
  }

  ngOnInit() {
    this.initTheme();
    this.is_done = localStorage.getItem('task') === 'done' ? true : false;

    this.searchTerm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe((searchTerm) => {
        if (this.busy) {
          this.snack.open('Please wait while data is loading', 'Ok', { duration: 3000 });
          return;
        }
        this.updateFilteredCompanies(searchTerm || '');
        this.ref.markForCheck();
      });
  }

  ngAfterContentInit(): void {
    if (!this.is_done) {
      this.snack.open('Loading recognised sponsors dataset', 'Ok', { duration: 5000 });
      this.loadJson();
    } else {
      this.snack.open('Loading locally stored data', 'Ok', { duration: 5000 });
      this.loadLocal();
    }
  }

  initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.isDarkMode = savedTheme === 'dark';
    } else {
      this.isDarkMode = true; // Default to dark mode matching redesigned UI
    }
    this.applyTheme();
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme() {
    if (typeof document !== 'undefined') {
      if (this.isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }

  toggleSort() {
    this.sortAscending = !this.sortAscending;
    if (this.filteredCompanies && this.filteredCompanies.length > 0) {
      this.filteredCompanies.sort((a, b) => {
        return this.sortAscending
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      });
      this.ref.markForCheck();
    }
  }

  refresh() {
    localStorage.clear();
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });
      });
    }
    this.snack.open('Refreshing page cache in 2 seconds...', 'Ok', { duration: 2000 });
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  loadLocal() {
    this.busy = true;
    const data = localStorage.getItem('data');
    if (data) {
      try {
        this.list_of_categories = JSON.parse(data);
        this.updateFilteredCompanies(this.searchTerm.value || '');
      } catch (e) {
        this.loadJson();
      }
      this.busy = false;
      this.ref.markForCheck();
    } else {
      this.loadJson();
    }
  }

  loadJson() {
    this.busy = true;
    this.dutchService.loadJson('assets/sponsors.json')
      .subscribe({
        next: (data: iCategory[]) => {
          this.list_of_categories = data;
          this.updateFilteredCompanies(this.searchTerm.value || '');
          this.snack.open(`Loaded ${this.getTotalCompaniesCount()} sponsors successfully`, 'Ok', { duration: 4000 });
          this.busy = false;
          this.ref.markForCheck();
        },
        error: () => {
          // Fallback to legacy date-based asset if needed
          this.dutchService.loadJson('assets/18-10-2025.json').subscribe({
            next: (data: iCategory[]) => {
              this.list_of_categories = data;
              this.updateFilteredCompanies(this.searchTerm.value || '');
              this.snack.open('Loaded backup dataset successfully', 'Ok', { duration: 4000 });
              this.busy = false;
              this.ref.markForCheck();
            },
            error: () => {
              this.busy = false;
              this.snack.open('Failed to load dataset. Please click refresh.', 'Ok', { duration: 5000 });
              this.ref.markForCheck();
            }
          });
        }
      });
  }

  selectCompany(company: iCompany) {
    this.active_company = company;
    this.ref.markForCheck();
  }

  onCompanyClick(company: iCompany) {
    this.selectCompany(company);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.openCompanyCard(company);
    }
  }

  openCompanyCard(org: iCompany) {
    this.active_company = org;
    this._bottomSheet.open(CardComponent, { data: org });
  }

  onCategoryChange(categorySlug: string) {
    if (this.busy) {
      this.snack.open('Please wait while data is loading', 'Ok', { duration: 3000 });
      return;
    }
    this.activeCategory = categorySlug;
    this.updateFilteredCompanies(this.searchTerm.value || '');
    this.ref.markForCheck();
  }

  filterCompanies(categorySlug: string = 'all', searchTerm: string = '') {
    this.activeCategory = categorySlug;
    this.updateFilteredCompanies(searchTerm);
    this.ref.markForCheck();
  }

  updateFilteredCompanies(searchTerm: string = '') {
    let list: iCompany[] = [];

    if (this.activeCategory.toLowerCase() === 'all') {
      list = this.list_of_categories.flatMap(category => category.category.companies);
    } else {
      const category = this.list_of_categories.find(
        cat => cat.category.slug.toLowerCase() === this.activeCategory.toLowerCase()
      );
      list = category ? [...category.category.companies] : [];
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      list = list.filter(company =>
        (company.name && company.name.toLowerCase().includes(term)) ||
        (company.kvk && company.kvk.toLowerCase().includes(term)) ||
        (company.tags && company.tags.some(t => t.toLowerCase().includes(term)))
      );
    }

    this.filteredCompanies = list;

    // Set first company as active if none selected or previous active not in filtered list
    if (this.filteredCompanies.length > 0) {
      if (!this.active_company || !this.filteredCompanies.some(c => c.id === this.active_company?.id)) {
        this.active_company = this.filteredCompanies[0];
      }
    } else {
      this.active_company = null;
    }
  }

  getTotalCompaniesCount(): number {
    return this.list_of_categories.reduce(
      (acc, cat) => acc + (cat.category?.companies?.length || 0),
      0
    );
  }

  getIndustryName(categorySlug?: string): string {
    if (!categorySlug) return 'Other';
    const industry = this.list_of_industries.find(
      (ind) => ind.slug.toLowerCase() === categorySlug.toLowerCase()
    );
    return industry ? industry.name : categorySlug;
  }

  openAboutSheet() {
    this._bottomSheet.open(AboutDialogComponent);
  }

  exportCategory() {
    if (!this.filteredCompanies || this.filteredCompanies.length === 0) {
      this.snack.open('No companies to export in current filter', 'Ok', { duration: 3000 });
      return;
    }

    const data = this.filteredCompanies.map(c => `${c.name} (KVK: ${c.kvk}) - ${c.website}`).join('\n');
    const blob = new Blob([data], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.activeCategory}-sponsors.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.snack.open(`Exported ${this.filteredCompanies.length} companies`, 'Ok', { duration: 5000 });
  }
}
