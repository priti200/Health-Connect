import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface RecordingOptions {
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
  mimeType?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CallRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording$ = new BehaviorSubject<boolean>(false);
  private recordingDuration$ = new BehaviorSubject<number>(0);
  private recordingStartTime: number = 0;
  private durationInterval: any;

  constructor() {}

  // Start recording
  async startRecording(stream: MediaStream, options: RecordingOptions = {}): Promise<void> {
    try {
      // Default options
      const defaultOptions: RecordingOptions = {
        videoBitsPerSecond: 2500000, // 2.5 Mbps
        audioBitsPerSecond: 128000,  // 128 kbps
        mimeType: 'video/webm;codecs=vp9,opus'
      };

      const recordingOptions = { ...defaultOptions, ...options };

      // Check if the browser supports the specified MIME type
      if (!MediaRecorder.isTypeSupported(recordingOptions.mimeType!)) {
        // Fallback to a more widely supported format
        recordingOptions.mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(recordingOptions.mimeType)) {
          recordingOptions.mimeType = 'video/mp4';
        }
      }

      this.mediaRecorder = new MediaRecorder(stream, recordingOptions);
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.isRecording$.next(false);
        this.stopDurationTimer();
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        this.isRecording$.next(false);
        this.stopDurationTimer();
      };

      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording$.next(true);
      this.startDurationTimer();

    } catch (error) {
      console.error('Failed to start recording:', error);
      throw new Error('Failed to start recording. Please check your browser permissions.');
    }
  }

  // Stop recording
  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        reject(new Error('No active recording to stop'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder?.mimeType || 'video/webm'
        });
        this.isRecording$.next(false);
        this.stopDurationTimer();
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  // Pause recording
  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.stopDurationTimer();
    }
  }

  // Resume recording
  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.startDurationTimer();
    }
  }

  // Get recording status
  isRecording(): Observable<boolean> {
    return this.isRecording$.asObservable();
  }

  // Get recording duration
  getRecordingDuration(): Observable<number> {
    return this.recordingDuration$.asObservable();
  }

  // Get current recording state
  getRecordingState(): string {
    return this.mediaRecorder?.state || 'inactive';
  }

  // Download recording
  downloadRecording(blob: Blob, filename: string = 'consultation-recording.webm'): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Convert blob to base64 for upload
  blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Format duration for display
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }

  // Private methods
  private startDurationTimer(): void {
    this.recordingStartTime = Date.now();
    this.durationInterval = setInterval(() => {
      const elapsed = (Date.now() - this.recordingStartTime) / 1000;
      this.recordingDuration$.next(elapsed);
    }, 1000);
  }

  private stopDurationTimer(): void {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
    this.recordingDuration$.next(0);
  }

  // Cleanup
  cleanup(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.stopDurationTimer();
    this.recordedChunks = [];
    this.isRecording$.next(false);
  }
}
