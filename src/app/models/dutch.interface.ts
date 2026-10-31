export interface iCompany {
  id: number;
  name: string;
  description: string;
  category: string;
  website: string;
  tags: string[];
  kvk: string;
}

export interface iCategory {
  category: {
    name: string;
    slug: string;
    description: string;
    companies: iCompany[];
  }
}

export interface iIndustry {
  name: string;
  slug: string;
}

export interface iKvkLocation {
  straat?: string;
  huisnummer?: string;
  postcode?: string;
  plaats?: string;
}

export interface iKvkItem {
  set?: string;
  bron?: string;
  kvkNummer?: string;
  vestigingsnummer?: string;
  rechtsvormCode?: string;
  rechtsvormOmschrijving?: string;
  actief?: boolean;
  vestiging?: boolean;
  naam?: string;
  inschrijvingstype?: string;
  inschrijvingsdatum?: string;
  bezoeklocatie?: iKvkLocation;
  postlocatie?: iKvkLocation;
  activiteitomschrijving?: string;
  huidigeHandelsNamen?: string[];
  oudeHandelsnamen?: string[];
  huidigeStatutaireNaam?: string;
  id?: string;
}

export interface iKvkSearchResult {
  startPage?: number;
  numberOfHits?: number;
  itemsPerPage?: number;
  items?: iKvkItem[];
}

