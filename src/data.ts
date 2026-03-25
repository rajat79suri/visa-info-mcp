import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initVisaData, lookupCountry as coreLookup, getAllCountries as coreGetAll } from './data-core.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rawData = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'visas.json'), 'utf-8'));

export const VISA_DATA = initVisaData(rawData);
export const lookupCountry = (query: string) => coreLookup(query, VISA_DATA);
export const getAllCountries = () => coreGetAll(VISA_DATA);
export type { VisaCountry } from './data-core.js';
