export interface DadataSuggestion {
  value: string;
  data: {
    inn: string;
    name: {
      full_with_opf: string;
      short_with_opf: string;
    };
    address: {
      value: string;
    };
    management?: {
      name: string;
    };
    state?: {
      registration_date?: number;
    };
  };
}

export interface DadataSuggestResponse {
  suggestions: DadataSuggestion[];
}
