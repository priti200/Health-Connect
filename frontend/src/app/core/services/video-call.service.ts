import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { ChatService } from './chat.service';
import * as SimplePeer from 'simple-peer';
import { environment } from '../../../environments/environment';

export interface CallState {
  isInCall: boolean;
  isConnecting: boolean;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  callDuration: number;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  participants: CallParticipant[];
}

export interface CallParticipant {
  userId: number;
  name: string;
  role: 'DOCTOR' | 'PATIENT';
  peerId: string;
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  stream?: MediaStream;
}

export interface CallRecording {
  isRecording: boolean;
  recordingData?: Blob;
  startTime?: Date;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class VideoCallService {
  private readonly API_URL = environment.apiUrl;
  
  // State management
  private callState$ = new BehaviorSubject<CallState>({
    isInCall: false,
    isConnecting: false,
    isAudioMuted: false,
    isVideoMuted: false,
    isScreenSharing: false,
    callDuration: 0,
    connectionQuality: 'excellent',
    participants: []
  });

  private localStream$ = new BehaviorSubject<MediaStream | null>(null);
  private remoteStreams$ = new BehaviorSubject<Map<string, MediaStream>>(new Map());
  private recording$ = new BehaviorSubject<CallRecording>({ isRecording: false });

  // WebRTC and recording
  private peers: Map<string, SimplePeer.Instance> = new Map();
  private localStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private callStartTime: Date | null = null;
  private callTimer: any;

  // Events
  private callEnded$ = new Subject<void>();
  private participantJoined$ = new Subject<CallParticipant>();
  private participantLeft$ = new Subject<string>();
  private connectionError$ = new Subject<string>();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private chatService: ChatService
  ) {}

  // Getters for observables
  getCallState(): Observable<CallState> {
    return this.callState$.asObservable();
  }

  getLocalStream(): Observable<MediaStream | null> {
    return this.localStream$.asObservable();
  }

  getRemoteStreams(): Observable<Map<string, MediaStream>> {
    return this.remoteStreams$.asObservable();
  }

  getRecordingState(): Observable<CallRecording> {
    return this.recording$.asObservable();
  }

  getCallEndedEvent(): Observable<void> {
    return this.callEnded$.asObservable();
  }

  getParticipantJoinedEvent(): Observable<CallParticipant> {
    return this.participantJoined$.asObservable();
  }

  getParticipantLeftEvent(): Observable<string> {
    return this.participantLeft$.asObservable();
  }

  getConnectionErrorEvent(): Observable<string> {
    return this.connectionError$.asObservable();
  }

  // Initialize video call
  async initializeCall(roomId: string, consultationId: number): Promise<void> {
    try {
      this.updateCallState({ isConnecting: true });
      
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: { echoCancellation: true, noiseSuppression: true }
      });
      
      this.localStream$.next(this.localStream);
      
      // Join WebRTC room via WebSocket
      await this.joinWebRTCRoom(roomId);
      
      // Start call timer
      this.startCallTimer();
      
      this.updateCallState({ 
        isInCall: true, 
        isConnecting: false 
      });
      
    } catch (error) {
      console.error('Failed to initialize call:', error);
      this.connectionError$.next('Failed to initialize video call');
      this.updateCallState({ isConnecting: false });
      throw error;
    }
  }

  // Join WebRTC room
  private async joinWebRTCRoom(roomId: string): Promise<void> {
    const user = this.authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // TODO: Implement WebRTC room joining
    // Subscribe to WebRTC messages
    // this.chatService.subscribeToWebRTC(roomId, user.id, (message: any) => {
    //   this.handleWebRTCMessage(message);
    // });

    // Send join message
    // this.chatService.sendWebRTCMessage(roomId, {
    //   type: 'JOIN',
    //   userRole: user.role
    // });
  }

  // Handle WebRTC signaling messages
  private handleWebRTCMessage(message: any): void {
    switch (message.type) {
      case 'USER_JOINED':
        this.handleUserJoined(message);
        break;
      case 'USER_LEFT':
        this.handleUserLeft(message);
        break;
      case 'OFFER':
        this.handleOffer(message);
        break;
      case 'ANSWER':
        this.handleAnswer(message);
        break;
      case 'ICE_CANDIDATE':
        this.handleIceCandidate(message);
        break;
      case 'SCREEN_SHARE_START':
        this.handleScreenShareStart(message);
        break;
      case 'SCREEN_SHARE_STOP':
        this.handleScreenShareStop(message);
        break;
    }
  }

  // Create peer connection
  private createPeerConnection(peerId: string, initiator: boolean): any {
    // TODO: Fix SimplePeer import and implementation
    console.log('Creating peer connection for:', peerId);
    return null;

    // const peer = new SimplePeer({
    //   initiator,
    //   stream: this.localStream || undefined,
    //   config: {
    //     iceServers: [
    //       { urls: 'stun:stun.l.google.com:19302' },
    //       { urls: 'stun:stun1.l.google.com:19302' }
    //     ]
    //   }
    // });

    // peer.on('signal', (data: any) => {
    //   this.sendSignal(peerId, data);
    // });

    // peer.on('stream', (stream: any) => {
    //   this.handleRemoteStream(peerId, stream);
    // });

    // peer.on('error', (error: any) => {
    //   console.error('Peer connection error:', error);
    //   this.connectionError$.next(`Connection error with peer ${peerId}`);
    // });

    // peer.on('close', () => {
    //   this.handlePeerDisconnected(peerId);
    // });

    // this.peers.set(peerId, peer);
    // return peer;
  }

  // Send WebRTC signal
  private sendSignal(targetPeerId: string, data: any): void {
    // TODO: Implement WebRTC signaling
    console.log('Sending signal to:', targetPeerId, data);
    // this.chatService.sendWebRTCMessage(this.getCurrentRoomId(), {
    //   type: data.type || 'SIGNAL',
    //   targetPeerId,
    //   data
    // });
  }

  // Handle remote stream
  private handleRemoteStream(peerId: string, stream: MediaStream): void {
    const remoteStreams = this.remoteStreams$.value;
    remoteStreams.set(peerId, stream);
    this.remoteStreams$.next(new Map(remoteStreams));
  }

  // Toggle audio mute
  toggleAudio(): void {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.updateCallState({ isAudioMuted: !audioTrack.enabled });
      }
    }
  }

  // Toggle video mute
  toggleVideo(): void {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.updateCallState({ isVideoMuted: !videoTrack.enabled });
      }
    }
  }

  // Start screen sharing
  async startScreenShare(): Promise<void> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      // Replace video track in all peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      this.peers.forEach(peer => {
        // TODO: Fix peer connection access
        // const sender = peer._pc?.getSenders().find((s: any) =>
        //   s.track && s.track.kind === 'video'
        // );
        // if (sender) {
        //   sender.replaceTrack(videoTrack);
        // }
      });

      // Update local stream
      if (this.localStream) {
        const oldVideoTrack = this.localStream.getVideoTracks()[0];
        if (oldVideoTrack) {
          this.localStream.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        this.localStream.addTrack(videoTrack);
      }

      this.updateCallState({ isScreenSharing: true });

      // Handle screen share end
      videoTrack.onended = () => {
        this.stopScreenShare();
      };

    } catch (error) {
      console.error('Failed to start screen sharing:', error);
      this.connectionError$.next('Failed to start screen sharing');
    }
  }

  // Stop screen sharing
  async stopScreenShare(): Promise<void> {
    try {
      // Get camera stream again
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false
      });

      const videoTrack = cameraStream.getVideoTracks()[0];
      
      // Replace screen share track with camera track
      this.peers.forEach(peer => {
        // TODO: Fix peer connection access
        // const sender = peer._pc?.getSenders().find((s: any) =>
        //   s.track && s.track.kind === 'video'
        // );
        // if (sender) {
        //   sender.replaceTrack(videoTrack);
        // }
      });

      // Update local stream
      if (this.localStream) {
        const oldVideoTrack = this.localStream.getVideoTracks()[0];
        if (oldVideoTrack) {
          this.localStream.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        this.localStream.addTrack(videoTrack);
      }

      this.updateCallState({ isScreenSharing: false });

    } catch (error) {
      console.error('Failed to stop screen sharing:', error);
    }
  }

  // Start call recording
  startRecording(): void {
    if (!this.localStream) return;

    try {
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(this.localStream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const recordingBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
        this.recording$.next({
          isRecording: false,
          recordingData: recordingBlob,
          duration: this.getCallDuration()
        });
      };

      this.mediaRecorder.start(1000); // Record in 1-second chunks
      this.recording$.next({ 
        isRecording: true, 
        startTime: new Date() 
      });

    } catch (error) {
      console.error('Failed to start recording:', error);
      this.connectionError$.next('Failed to start recording');
    }
  }

  // Stop call recording
  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }

  // End call
  async endCall(): Promise<void> {
    try {
      // Stop recording if active
      if (this.recording$.value.isRecording) {
        this.stopRecording();
      }

      // Close all peer connections
      this.peers.forEach(peer => peer.destroy());
      this.peers.clear();

      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
        this.localStream$.next(null);
      }

      // Clear remote streams
      this.remoteStreams$.next(new Map());

      // Stop call timer
      if (this.callTimer) {
        clearInterval(this.callTimer);
        this.callTimer = null;
      }

      // Reset call state
      this.updateCallState({
        isInCall: false,
        isConnecting: false,
        isAudioMuted: false,
        isVideoMuted: false,
        isScreenSharing: false,
        callDuration: 0,
        participants: []
      });

      // Notify call ended
      this.callEnded$.next();

    } catch (error) {
      console.error('Failed to end call:', error);
    }
  }

  // Helper methods
  private updateCallState(updates: Partial<CallState>): void {
    const currentState = this.callState$.value;
    this.callState$.next({ ...currentState, ...updates });
  }

  private startCallTimer(): void {
    this.callStartTime = new Date();
    this.callTimer = setInterval(() => {
      const duration = this.getCallDuration();
      this.updateCallState({ callDuration: duration });
    }, 1000);
  }

  private getCallDuration(): number {
    if (!this.callStartTime) return 0;
    return Math.floor((Date.now() - this.callStartTime.getTime()) / 1000);
  }

  private getCurrentRoomId(): string {
    // This should be set when initializing the call
    return 'current-room-id'; // Placeholder
  }

  // Placeholder methods for handling WebRTC messages
  private handleUserJoined(message: any): void {
    // Implementation for handling user joined
  }

  private handleUserLeft(message: any): void {
    // Implementation for handling user left
  }

  private handleOffer(message: any): void {
    // Implementation for handling offer
  }

  private handleAnswer(message: any): void {
    // Implementation for handling answer
  }

  private handleIceCandidate(message: any): void {
    // Implementation for handling ICE candidate
  }

  private handleScreenShareStart(message: any): void {
    // Implementation for handling screen share start
  }

  private handleScreenShareStop(message: any): void {
    // Implementation for handling screen share stop
  }

  private handlePeerDisconnected(peerId: string): void {
    // Implementation for handling peer disconnection
  }
}
