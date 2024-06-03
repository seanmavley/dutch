import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { iCompany } from '../models/dutch.interface';
import { RxdbService } from './rxdb.service';

@Injectable({
  providedIn: 'root'
})
export class DutchService {

  constructor(private http: HttpClient, private rxdbService: RxdbService) { }

  loadJson(url: string): Observable<iCompany[]> {
    return this.http.get<iCompany[]>(url).pipe(
      tap(async (data: iCompany[]) => {
        await this.rxdbService.initDB().then(async () => {
          await this.rxdbService.addCompanies(data);
        });
      }),
    );
  }

  getCompanies() {
    return this.rxdbService.getCompanies();
  }
}
