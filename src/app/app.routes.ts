import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { NotFoundComponent } from './not-found/not-found.component';

export const routes: Routes = [
  {
    path: "",
    component: LayoutComponent
  },
  {
    path: "**",
    component: NotFoundComponent
  }
];
