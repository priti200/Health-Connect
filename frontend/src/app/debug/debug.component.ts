import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { VideoConsultationService } from '../core/services/video-consultation.service';
import { AppointmentService } from '../core/services/appointment.service';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-debug',
  template: `
    <div class="container mt-4">
      <div class="row">
        <div class="col-12">
          <h2>
            <i class="fas fa-bug me-2"></i>
            Debug & Testing Tools
          </h2>
          <p class="text-muted">
            Use these tools to test and debug the Angular-Spring Boot integration.
          </p>
        </div>
      </div>

      <!-- Video Consultation Test -->
      <div class="row mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Video Consultation Test</h5>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <h6>Quick Tests</h6>
                  <div class="d-flex flex-column gap-2">
                    <button class="btn btn-primary" (click)="testWebRTCSupport()">
                      Test WebRTC Support
                    </button>
                    <button class="btn btn-info" (click)="testMediaDevices()">
                      Test Camera/Microphone
                    </button>
                    <button class="btn btn-success" (click)="navigateToTelemedicine()">
                      Go to Telemedicine
                    </button>
                    <button class="btn btn-warning" (click)="testVideoConsultationAPI()">
                      Test Video Consultation API
                    </button>
                  </div>
                </div>
                <div class="col-md-6">
                  <h6>Test Results</h6>
                  <div *ngIf="testResults" class="alert alert-info">
                    <pre>{{ testResults | json }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col-12">
          <!-- WebSocket Test Component -->
          <app-websocket-test></app-websocket-test>
        </div>
      </div>

      <div class="row mt-4">
        <div class="col-12">
          <!-- Chat Stress Test Component -->
          <app-chat-stress-test></app-chat-stress-test>
        </div>
      </div>

      <div class="row mt-4">
        <div class="col-lg-8">

        <div class="col-lg-4">
          <!-- WebSocket Status -->
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Connection Status</h5>
            </div>
            <div class="card-body">
              <app-websocket-status></app-websocket-status>
            </div>
          </div>

          <!-- Quick Info -->
          <div class="card mt-3">
            <div class="card-header">
              <h5 class="mb-0">Quick Info</h5>
            </div>
            <div class="card-body">
              <ul class="list-unstyled">
                <li><strong>Backend:</strong> http://localhost:8080</li>
                <li><strong>WebSocket:</strong> http://localhost:8080/api/ws</li>
                <li><strong>Frontend:</strong> http://localhost:4200</li>
              </ul>

              <hr>

              <h6>Video Consultation Test Steps:</h6>
              <ol class="small">
                <li>Book appointment with type "VIDEO_CALL"</li>
                <li>Go to appointment details</li>
                <li>Click "Start Video Consultation"</li>
                <li>Grant camera/microphone permissions</li>
                <li>Test video call features</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
    }
  `]
})
export class DebugComponent {
  testResults: any = null;

  constructor(
    private router: Router,
    private videoConsultationService: VideoConsultationService,
    private appointmentService: AppointmentService,
    private authService: AuthService
  ) {}

  async testWebRTCSupport(): Promise<void> {
    const results: any = {
      timestamp: new Date().toISOString(),
      webrtcSupported: false,
      getUserMediaSupported: false,
      rtcPeerConnectionSupported: false
    };

    try {
      // Test WebRTC support
      results.webrtcSupported = !!(window as any).RTCPeerConnection;
      results.rtcPeerConnectionSupported = typeof RTCPeerConnection !== 'undefined';
      results.getUserMediaSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

      this.testResults = results;
    } catch (error) {
      results.error = error;
      this.testResults = results;
    }
  }

  async testMediaDevices(): Promise<void> {
    const results: any = {
      timestamp: new Date().toISOString(),
      mediaDevicesSupported: false,
      devices: [],
      permissionGranted: false
    };

    try {
      if (navigator.mediaDevices) {
        results.mediaDevicesSupported = true;

        // Get available devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        results.devices = devices.map(device => ({
          kind: device.kind,
          label: device.label || 'Unknown device'
        }));

        // Test getUserMedia
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        results.permissionGranted = true;

        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
      }

      this.testResults = results;
    } catch (error) {
      results.error = error;
      this.testResults = results;
    }
  }

  navigateToTelemedicine(): void {
    this.router.navigate(['/telemedicine/consultations']);
  }

  testVideoConsultationAPI(): void {
    const results: any = {
      timestamp: new Date().toISOString(),
      currentUser: this.authService.getCurrentUser(),
      apiTest: 'Starting...'
    };

    // Test getting user consultations
    this.videoConsultationService.getUserConsultations().subscribe({
      next: (consultations) => {
        results.apiTest = 'Success';
        results.consultations = consultations;
        this.testResults = results;
      },
      error: (error) => {
        results.apiTest = 'Failed';
        results.error = error;
        this.testResults = results;
      }
    });
  }
}
