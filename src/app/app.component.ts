import { Component, ChangeDetectionStrategy, ViewChild, ElementRef, HostListener, ChangeDetectorRef } from '@angular/core';
import { SharedModule } from './shared/shared.module';
import { DutchService } from './services/dutch.service';
import { iCompany, iCategory } from './models/dutch.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CardComponent } from './card/card.component';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatBottomSheetModule, MatBottomSheet } from '@angular/material/bottom-sheet';
import { AboutDialogComponent } from './partials/about-dialog/about-dialog.component';
import { SwUpdate } from '@angular/service-worker';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SharedModule, MatBottomSheetModule, CardComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [MatBottomSheet],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {

  @ViewChild('scrollupButton') scrollupButton!: ElementRef;
  isButtonVisible = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isButtonVisible = window.scrollY > 200;
  }

  busy: boolean = false;
  is_done: boolean = false;
  active_company!: iCompany | null;;
  filteredCompanies!: iCompany[] | null;
  activeCategory: string = 'all';

  list_of_categories: iCategory[] = [];

  searchTerm = new FormControl();

  constructor(
    private _bottomSheet: MatBottomSheet,
    private dutchService: DutchService,
    private snack: MatSnackBar,
    private ref: ChangeDetectorRef,
    private updates: SwUpdate,
  ) { }


  ngOnInit() {
    this.is_done = localStorage.getItem('task') === 'done' ? true : false;

    this.searchTerm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe((searchTerm) => {
        if (this.busy) {
          this.snack.open('Please wait while we load data', 'Ok', { duration: 5000 });
          return;
        }
        this.filterCompanies(this.activeCategory, searchTerm);
      });
  }

  ngAfterContentInit(): void {
    if (!this.is_done) {
      this.snack.open('Loading latest update from Github', 'Ok', { duration: 10000 });
      this.loadJson();
    } else {
      this.snack.open('Loading locally stored data', 'Ok', { duration: 10000 });
      this.loadLocal();
    }
  }

  refresh() {
    localStorage.clear();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });
      });
    }
    this.snack.open('Refreshing page in 3 seconds', 'Ok', { duration: 3000 });
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }


  loadLocal() {
    this.busy = true;
    const data = localStorage.getItem('data');
    if (data) {
      this.list_of_categories = JSON.parse(data);
      this.updateFilteredCompanies();
      this.busy = false;
      this.ref.detectChanges()
    }
  }

  loadJson() {
    this.busy = true;
    this.dutchService.loadJson('assets/orgs-v2.json')
      .subscribe((data: iCategory[]) => {
        this.list_of_categories = data;
        this.updateFilteredCompanies();
        this.snack.open('Loaded data successfully', 'Ok', { duration: 5000 });
        this.busy = false;
        this.ref.detectChanges()
      });
  }

  selectCompany(company: iCompany) {
    this.active_company = company;
  }

  onCategoryChange(categorySlug: string) {
    if (this.busy) {
      this.snack.open('Please wait while we load data', 'Ok', { duration: 5000 })
      return;
    }
    this.activeCategory = categorySlug;
    this.updateFilteredCompanies();
  }

  updateFilteredCompanies(searchTerm: string = '') {
    if (this.activeCategory.toLowerCase() === 'all') {
      this.filteredCompanies = this.list_of_categories.flatMap(category => category.category.companies);
    } else {
      const category = this.list_of_categories.find(cat => cat.category.slug.toLowerCase() === this.activeCategory.toLowerCase());
      this.filteredCompanies = category ? category.category.companies : [];
    }
  
    if (searchTerm) {
      this.filteredCompanies = this.filteredCompanies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  }
  

  filterCompanies(categorySlug: string = 'all', searchTerm: string = '') {
    this.activeCategory = categorySlug;
    this.updateFilteredCompanies(searchTerm);
  }

  openAboutSheet() {
    this._bottomSheet.open(AboutDialogComponent);
  }

  openCompanyCard(org: iCompany) {
    this._bottomSheet.open(CardComponent, { data: org });
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // checkForUpdate() {
  //   if (this.updates.isEnabled) {
  //     this.updates.available.subscribe(() => {
  //       if (confirm('New version available. Load new version?')) {
  //         this.updates.activateUpdate().then(() => document.location.reload());
  //       }
  //     });
  //   }
  // }

}

if (typeof Worker !== 'undefined') {
  // Create a new
  const worker = new Worker(new URL('./app.worker', import.meta.url));
  worker.onmessage = ({ data }) => {
    console.log(`page got message: ${data}`);
  };
  worker.postMessage('hello');
} else {
  // Web Workers are not supported in this environment.
  // You should add a fallback so that your program still executes correctly.
  console.log('Web Workers are not supported in this environment.');
  alert('Web Workers are not supported in this environment.');
}
