import { AxiosError } from 'axios';

export function parseApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    const d = error.response?.data;
    if (d?.detail) return d.detail;
    if (d?.message) return d.message;
    if (d?.errors) return Object.values(d.errors).flat().join(', ');
    const status = error.response?.status;
    if (status === 401) return 'Tafadhali ingia tena.';
    if (status === 403) return 'Huna ruhusa ya kufanya hivi.';
    if (status === 404) return 'Haikupatikana.';
    if (status === 429) return 'Ombi nyingi sana. Subiri kidogo.';
    if (status && status >= 500) return 'Hitilafu ya server. Jaribu tena.';
  }
  if (error instanceof Error) return error.message;
  return 'Hitilafu isiyotarajiwa. Jaribu tena.';
}