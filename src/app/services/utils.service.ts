import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }

  getIndustryList() {
    return [
      { "slug": "mi", "name": "Manufacturing and Industrials" },
      { "slug": "eu", "name": "Energy and Utilities" },
      { "slug": "cgr", "name": "Consumer Goods and Retail" },
      { "slug": "fre", "name": "Finance and Real Estate" },
      { "slug": "hp", "name": "Healthcare and Pharmaceuticals" },
      { "slug": "tt", "name": "Technology and Telecommunications" },
      { "slug": "ot", "name": "Other" }
    ]
  }
}
