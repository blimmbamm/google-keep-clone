import { AsyncPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDialog } from '@angular/material/dialog';

import { NavigationService } from '../../services/navigation.service';
import { seedItems } from '../../../data/shared';
import {
  ManageLabelsDialogComponent,
  ManageLabelsDialogData,
} from '../labels/manage-labels-dialog/manage-labels-dialog.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../confirm-dialog/confirm-dialog.component';
import { LabelsService } from '../../services/labels/labels.service';
import { QueryService } from '../../services/query.service';

@Component({
  selector: 'app-sidenav',
  imports: [MatListModule, MatIconModule, MatButtonModule, AsyncPipe],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
  host: {
    // Add overflow-y scroll if open
    '[class.open]': 'open()',

    // Sidenav is closed or app is in mobile view:
    '[class.closed-or-mobile]': '!open() || mobile()',

    // Sidenav is closed or app is in mobile view
    // AND nav is temporarily expanded (hovered):
    '[class.closed-or-mobile-expanded]': 'expanded() && (mobile() || !open())',
  },
})
export class SidenavComponent {
  readonly navigation = inject(NavigationService);
  private dialog = inject(MatDialog);
  private labelsService = inject(LabelsService);
  private queryService = inject(QueryService);

  readonly open = input.required<boolean>();
  readonly expanded = input.required<boolean>();
  readonly mobile = input.required<boolean | undefined | null>();

  readonly labels = this.labelsService.labels;

  startEditLabels() {
    this.dialog.open<ManageLabelsDialogComponent, ManageLabelsDialogData>(
      ManageLabelsDialogComponent,
      {
        data: { labels: this.labels },
        panelClass: 'manage-labels-dialog-panel',
        autoFocus: false,
        maxHeight: '80vh', // Todo: height is off/always scrolling
      }
    );
  }

  handleResetData() {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
        ConfirmDialogComponent,
        {
          data: { dialogMessage: 'Reset notes and labels to initial data?' },
          autoFocus: false,
          panelClass: 'dialog-panel',
        }
      )
      .afterClosed()
      .subscribe((confirm) => {
        if (confirm) {
          try {
            seedItems();
            this.queryService.invalidateQuery('notes');
            this.queryService.invalidateQuery('labels');
          } catch {
            this.queryService.emitWriteToLocalStorageError();
          }
        }
      });
  }
}
