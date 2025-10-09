import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { VideoCallService, CallState, CallParticipant, CallRecording } from '../../../core/services/video-call.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-video-call',
  templateUrl: './video-call.component.html',
  styleUrls: ['./video-call.component.scss']
})
export class VideoCallComponent implements OnInit, OnDestroy {
  @Input() roomId!: string;
  @Input() consultationId!: number;
  @Input() isDoctor: boolean = false;
  @Output() callEnded = new EventEmitter<void>();
  @Output() callError = new EventEmitter<string>();

  @ViewChild('localVideo', { static: false }) localVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('remoteVideo', { static: false }) remoteVideo!: ElementRef<HTMLVideoElement>;

  private destroy$ = new Subject<void>();

  // Component state
  callState: CallState = {
    isInCall: false,
    isConnecting: false,
    isAudioMuted: false,
    isVideoMuted: false,
    isScreenSharing: false,
    callDuration: 0,
    connectionQuality: 'excellent',
    participants: []
  };

  recording: CallRecording = { isRecording: false };
  localStream: MediaStream | null = null;
  remoteStreams: Map<string, MediaStream> = new Map();
  currentUser: any;
  
  // UI state
  showControls = true;
  controlsTimeout: any;
  isFullscreen = false;
  showParticipants = false;
  showSettings = false;

  // Call quality indicators
  connectionQualityIcon = 'signal_cellular_4_bar';
  connectionQualityColor = 'success';

  constructor(
    private videoCallService: VideoCallService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.setupSubscriptions();
    this.initializeCall();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.endCall();
  }

  private setupSubscriptions(): void {
    // Subscribe to call state changes
    this.videoCallService.getCallState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.callState = state;
        this.updateConnectionQualityIndicator(state.connectionQuality);
      });

    // Subscribe to local stream
    this.videoCallService.getLocalStream()
      .pipe(takeUntil(this.destroy$))
      .subscribe(stream => {
        this.localStream = stream;
        if (stream && this.localVideo) {
          this.localVideo.nativeElement.srcObject = stream;
        }
      });

    // Subscribe to remote streams
    this.videoCallService.getRemoteStreams()
      .pipe(takeUntil(this.destroy$))
      .subscribe(streams => {
        this.remoteStreams = streams;
        // For simplicity, show the first remote stream
        const firstStream = streams.values().next().value;
        if (firstStream && this.remoteVideo) {
          this.remoteVideo.nativeElement.srcObject = firstStream;
        }
      });

    // Subscribe to recording state
    this.videoCallService.getRecordingState()
      .pipe(takeUntil(this.destroy$))
      .subscribe(recording => {
        this.recording = recording;
      });

    // Subscribe to call events
    this.videoCallService.getCallEndedEvent()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.callEnded.emit();
      });

    this.videoCallService.getConnectionErrorEvent()
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.callError.emit(error);
      });
  }

  private async initializeCall(): Promise<void> {
    try {
      await this.videoCallService.initializeCall(this.roomId, this.consultationId);
    } catch (error) {
      console.error('Failed to initialize call:', error);
      this.callError.emit('Failed to initialize video call');
    }
  }

  // Call control methods
  toggleAudio(): void {
    this.videoCallService.toggleAudio();
  }

  toggleVideo(): void {
    this.videoCallService.toggleVideo();
  }

  async toggleScreenShare(): Promise<void> {
    try {
      if (this.callState.isScreenSharing) {
        await this.videoCallService.stopScreenShare();
      } else {
        await this.videoCallService.startScreenShare();
      }
    } catch (error) {
      console.error('Screen share error:', error);
      this.callError.emit('Screen sharing failed');
    }
  }

  toggleRecording(): void {
    if (this.recording.isRecording) {
      this.videoCallService.stopRecording();
    } else {
      this.videoCallService.startRecording();
    }
  }

  endCall(): void {
    this.videoCallService.endCall();
  }

  // UI control methods
  toggleFullscreen(): void {
    if (!this.isFullscreen) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    this.isFullscreen = !this.isFullscreen;
  }

  toggleParticipants(): void {
    this.showParticipants = !this.showParticipants;
  }

  toggleSettings(): void {
    this.showSettings = !this.showSettings;
  }

  // Mouse movement handler for auto-hiding controls
  onMouseMove(): void {
    this.showControls = true;
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout);
    }
    this.controlsTimeout = setTimeout(() => {
      this.showControls = false;
    }, 3000);
  }

  // Helper methods
  formatCallDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }

  private updateConnectionQualityIndicator(quality: string): void {
    switch (quality) {
      case 'excellent':
        this.connectionQualityIcon = 'signal_cellular_4_bar';
        this.connectionQualityColor = 'success';
        break;
      case 'good':
        this.connectionQualityIcon = 'signal_cellular_3_bar';
        this.connectionQualityColor = 'success';
        break;
      case 'fair':
        this.connectionQualityIcon = 'signal_cellular_2_bar';
        this.connectionQualityColor = 'warning';
        break;
      case 'poor':
        this.connectionQualityIcon = 'signal_cellular_1_bar';
        this.connectionQualityColor = 'danger';
        break;
    }
  }

  getParticipantCount(): number {
    return this.callState.participants.length + 1; // +1 for current user
  }

  getCallStatusText(): string {
    if (this.callState.isConnecting) {
      return 'Connecting...';
    } else if (this.callState.isInCall) {
      return 'Connected';
    } else {
      return 'Not connected';
    }
  }

  // Audio/Video button states
  getAudioButtonClass(): string {
    return this.callState.isAudioMuted ? 'btn-danger' : 'btn-secondary';
  }

  getVideoButtonClass(): string {
    return this.callState.isVideoMuted ? 'btn-danger' : 'btn-secondary';
  }

  getScreenShareButtonClass(): string {
    return this.callState.isScreenSharing ? 'btn-primary' : 'btn-secondary';
  }

  getRecordingButtonClass(): string {
    return this.recording.isRecording ? 'btn-danger' : 'btn-secondary';
  }

  // Icon getters
  getAudioIcon(): string {
    return this.callState.isAudioMuted ? 'mic_off' : 'mic';
  }

  getVideoIcon(): string {
    return this.callState.isVideoMuted ? 'videocam_off' : 'videocam';
  }

  getScreenShareIcon(): string {
    return this.callState.isScreenSharing ? 'stop_screen_share' : 'screen_share';
  }

  getRecordingIcon(): string {
    return this.recording.isRecording ? 'stop' : 'fiber_manual_record';
  }
}
