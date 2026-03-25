import visasRaw from '../data/visas.json';
import { initVisaData, lookupCountry as coreLookup, getAllCountries as coreGetAll } from '../src/data-core.js';

const VISA_DATA = initVisaData(visasRaw as Record<string, any>);
export const lookupCountry = (query: string) => coreLookup(query, VISA_DATA);
export const getAllCountries = () => coreGetAll(VISA_DATA);
