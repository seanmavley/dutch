import { Injectable, isDevMode } from '@angular/core';
import { createRxDatabase, addRxPlugin, RxDatabase } from 'rxdb';
import { companySchema } from '../schemas/company.schema';
import { RxCollection } from 'rxdb';
import { iCompany } from '../models/dutch.interface';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

@Injectable({
  providedIn: 'root'
})
export class RxdbService {
  private db!: RxDatabase;
  public companyCollection!: RxCollection<iCompany>;

  constructor() {}

  async initDB() {
    if (isDevMode()) {
      await import('rxdb/plugins/dev-mode').then(
        module => addRxPlugin(module.RxDBDevModePlugin)
      );
    }

    this.db = await createRxDatabase({
      name: 'dutch',
      storage: getRxStorageDexie(),
    });

    const collections = await this.db.addCollections({
      companies: {
        schema: companySchema
      }
    });

    this.companyCollection = collections.companies;
  }

  async addCompanies(companies: iCompany[]) {
    await this.companyCollection.bulkInsert(companies);
  }

  getCompanies() {
    return this.companyCollection.find().exec();
  }
}
