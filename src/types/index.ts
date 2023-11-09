export interface CountryType {
    name: string;
    code: string;
}

export interface SearchResult {
    item: CountryType;
    score?: number;
}