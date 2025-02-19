import { AsyncPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { of } from 'rxjs';
import { NavigationService } from '../../services/navigation.service';
import { LocalStorageKeys } from '../../../data/shared';
import { getLabels, seedLabels } from '../../../data/label';
import { QueryService } from '../../services/query.service';
import { MatDialog } from '@angular/material/dialog';
import {
  ManageLabelsDialogComponent,
  ManageLabelsDialogData,
} from '../labels/manage-labels-dialog/manage-labels-dialog.component';

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
    '[class.closed-or-mobile-expanded]': 'expanded() && (mobile() || !open())',
  },
})
export class SidenavComponent {
  readonly open = input.required<boolean>();
  readonly expanded = input.required<boolean>();
  readonly mobile = input.required<boolean | undefined | null>();

  readonly navigation = inject(NavigationService);
  private queryService = inject(QueryService);
  private dialog = inject(MatDialog);

  readonly labelsQuery = this.queryService.useParametrizedQuery({
    paramsObs: of(null),
    httpObsFn: () => getLabels(),
    queryKey: () => this.queryService.getLabelsQueryKey(),
  });

  startEditLabels() {
    this.dialog.open<ManageLabelsDialogComponent, ManageLabelsDialogData>(
      ManageLabelsDialogComponent,
      {
        data: { labels$: this.labelsQuery.data$ },
        panelClass: 'manage-labels-dialog-panel',
        autoFocus: false,
      }
    );
  }

  constructor() {
    if (!localStorage.getItem(LocalStorageKeys.LABELS)) {
      seedLabels();
    }
  }
}
