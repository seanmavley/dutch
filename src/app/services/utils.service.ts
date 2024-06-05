import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }

  getIndustryList() {
    return [
      { "slug": "mi", "name": "Manufacturing and Industrials", "id": 1 },
      { "slug": "eu", "name": "Energy and Utilities", "id": 2 },
      { "slug": "cgr", "name": "Consumer Goods and Retail", "id": 3 },
      { "slug": "fre", "name": "Finance and Real Estate", "id": 4 },
      { "slug": "hp", "name": "Healthcare and Pharmaceuticals", "id": 5 },
      { "slug": "tt", "name": "Technology and Telecommunications", "id": 6 }
    ]
  }
}
