
import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection, ErrorHandler } from '@angular/core';
import { AppComponent } from './src/app.component';
import { GlobalErrorService } from './src/services/error.service';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    { provide: ErrorHandler, useClass: GlobalErrorService }
  ]
}).catch(err => console.error(err));

// AI Studio always uses an `index.tsx` file for all project types.
