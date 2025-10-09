import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-security-notice',
  template: `
    <div class="security-notice" [class]="cssClass">
      <div class="security-icon">
        <i class="fas fa-shield-alt"></i>
      </div>
      <div class="security-content">
        <div class="security-title">{{ title }}</div>
        <div class="security-message">{{ message }}</div>
        <div class="compliance-badges" *ngIf="showBadges">
          <span class="badge hipaa-badge">HIPAA Compliant</span>
          <span class="badge encryption-badge">End-to-End Encrypted</span>
          <span class="badge audit-badge">Audit Logged</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .security-notice {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-radius: 8px;
      margin: 8px 0;
      background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%);
      border: 1px solid #28a745;
      box-shadow: 0 2px 4px rgba(40, 167, 69, 0.1);
    }

    .security-notice.warning {
      background: linear-gradient(135deg, #fff3cd 0%, #fef9e7 100%);
      border-color: #ffc107;
      box-shadow: 0 2px 4px rgba(255, 193, 7, 0.1);
    }

    .security-notice.critical {
      background: linear-gradient(135deg, #f8d7da 0%, #fce4e6 100%);
      border-color: #dc3545;
      box-shadow: 0 2px 4px rgba(220, 53, 69, 0.1);
    }

    .security-icon {
      margin-right: 12px;
      font-size: 20px;
      color: #28a745;
    }

    .security-notice.warning .security-icon {
      color: #ffc107;
    }

    .security-notice.critical .security-icon {
      color: #dc3545;
    }

    .security-content {
      flex: 1;
    }

    .security-title {
      font-weight: 600;
      font-size: 14px;
      color: #155724;
      margin-bottom: 4px;
    }

    .security-notice.warning .security-title {
      color: #856404;
    }

    .security-notice.critical .security-title {
      color: #721c24;
    }

    .security-message {
      font-size: 13px;
      color: #155724;
      line-height: 1.4;
    }

    .security-notice.warning .security-message {
      color: #856404;
    }

    .security-notice.critical .security-message {
      color: #721c24;
    }

    .compliance-badges {
      margin-top: 8px;
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 12px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .hipaa-badge {
      background-color: #007bff;
      color: white;
    }

    .encryption-badge {
      background-color: #28a745;
      color: white;
    }

    .audit-badge {
      background-color: #6f42c1;
      color: white;
    }

    @media (max-width: 768px) {
      .security-notice {
        padding: 10px 12px;
      }
      
      .security-icon {
        font-size: 18px;
        margin-right: 10px;
      }
      
      .security-title {
        font-size: 13px;
      }
      
      .security-message {
        font-size: 12px;
      }
    }
  `]
})
export class SecurityNoticeComponent {
  @Input() title: string = 'Secure Medical Communication';
  @Input() message: string = 'This session is HIPAA compliant with end-to-end encryption and comprehensive audit logging.';
  @Input() type: 'info' | 'warning' | 'critical' = 'info';
  @Input() showBadges: boolean = true;

  get cssClass(): string {
    return this.type === 'info' ? '' : this.type;
  }
}
