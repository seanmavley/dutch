import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor() { }

  getIndustryList() {
    return [
      { "category": "mi", "name": "Manufacturing and Industrials" },
      { "category": "eu", "name": "Energy and Utilities" },
      { "category": "cgr", "name": "Consumer Goods and Retail" },
      { "category": "fre", "name": "Finance and Real Estate" },
      { "category": "hp", "name": "Healthcare and Pharmaceuticals" },
      { "category": "tt", "name": "Technology and Telecommunications" },
      { "category": "ot", "name": "Other" }
    ]
  }
}
