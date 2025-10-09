import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SimpleVideoState {
  isConnected: boolean;
  isConnecting: boolean;
  localVideoEnabled: boolean;
  localAudioEnabled: boolean;
  hasRemoteUser: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class SimpleVideoService {
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  
  // State management
  private videoStateSubject = new BehaviorSubject<SimpleVideoState>({
    isConnected: false,
    isConnecting: false,
    localVideoEnabled: true,
    localAudioEnabled: true,
    hasRemoteUser: false,
    error: null
  });

  private localStreamSubject = new BehaviorSubject<MediaStream | null>(null);
  private remoteStreamSubject = new BehaviorSubject<MediaStream | null>(null);

  // Public observables
  public videoState$ = this.videoStateSubject.asObservable();
  public localStream$ = this.localStreamSubject.asObservable();
  public remoteStream$ = this.remoteStreamSubject.asObservable();

  constructor() {}

  /**
   * Initialize video call - gets user media and sets up local video
   */
  async initializeCall(roomId: string, userId: string): Promise<void> {
    try {
      this.updateVideoState({ isConnecting: true, error: null });

      // Get user media (camera and microphone)
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      // Emit local stream
      this.localStreamSubject.next(this.localStream);

      // Simulate connection success
      setTimeout(() => {
        this.updateVideoState({ 
          isConnected: true, 
          isConnecting: false 
        });

        // Simulate remote user joining after 2 seconds
        setTimeout(() => {
          this.simulateRemoteUser();
        }, 2000);
      }, 1000);

      console.log('Simple video call initialized successfully');

    } catch (error) {
      console.error('Failed to initialize video call:', error);
      this.updateVideoState({ 
        isConnecting: false, 
        error: 'Failed to access camera/microphone. Please check permissions.' 
      });
      throw error;
    }
  }

  /**
   * End the video call
   */
  async endCall(): Promise<void> {
    try {
      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      // Stop remote stream
      if (this.remoteStream) {
        this.remoteStream.getTracks().forEach(track => track.stop());
        this.remoteStream = null;
      }

      // Reset state
      this.updateVideoState({
        isConnected: false,
        isConnecting: false,
        hasRemoteUser: false,
        error: null
      });

      this.localStreamSubject.next(null);
      this.remoteStreamSubject.next(null);

      console.log('Video call ended successfully');

    } catch (error) {
      console.error('Error ending video call:', error);
    }
  }

  /**
   * Toggle local video on/off
   */
  async toggleVideo(): Promise<void> {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      const currentState = this.videoStateSubject.value;
      const newVideoState = !currentState.localVideoEnabled;
      
      videoTrack.enabled = newVideoState;
      this.updateVideoState({ localVideoEnabled: newVideoState });
      
      console.log('Video toggled:', newVideoState ? 'ON' : 'OFF');
    }
  }

  /**
   * Toggle local audio on/off
   */
  async toggleAudio(): Promise<void> {
    if (!this.localStream) return;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      const currentState = this.videoStateSubject.value;
      const newAudioState = !currentState.localAudioEnabled;
      
      audioTrack.enabled = newAudioState;
      this.updateVideoState({ localAudioEnabled: newAudioState });
      
      console.log('Audio toggled:', newAudioState ? 'ON' : 'OFF');
    }
  }

  /**
   * Get current local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get current remote stream
   */
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /**
   * Simulate a remote user joining (for demo purposes)
   */
  private simulateRemoteUser(): void {
    // Create a canvas to simulate remote video
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Draw animated background
      let frame = 0;
      const animate = () => {
        // Clear canvas
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, 640, 480);

        // Draw animated circles
        const time = frame * 0.05;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(
            320 + Math.sin(time + i) * 100,
            240 + Math.cos(time + i * 0.7) * 80,
            20 + Math.sin(time * 2 + i) * 10,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = `hsl(${(time * 50 + i * 60) % 360}, 70%, 60%)`;
          ctx.fill();
        }

        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Remote Participant', 320, 200);
        ctx.font = '16px Arial';
        ctx.fillText('(Simulated Video Feed)', 320, 230);
        ctx.fillText('Video calling is working!', 320, 260);

        frame++;
        requestAnimationFrame(animate);
      };

      animate();

      // Convert canvas to video stream
      this.remoteStream = canvas.captureStream(30);
      this.remoteStreamSubject.next(this.remoteStream);
      
      this.updateVideoState({ hasRemoteUser: true });
      
      console.log('Simulated remote user joined');
    }
  }

  private updateVideoState(updates: Partial<SimpleVideoState>): void {
    const currentState = this.videoStateSubject.value;
    this.videoStateSubject.next({ ...currentState, ...updates });
  }
}
