import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';

@Component({
    selector: 'app-about-dialog',
    imports: [SharedModule],
    standalone: true,
    templateUrl: './about-dialog.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './about-dialog.component.scss'
})
export class AboutDialogComponent {

  constructor() { }

  ngOnInit(): void {
  }

}
