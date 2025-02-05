import { AsyncPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-sidenav',
  imports: [MatListModule, MatIconModule, MatButtonModule, AsyncPipe],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
  host: {
    // Sidenav is closed or app is in mobile view:
    '[class.closed-or-mobile]': '!open() || mobile()', 
    
    // Sidenav is closed or app is in mobile view 
    // AND nav is temporarily expanded (hovered):
    '[class.closed-or-mobile-expanded]': 'expanded() && (mobile() || !open())' 
  },
})
export class SidenavComponent {
  open = input.required<boolean>();
  expanded = input.required<boolean>();
  mobile = input.required<boolean | undefined | null>();

  navigation = inject(NavigationService)

  labels = [
    { id: 1, name: 'Dingens' },
    { id: 2, name: 'Dongens' },
    { id: 3, name: 'Banane' },
  ];

  // route = inject(ActivatedRoute);

  // fragment$ = this.route.fragment.pipe(
  //   map((fragment) => {
  //     const label = fragment && fragment.match(/^label\/(\w+)$/)?.[1];
  //     return label || fragment;
  //   })
  // );

  // router = inject(Router);

  // navigate(label?: string, trash?: boolean) {
  //   const fragment =
  //     (trash || label) && ((trash && 'trash') || (label && `label/${label}`));

  //   this.router.navigate([], { fragment });
  // }

  // navigate = this.navigation.navigate;
  // navigate(){
  //   this.navigation.navigate()
  // }
}
