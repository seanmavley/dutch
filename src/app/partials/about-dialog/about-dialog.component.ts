import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'app-about-dialog',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './about-dialog.component.html',
  styleUrl: './about-dialog.component.scss'
})
export class AboutDialogComponent {

  constructor(@Inject(MAT_DIALOG_DATA) public data: any){}

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    console.log(this.data);
  }

}
