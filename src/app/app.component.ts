import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SharedModule } from './shared/shared.module';
import { DutchService } from './services/dutch.service';
import { iCompany, iIndustry } from './models/dutch.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CardComponent } from './card/card.component';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { NgForm } from '@angular/forms';
import { MatBottomSheetModule, MatBottomSheet } from '@angular/material/bottom-sheet';
import { AboutDialogComponent } from './partials/about-dialog/about-dialog.component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { UtilsService } from './services/utils.service';

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

  private searchTerm$ = new Subject<string>();

  busy: boolean = false;
  is_done: boolean = false;
  selected_company!: iCompany;
  filteredCompanies!: iCompany[];
  activeCategory: string = 'all';
  isMobile: boolean = false;

  // TODO: find somewhere better to keep this?
  list_of_industries: iIndustry[] = this.utils.getIndustryList();

  list_of_companies!: iCompany[];

  constructor(
    private _bottomSheet: MatBottomSheet,
    private dutchService: DutchService,
    private breakpointObserver: BreakpointObserver,
    private snack: MatSnackBar,
    private utils: UtilsService
  ) {
    this.loadLocal();
  }

  ngAfterViewInit() {
    // use this to mark whether to load from remote or local
    // user explicitly clicks the refresh to load from remote AFTER first time load
    this.is_done = localStorage.getItem('task') === 'done' ? true : false;
  }

  ngOnInit() {
    if (!this.is_done) {
      this.snack.open('Loading latest update from Github', 'Ok', { duration: 10000 });
      this.loadJson();
    } else {
      this.snack.open('Loading locally stored data', 'Ok', { duration: 10000 });
      this.loadLocal();
    }

    // Filtering via company name
    this.searchTerm$
      .pipe(
        debounceTime(500),
        distinctUntilChanged()
      )
      .subscribe((searchTerm) => {
        this.filterCompanies(this.activeCategory, searchTerm);
      });

    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }

  refresh() {
    localStorage.clear();
    window.location.reload();
  }

  loadLocal() {
    this.busy = true;
    const data = localStorage.getItem('data');
    if (data) {
      this.list_of_companies = JSON.parse(data);
      this.filteredCompanies = this.list_of_companies;
      this.busy = false;
    }
  }

  loadJson() {
    this.busy = true;
    this.dutchService.loadJson('assets/orgs.json')
      .subscribe((data: iCompany[]) => {
        this.list_of_companies = data;
        this.filteredCompanies = data;
        this.snack.open('Loaded data successfully', 'Ok', { duration: 5000 });
        this.busy = false;
      });
  }

  selectCompany(company: iCompany) {
    this.selected_company = company;
  }

  onSubmit(form: NgForm) {
    this.searchTerm$.next(form.value.searchTerm);
  }

  onCategoryChange(categorySlug: string) {
    this.filterCompanies(categorySlug);
  }

  filterCompanies(categorySlug: string = 'all', searchTerm: string = '') {
    this.activeCategory = categorySlug;

    const filteredByCategory = categorySlug === 'all'
      ? this.list_of_companies
      : this.list_of_companies.filter((company) => company.category === categorySlug);

    this.filteredCompanies = filteredByCategory.filter(company =>
      company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  openAboutSheet() {
    this._bottomSheet.open(AboutDialogComponent);
  }

  openCompanyCard(org: iCompany) {
    this._bottomSheet.open(CardComponent, { data: org });
  }
}
