// src/app/schemas/company.schema.ts
export const companySchema = {
  title: 'company schema',
  description: 'describes a company',
  version: 0,
  type: 'object',
  primaryKey: "id",
  properties: {
    id: {
      type: 'string',
      primary: true,
      "maxLength": 100
    },
    kvk: {
      type: 'string'
    },
    name: {
      type: 'string'
    },
    description: {
      type: 'string'
    },
    category: {
      type: 'string'
    },
    website: {
      type: 'string'
    },
    tags: {
      type: 'string'
    }
  },
  required: ['id', 'kvk', 'name', 'category', 'website']
};
