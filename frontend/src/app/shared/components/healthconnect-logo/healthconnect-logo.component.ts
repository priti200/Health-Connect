import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-healthconnect-logo',
  template: `
    <div class="healthconnect-logo" [ngClass]="sizeClass" [style.cursor]="clickable ? 'pointer' : 'default'" (click)="onClick()">
      <div class="logo-icon">
        <i class="bi bi-heart-pulse"></i>
      </div>
      <span *ngIf="showText" class="logo-text">HealthConnect</span>
    </div>
  `,
  styleUrls: ['./healthconnect-logo.component.scss']
})
export class HealthConnectLogoComponent {
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() showText: boolean = true;
  @Input() clickable: boolean = false;

  get sizeClass(): string {
    return `logo-${this.size}`;
  }

  onClick(): void {
    if (this.clickable) {
      // Navigate to home or emit event
      console.log('Logo clicked');
    }
  }
}
