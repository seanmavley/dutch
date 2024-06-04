import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { iCompany } from '../models/dutch.interface';

@Injectable({
  providedIn: 'root'
})
export class DutchService {

  constructor(private http: HttpClient) { }

  /**
   * Load JSON file from local or remote resource and save
   * @param url string pointing to the location of the resource
   * @returns Array of company objects
   */
  loadJson(url: string) {
    return this.http.get<iCompany[]>(url)
      .pipe(
        tap(data => {
          console.log(JSON.stringify(data))
          localStorage.setItem('data', JSON.stringify(data))
          localStorage.setItem('task', 'done')
          localStorage.setItem('last_updated', new Date().toISOString())
          return data
        })
      );
  }

}
