import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';

// This file is responsible for bootstrapping your Angular application.
// It imports the root component (App) and tells Angular to render it.
bootstrapApplication(AppComponent)
  .catch((err) => console.error(err));

