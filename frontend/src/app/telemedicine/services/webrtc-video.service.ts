import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

declare var SockJS: any;
declare var Stomp: any;

@Injectable({
  providedIn: 'root'
})
export class WebRTCVideoService {
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private stompClient: any = null;
  private roomId: string | null = null;
  private currentUser: any = null;
  
  // Observables for UI
  private connectionStatusSubject = new BehaviorSubject<string>('disconnected');
  private localStreamSubject = new BehaviorSubject<MediaStream | null>(null);
  private remoteStreamSubject = new BehaviorSubject<MediaStream | null>(null);
  private participantsSubject = new BehaviorSubject<any[]>([]);
  private isVideoEnabledSubject = new BehaviorSubject<boolean>(true);
  private isAudioEnabledSubject = new BehaviorSubject<boolean>(true);

  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  public localStream$ = this.localStreamSubject.asObservable();
  public remoteStream$ = this.remoteStreamSubject.asObservable();
  public participants$ = this.participantsSubject.asObservable();
  public isVideoEnabled$ = this.isVideoEnabledSubject.asObservable();
  public isAudioEnabled$ = this.isAudioEnabledSubject.asObservable();

  // WebRTC Configuration
  private rtcConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  constructor(private authService: AuthService) {
    this.currentUser = this.authService.getCurrentUser();
  }

  async joinRoom(roomId: string): Promise<void> {
    try {
      this.roomId = roomId;
      this.connectionStatusSubject.next('connecting');

      // Initialize WebSocket connection
      await this.initializeWebSocket();

      // Get user media
      await this.initializeLocalStream();

      // Initialize peer connection
      this.initializePeerConnection();

      // Join the room via WebSocket
      this.joinVideoRoom();

      this.connectionStatusSubject.next('connected');
      console.log('Successfully joined room:', roomId);

    } catch (error) {
      console.error('Failed to join room:', error);
      this.connectionStatusSubject.next('error');
      throw error;
    }
  }

  private async initializeWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const socket = new SockJS(environment.wsUrl);
        this.stompClient = Stomp.over(socket);

        // Get auth token
        const token = this.authService.getToken();
        if (!token) {
          reject(new Error('No authentication token found'));
          return;
        }

        this.stompClient.connect(
          { Authorization: `Bearer ${token}` },
          () => {
            console.log('WebSocket connected for video calling');
            
            // Subscribe to video room messages
            this.stompClient.subscribe(`/topic/video/${this.roomId}`, (message: any) => {
              this.handleVideoMessage(JSON.parse(message.body));
            });

            resolve();
          },
          (error: any) => {
            console.error('WebSocket connection failed:', error);
            reject(error);
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  private async initializeLocalStream(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.localStreamSubject.next(this.localStream);
      console.log('Local stream initialized');

    } catch (error) {
      console.error('Failed to get user media:', error);
      throw error;
    }
  }

  private initializePeerConnection(): void {
    this.peerConnection = new RTCPeerConnection(this.rtcConfiguration);

    // Add local stream to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('Received remote track:', event);
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        this.remoteStreamSubject.next(this.remoteStream);
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection!.connectionState);
      this.connectionStatusSubject.next(this.peerConnection!.connectionState);
    };
  }

  private joinVideoRoom(): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.send(`/app/video/${this.roomId}/join`, {
        Authorization: `Bearer ${this.authService.getToken()}`
      }, {});
    }
  }

  private async handleVideoMessage(message: any): Promise<void> {
    console.log('Received video message:', message);

    try {
      switch (message.type) {
        case 'user-joined':
          if (message.userId !== this.currentUser?.id) {
            console.log('🎉 Another user joined the call:', message.userEmail);

            // Update participants list
            const currentParticipants = this.participantsSubject.value;
            const newParticipant = {
              userId: message.userId,
              userEmail: message.userEmail,
              joinedAt: new Date()
            };
            this.participantsSubject.next([...currentParticipants, newParticipant]);

            // Create offer to establish connection
            await this.createOffer();
          }
          break;

        case 'offer':
          if (message.senderId !== this.currentUser?.id) {
            await this.handleOffer(message.offer);
          }
          break;

        case 'answer':
          if (message.senderId !== this.currentUser?.id) {
            await this.handleAnswer(message.answer);
          }
          break;

        case 'ice-candidate':
          if (message.senderId !== this.currentUser?.id) {
            await this.handleIceCandidate(message.candidate);
          }
          break;

        case 'user-left':
          this.handleUserLeft(message.userId);
          break;
      }
    } catch (error) {
      console.error('Error handling video message:', error);
    }
  }

  private async createOffer(): Promise<void> {
    if (!this.peerConnection) return;

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      this.sendSignal({
        type: 'offer',
        offer: offer
      });

      console.log('Offer created and sent');
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }

  private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(offer);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      this.sendSignal({
        type: 'answer',
        answer: answer
      });

      console.log('Offer handled, answer sent');
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(answer);
      console.log('Answer handled');
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.addIceCandidate(candidate);
      console.log('ICE candidate added');
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  private handleUserLeft(userId: number): void {
    console.log('User left:', userId);
    this.remoteStream = null;
    this.remoteStreamSubject.next(null);
  }

  private sendSignal(signal: any): void {
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.send(`/app/video/${this.roomId}/signal`, {
        Authorization: `Bearer ${this.authService.getToken()}`
      }, JSON.stringify(signal));
    }
  }

  toggleVideo(): void {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.isVideoEnabledSubject.next(videoTrack.enabled);
      }
    }
  }

  toggleAudio(): void {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.isAudioEnabledSubject.next(audioTrack.enabled);
      }
    }
  }

  leaveRoom(): void {
    // Send leave message
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.send(`/app/video/${this.roomId}/leave`, {
        Authorization: `Bearer ${this.authService.getToken()}`
      }, {});
    }

    // Clean up resources
    this.cleanup();
  }

  private cleanup(): void {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
      this.localStreamSubject.next(null);
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Disconnect WebSocket
    if (this.stompClient) {
      this.stompClient.disconnect();
      this.stompClient = null;
    }

    // Reset state
    this.remoteStream = null;
    this.remoteStreamSubject.next(null);
    this.connectionStatusSubject.next('disconnected');
    this.roomId = null;

    console.log('Video call cleanup completed');
  }
}
