import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }

  getIndustryList() {
    return [
      { "slug": "mi", "name": "Manufacturing and Industrials", "id": 2 },
      { "slug": "eu", "name": "Energy and Utilities", "id": 3 },
      { "slug": "cgr", "name": "Consumer Goods and Retail", "id": 4 },
      { "slug": "fre", "name": "Finance and Real Estate", "id": 5 },
      { "slug": "hp", "name": "Healthcare and Pharmaceuticals", "id": 6 },
      { "slug": "tt", "name": "Technology and Telecommunications", "id": 7 }
    ]
  }
}
