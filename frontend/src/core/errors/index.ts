import { AxiosError } from 'axios';

export interface FieldError {
  field: string;
  message: string;
}

export function parseFieldErrors(error: unknown): FieldError[] {
  console.log("BACKEND ERROR:", error);
  
  const fieldErrors: FieldError[] = [];
  
  if (error instanceof AxiosError) {
    const d = error.response?.data;
    console.log("BACKEND RESPONSE DATA:", d);
    
    if (d?.errors && Array.isArray(d.errors)) {
      console.log("PARSING ERRORS ARRAY:", d.errors);
      
      d.errors.forEach((errorStr: string) => {
        // Split "field: message" format
        const colonIndex = errorStr.indexOf(':');
        if (colonIndex > 0) {
          const field = errorStr.substring(0, colonIndex).trim();
          const message = errorStr.substring(colonIndex + 1).trim();
          fieldErrors.push({ field, message });
        }
      });
      
      console.log("PARSED ERRORS:", fieldErrors);
    }
  }
  
  return fieldErrors;
}

export function parseApiError(error: unknown): string {
  console.log("FRONTEND ERROR STEP 1: parseApiError called with:", error);
  if (error instanceof AxiosError) {
    const d = error.response?.data;
    console.log("FRONTEND ERROR STEP 2: AxiosError detected, response data:", d);
    if (d?.detail) {
      console.log("FRONTEND ERROR STEP 3: Using detail:", d.detail);
      return d.detail;
    }
    if (d?.message) {
      console.log("FRONTEND ERROR STEP 4: Using message:", d.message);
      return d.message;
    }
    if (d?.errors) {
      console.log("FRONTEND ERROR STEP 5: Using errors array:", d.errors);
      const result = Array.isArray(d.errors) ? d.errors.join(', ') : String(d.errors);
      console.log("FRONTEND ERROR STEP 6: Joined errors result:", result);
      return result;
    }
    const status = error.response?.status;
    console.log("FRONTEND ERROR STEP 7: Using status fallback:", status);
    if (status === 401) return 'Tafadhali ingia tena.';
    if (status === 403) return 'Huna ruhusa ya kufanya hivi.';
    if (status === 404) return 'Haikupatikana.';
    if (status === 429) return 'Ombi nyingi sana. Subiri kidogo.';
    if (status && status >= 500) return 'Hitilafu ya server. Jaribu tena.';
  }
  console.log("FRONTEND ERROR STEP 8: Using generic fallback");
  if (error instanceof Error) return error.message;
  return 'Hitilafu isiyotarajiwa. Jaribu tena.';
}