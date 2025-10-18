import { Component, Inject } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';

@Component({
    selector: 'app-about-dialog',
    imports: [SharedModule],
    templateUrl: './about-dialog.component.html',
    styleUrl: './about-dialog.component.scss'
})
export class AboutDialogComponent {

  constructor() { }

  ngOnInit(): void {
  }

}
