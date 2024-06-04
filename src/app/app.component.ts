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

  list_of_industries = [
    { "name": "Manufacturing and Industrials", "id": 2 },
    { "name": "Energy and Utilities", "id": 3 },
    { "name": "Consumer Goods and Retail", "id": 4 },
    { "name": "Finance and Real Estate", "id": 5 },
    { "name": "Healthcare and Pharmaceuticals", "id": 6 },
    { "name": "Technology and Telecommunications", "id": 7 }
  ]

  list_of_companies!: iCompany[];

  constructor(
    private dutchService: DutchService,
    private snack: MatSnackBar,
  ) {
    this.is_done = localStorage.getItem('task') === 'done' ? true : false;
  }

  ngOnInit() {
    if (!this.is_done) {
      this.snack.open('Loading json from server', 'Ok', {
        duration: 3000,
      });
      this.loadJson();
    } else {
      this.snack.open('Loading json from local', 'Ok', {
        duration: 3000,
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
      });
  }

  selectCompany(company: iCompany) {
    this.selected_company = company
  }
}
