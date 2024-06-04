import { Component } from '@angular/core';
import { SharedModule } from './shared/shared.module';
import { DutchService } from './services/dutch.service';
import { iCompany } from './models/dutch.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CardComponent } from './card/card.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SharedModule, CardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {

  is_done: boolean = false;
  selected_company!: iCompany;
  filteredCompanies!: iCompany[]; // Store filtered companies
  activeCategory: string = 'all';

  list_of_industries = [
    { "slug": "mi", "name": "Manufacturing and Industrials", "id": 2 },
    { "slug": "eu", "name": "Energy and Utilities", "id": 3 },
    { "slug": "cgr","name": "Consumer Goods and Retail", "id": 4 },
    { "slug": "fre", "name": "Finance and Real Estate", "id": 5 },
    { "slug": "hp", "name": "Healthcare and Pharmaceuticals", "id": 6 },
    { "slug": "tt", "name": "Technology and Telecommunications", "id": 7 }
  ]

  list_of_companies!: iCompany[];

  constructor(
    private dutchService: DutchService,
    private snack: MatSnackBar,
  ) {
    this.is_done = localStorage.getItem('task') === 'done' ? true : false;
  }

  filterCompanies(categorySlug: string = 'all') {
    this.activeCategory = categorySlug;

    if (categorySlug === 'all') {
      this.filteredCompanies = this.list_of_companies; // Show all companies
    } else {
      this.filteredCompanies = this.list_of_companies.filter(
        (company) => company.category === categorySlug
      );
    }
  }

  ngOnInit() {
    if (!this.is_done) {
      this.snack.open('Loading latest update from Github', 'Ok', {
        duration: 10000,
      });
      this.loadJson();
    } else {
      this.snack.open('Loading locally stored data', 'Ok', {
        duration: 10000,
      });
      this.loadLocal();
    }
  }

  refresh() {
    this.loadJson()
  }

  loadLocal() {
    const data = localStorage.getItem('data');
    if (data) {
      this.list_of_companies = JSON.parse(data);
      console.log(this.list_of_companies)
    }
  }

  loadJson() {
    this.dutchService.loadJson('assets/orgs.json')
      .subscribe((data: iCompany[]) => {
        this.list_of_companies = data;
        this.snack.open('Updated successfully', 'Ok', {
          duration: 5000,
        });
      });
  }

  selectCompany(company: iCompany) {
    this.selected_company = company
  }
}
