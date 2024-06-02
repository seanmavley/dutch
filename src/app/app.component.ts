import { Component } from '@angular/core';
import { SharedModule } from './shared/shared.module';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  openStyle: 'side' | 'over' = 'over';

  constructor(
    private breakpointObserver: BreakpointObserver) { }

    ngOnInit(): void {  
      this.breakpointObserver.observe([
        Breakpoints.Small,
        Breakpoints.Medium,
        Breakpoints.Large
      ]).subscribe(result => {
        if (result.breakpoints[Breakpoints.Large]) {
          this.openStyle = 'side';
        } else if (result.breakpoints[Breakpoints.Small] || result.breakpoints[Breakpoints.Medium]) {
          this.openStyle = 'side';
        }
      });
    }
}
