import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { iCategory, iKvkItem, iKvkSearchResult } from '../models/dutch.interface';

const KVK_PROFILE_ID = '5C10A89D-635E-49CC-94B8-042DD533B64A';

@Injectable({
  providedIn: 'root'
})
export class DutchService {
  private kvkCache = new Map<string, iKvkItem | null>();

  constructor(private http: HttpClient) { }

  /**
   * Load JSON file from local or remote resource and save
   * @param url string pointing to the location of the resource
   * @returns Array of company objects
   */
  loadJson(url: string): Observable<iCategory[]>{
    return this.http.get<iCategory[]>(url)
      .pipe(
        tap(data => {
          localStorage.setItem('data', JSON.stringify(data))
          localStorage.setItem('task', 'done')
          localStorage.setItem('last_updated', new Date().toISOString())
          return data
        })
      );
  }

  /**
   * Fetch company details from KvK Search API by KvK number or company name.
   * Caches results in memory and attempts proxy followed by direct endpoint.
   */
  getKvkDetails(query: string): Observable<iKvkItem | null> {
    const cleanQuery = (query || '').trim();
    if (!cleanQuery) {
      return of(null);
    }

    if (this.kvkCache.has(cleanQuery)) {
      return of(this.kvkCache.get(cleanQuery)!);
    }

    const headers = new HttpHeaders({
      profileId: KVK_PROFILE_ID
    });

    const params = {
      q: cleanQuery,
      language: 'nl',
      site: 'kvk2014',
      size: '5',
      start: '0',
      inschrijvingsstatus: 'ingeschreven'
    };

    const proxyUrl = '/api/kvk/zoeken/v3/search';
    const directUrl = 'https://web-api.kvk.nl/zoeken/v3/search';

    return this.http.get<{ data?: iKvkSearchResult }>(proxyUrl, { headers, params }).pipe(
      catchError(() => {
        // Fallback to direct API if dev proxy is not active
        return this.http.get<{ data?: iKvkSearchResult }>(directUrl, { headers, params });
      }),
      map((res) => {
        const items = res?.data?.items || [];
        if (items.length === 0) {
          this.kvkCache.set(cleanQuery, null);
          return null;
        }

        // Prefer headquarter (Hoofdvestiging) or active branch
        const bestItem =
          items.find((item) => item.inschrijvingstype === 'Hoofdvestiging') ||
          items.find((item) => item.vestiging === true) ||
          items[0];

        this.kvkCache.set(cleanQuery, bestItem);
        return bestItem;
      })
    );
  }
}


