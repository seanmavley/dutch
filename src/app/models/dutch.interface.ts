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
