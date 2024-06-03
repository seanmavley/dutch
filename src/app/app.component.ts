import { Component } from '@angular/core';
import { SharedModule } from './shared/shared.module';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
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

  list_of_industries = [
    { "name": "Manufacturing and Industrials", "id": 2 },
    { "name": "Energy and Utilities", "id": 3 },
    { "name": "Consumer Goods and Retail", "id": 4 },
    { "name": "Finance and Real Estate", "id": 5 },
    { "name": "Healthcare and Pharmaceuticals", "id": 6 },
    { "name": "Technology and Telecommunications", "id": 7 }
  ]

  list_of_companies!: iCompany[];

  constructor(private dutchService: DutchService,
    private snack: MatSnackBar
  ) {

    this.is_done = localStorage.getItem('is_done') === 'done' ? true : false;

  }

  ngOnInit() {
    // this.dutchService.initDB()
    //   .then(async () => {
    //     await this.dutchService.getCompanies()
    //       .then(companies => {
    //         this.list_of_companies = companies;
    //       })
    //   })

    // if (!this.is_done) {
      this.loadJson();
    // } else {
    // }
  }

  loadJson() {

    this.dutchService.loadJson('assets/orgs.json')
      .subscribe({
        next: (data: iCompany[]) => {
          console.log(data)
          this.list_of_companies = data;

        },
        error: (error) => {
          console.error(error);
          this.snack.open(error.message, 'OK', { duration: 5000 });
        }
      });
  }

  selectCompany(company: iCompany) {
    console.log(company)
    this.selected_company = company
  }
}
