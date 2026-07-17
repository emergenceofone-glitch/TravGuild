import { Injectable, ErrorHandler, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GlobalErrorService implements ErrorHandler {
  readonly currentError = signal<string | null>(null);

  handleError(error: any): void {
    console.error('Global Error Caught:', error);
    
    // Extract a user-friendly message
    let message = 'An unexpected error occurred.';
    if (error instanceof Error) {
      try {
        // Try to parse if it's our FirestoreErrorInfo JSON
        const parsed = JSON.parse(error.message);
        if (parsed && parsed.error) {
          message = `Database Error: ${parsed.error}`;
        } else {
          message = error.message;
        }
      } catch (e) {
        message = error.message;
      }
    } else if (typeof error === 'string') {
      message = error;
    }
    
    this.currentError.set(message);
  }

  clearError() {
    this.currentError.set(null);
  }
}
