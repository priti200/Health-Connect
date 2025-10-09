import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WebRTCPeer {
  userId: number;
  userRole: string;
  peerId: string;
  connection?: RTCPeerConnection;
  stream?: MediaStream;
  screenSharing?: boolean;
}

export interface WebRTCMessage {
  type: 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE' | 'USER_JOINED' | 'USER_LEFT' | 'EXISTING_PEER' | 'SCREEN_SHARE_START' | 'SCREEN_SHARE_STOP' | 'SESSION_END';
  fromPeerId?: string;
  toPeerId?: string;
  data?: any;
}

export interface WebRTCSignal {
  type: 'OFFER' | 'ANSWER' | 'ICE_CANDIDATE' | 'SCREEN_SHARE_START' | 'SCREEN_SHARE_STOP';
  targetPeerId?: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class WebRTCService {
  private localStream$ = new BehaviorSubject<MediaStream | null>(null);
  private remoteStreams$ = new BehaviorSubject<Map<string, MediaStream>>(new Map());
  private peers$ = new BehaviorSubject<Map<string, WebRTCPeer>>(new Map());
  private connectionStatus$ = new BehaviorSubject<string>('disconnected');
  private screenShareStream$ = new BehaviorSubject<MediaStream | null>(null);
  private isScreenSharing$ = new BehaviorSubject<boolean>(false);
  
  private localPeerId: string = '';
  private localUserId: number = 0;
  private roomId: string = '';
  private stompClient: any;
  private configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Subjects for events
  private participantJoined$ = new Subject<any>();
  private participantLeft$ = new Subject<any>();
  private connectionStateChange$ = new Subject<string>();
  private remoteStream$ = new Subject<MediaStream>();
  private networkQuality$ = new Subject<string>();

  constructor() {}

  // Initialize WebRTC for a room
  async initializeWebRTC(roomId: string, userId: number, userRole: string, stompClient: any): Promise<void> {
    console.log('Initializing WebRTC for room:', roomId, 'user:', userId, 'role:', userRole);

    this.roomId = roomId;
    this.localUserId = userId;
    this.localPeerId = `peer_${userId}_${Date.now()}`;
    this.stompClient = stompClient;

    // First get user media
    await this.getUserMedia();
    console.log('Local media obtained successfully');

    // Then subscribe to WebRTC messages
    this.subscribeToWebRTCMessages();
    console.log('Subscribed to WebRTC messages');

    this.connectionStatus$.next('connecting');
  }

  // Get user media (camera and microphone)
  async getUserMedia(constraints: MediaStreamConstraints = { video: true, audio: true }): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream$.next(stream);
      this.connectionStatus$.next('connected');
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      this.connectionStatus$.next('error');
      throw error;
    }
  }

  // Start screen sharing
  async startScreenShare(): Promise<void> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      this.screenShareStream$.next(screenStream);
      this.isScreenSharing$.next(true);
      
      // Replace video track in all peer connections
      const peers = this.peers$.value;
      const videoTrack = screenStream.getVideoTracks()[0];
      
      for (const [peerId, peer] of peers) {
        if (peer.connection) {
          const sender = peer.connection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        }
      }
      
      // Send screen share start signal
      this.sendWebRTCSignal({
        type: 'SCREEN_SHARE_START'
      });
      
      // Handle screen share end
      videoTrack.onended = () => {
        this.stopScreenShare();
      };
      
    } catch (error) {
      console.error('Error starting screen share:', error);
      throw error;
    }
  }

  // Stop screen sharing
  async stopScreenShare(): Promise<void> {
    const screenStream = this.screenShareStream$.value;
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      this.screenShareStream$.next(null);
      this.isScreenSharing$.next(false);
      
      // Replace back to camera stream
      const localStream = this.localStream$.value;
      if (localStream) {
        const peers = this.peers$.value;
        const videoTrack = localStream.getVideoTracks()[0];
        
        for (const [peerId, peer] of peers) {
          if (peer.connection) {
            const sender = peer.connection.getSenders().find(s => 
              s.track && s.track.kind === 'video'
            );
            if (sender && videoTrack) {
              await sender.replaceTrack(videoTrack);
            }
          }
        }
      }
      
      // Send screen share stop signal
      this.sendWebRTCSignal({
        type: 'SCREEN_SHARE_STOP'
      });
    }
  }

  // Create peer connection
  private createPeerConnection(peerId: string): RTCPeerConnection {
    const connection = new RTCPeerConnection(this.configuration);
    
    // Add local stream tracks
    const localStream = this.localStream$.value;
    if (localStream) {
      localStream.getTracks().forEach(track => {
        connection.addTrack(track, localStream);
      });
    }
    
    // Handle remote stream
    connection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      const remoteStreams = this.remoteStreams$.value;
      remoteStreams.set(peerId, remoteStream);
      this.remoteStreams$.next(new Map(remoteStreams));

      // Emit remote stream event
      this.remoteStream$.next(remoteStream);
    };
    
    // Handle ICE candidates
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendWebRTCSignal({
          type: 'ICE_CANDIDATE',
          targetPeerId: peerId,
          data: event.candidate
        });
      }
    };
    
    // Handle connection state changes
    connection.onconnectionstatechange = () => {
      console.log(`Connection state with ${peerId}:`, connection.connectionState);
    };
    
    return connection;
  }

  // Create and send offer
  async createOffer(targetPeerId: string): Promise<void> {
    const peers = this.peers$.value;
    let peer = peers.get(targetPeerId);
    
    if (!peer) {
      peer = {
        userId: 0, // Will be set when we receive peer info
        userRole: '',
        peerId: targetPeerId,
        connection: this.createPeerConnection(targetPeerId)
      };
      peers.set(targetPeerId, peer);
      this.peers$.next(new Map(peers));
    }
    
    if (peer.connection) {
      const offer = await peer.connection.createOffer();
      await peer.connection.setLocalDescription(offer);
      
      this.sendWebRTCSignal({
        type: 'OFFER',
        targetPeerId: targetPeerId,
        data: offer
      });
    }
  }

  // Handle received offer
  async handleOffer(fromPeerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    const peers = this.peers$.value;
    let peer = peers.get(fromPeerId);
    
    if (!peer) {
      peer = {
        userId: 0,
        userRole: '',
        peerId: fromPeerId,
        connection: this.createPeerConnection(fromPeerId)
      };
      peers.set(fromPeerId, peer);
      this.peers$.next(new Map(peers));
    }
    
    if (peer.connection) {
      await peer.connection.setRemoteDescription(offer);
      const answer = await peer.connection.createAnswer();
      await peer.connection.setLocalDescription(answer);
      
      this.sendWebRTCSignal({
        type: 'ANSWER',
        targetPeerId: fromPeerId,
        data: answer
      });
    }
  }

  // Handle received answer
  async handleAnswer(fromPeerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const peers = this.peers$.value;
    const peer = peers.get(fromPeerId);
    
    if (peer && peer.connection) {
      await peer.connection.setRemoteDescription(answer);
    }
  }

  // Handle received ICE candidate
  async handleIceCandidate(fromPeerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const peers = this.peers$.value;
    const peer = peers.get(fromPeerId);
    
    if (peer && peer.connection) {
      await peer.connection.addIceCandidate(candidate);
    }
  }

  // Send WebRTC signal through WebSocket
  private sendWebRTCSignal(signal: WebRTCSignal): void {
    if (this.stompClient && this.stompClient.connected) {
      const message = {
        ...signal,
        fromPeerId: this.localPeerId,
        roomId: this.roomId,
        userId: this.localUserId
      };
      console.log('Sending WebRTC signal:', message);
      this.stompClient.send(`/app/webrtc/${this.roomId}/signal`, {}, JSON.stringify(message));
    } else {
      console.error('Cannot send WebRTC signal - STOMP client not connected');
    }
  }

  // Subscribe to WebRTC messages
  private subscribeToWebRTCMessages(): void {
    if (this.stompClient && this.stompClient.connected) {
      console.log('Subscribing to WebRTC topic:', `/topic/webrtc/${this.roomId}`);
      this.stompClient.subscribe(`/topic/webrtc/${this.roomId}`, (message: any) => {
        const webrtcMessage: WebRTCMessage = JSON.parse(message.body);
        console.log('Received WebRTC message:', webrtcMessage);
        this.handleWebRTCMessage(webrtcMessage);
      });
    }
  }

  // Handle incoming WebRTC messages
  private async handleWebRTCMessage(message: any): Promise<void> {
    console.log('Handling WebRTC message:', message.type, message);

    switch (message.type) {
      case 'OFFER':
        if (message.fromPeerId && message.data) {
          await this.handleOffer(message.fromPeerId, message.data);
        }
        break;
      case 'ANSWER':
        if (message.fromPeerId && message.data) {
          await this.handleAnswer(message.fromPeerId, message.data);
        }
        break;
      case 'ICE_CANDIDATE':
        if (message.fromPeerId && message.data) {
          await this.handleIceCandidate(message.fromPeerId, message.data);
        }
        break;
      case 'USER_JOINED':
        // Handle user joined - create offer if we're not the one who joined
        if (message.fromPeerId && message.fromPeerId !== this.localPeerId) {
          console.log('Creating offer for new user:', message.fromPeerId);
          await this.createOffer(message.fromPeerId);

          // Emit participant joined event
          this.participantJoined$.next({
            peerId: message.fromPeerId,
            userId: message.data?.userId || 0,
            userRole: message.data?.userRole || 'participant'
          });
        }
        break;
      case 'USER_LEFT':
        if (message.fromPeerId) {
          this.removePeer(message.fromPeerId);
          this.participantLeft$.next(message.fromPeerId);
        }
        break;
      case 'EXISTING_PEER':
        // Handle existing peer in room - they should create offer to us
        console.log('Existing peer in room:', message.fromPeerId);
        break;
      case 'SCREEN_SHARE_START':
        // Handle remote screen share start
        console.log('Remote user started screen sharing');
        break;
      case 'SCREEN_SHARE_STOP':
        // Handle remote screen share stop
        console.log('Remote user stopped screen sharing');
        break;
      case 'SESSION_END':
        this.endSession();
        break;
      default:
        console.log('Unknown WebRTC message type:', message.type);
    }
  }

  // Remove peer
  private removePeer(peerId: string): void {
    const peers = this.peers$.value;
    const peer = peers.get(peerId);
    
    if (peer && peer.connection) {
      peer.connection.close();
    }
    
    peers.delete(peerId);
    this.peers$.next(new Map(peers));
    
    const remoteStreams = this.remoteStreams$.value;
    remoteStreams.delete(peerId);
    this.remoteStreams$.next(new Map(remoteStreams));
  }

  // End session
  endSession(): void {
    // Close all peer connections
    const peers = this.peers$.value;
    for (const [peerId, peer] of peers) {
      if (peer.connection) {
        peer.connection.close();
      }
    }
    
    // Stop local streams
    const localStream = this.localStream$.value;
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    const screenStream = this.screenShareStream$.value;
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }
    
    // Reset state
    this.localStream$.next(null);
    this.remoteStreams$.next(new Map());
    this.peers$.next(new Map());
    this.screenShareStream$.next(null);
    this.isScreenSharing$.next(false);
    this.connectionStatus$.next('disconnected');
  }

  // Observables
  getLocalStream(): Observable<MediaStream | null> {
    return this.localStream$.asObservable();
  }

  getRemoteStreams(): Observable<Map<string, MediaStream>> {
    return this.remoteStreams$.asObservable();
  }

  getPeers(): Observable<Map<string, WebRTCPeer>> {
    return this.peers$.asObservable();
  }

  getConnectionStatus(): Observable<string> {
    return this.connectionStatus$.asObservable();
  }

  getScreenShareStream(): Observable<MediaStream | null> {
    return this.screenShareStream$.asObservable();
  }

  getIsScreenSharing(): Observable<boolean> {
    return this.isScreenSharing$.asObservable();
  }

  // Utility methods

  isAudioEnabled(): boolean {
    const localStream = this.localStream$.value;
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      return audioTrack ? audioTrack.enabled : false;
    }
    return false;
  }

  isVideoEnabled(): boolean {
    const localStream = this.localStream$.value;
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      return videoTrack ? videoTrack.enabled : false;
    }
    return false;
  }

  // Methods expected by consultation room component
  async initializeLocalMedia(): Promise<void> {
    await this.getUserMedia();
  }

  async joinRoom(roomId: string, userId: number, userRole: string = 'participant'): Promise<void> {
    console.log('Joining room:', roomId, 'as user:', userId, 'role:', userRole);

    this.roomId = roomId;
    this.localUserId = userId;
    this.localPeerId = `peer_${userId}_${Date.now()}`;
    this.connectionStatus$.next('connecting');

    // Send join room message through WebSocket
    if (this.stompClient && this.stompClient.connected) {
      const joinMessage = {
        userRole: userRole,
        peerId: this.localPeerId,
        userId: userId
      };

      console.log('Sending join message:', joinMessage);
      this.stompClient.send(`/app/webrtc/${roomId}/join`, {}, JSON.stringify(joinMessage));

      this.connectionStatus$.next('connected');
      this.connectionStateChange$.next('connected');

      // Emit participant joined event
      this.participantJoined$.next({
        peerId: this.localPeerId,
        userId: userId,
        userRole: userRole
      });
    } else {
      console.error('STOMP client not connected when trying to join room');
      this.connectionStatus$.next('error');
    }
  }

  leaveRoom(): void {
    // Send leave room message
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.send(`/app/webrtc/${this.roomId}/leave`, {}, '{}');
    }
    this.endSession();
  }

  getLocalStreamValue(): MediaStream | null {
    return this.localStream$.value;
  }

  toggleVideo(enabled: boolean): void {
    const localStream = this.localStream$.value;
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enabled;
      }
    }
  }

  toggleAudio(enabled: boolean): void {
    const localStream = this.localStream$.value;
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
      }
    }
  }

  // Event observables
  onRemoteStream(): Observable<MediaStream> {
    return this.remoteStream$.asObservable();
  }

  onConnectionStateChange(): Observable<string> {
    return this.connectionStateChange$.asObservable();
  }

  onParticipantJoined(): Observable<any> {
    return this.participantJoined$.asObservable();
  }

  onParticipantLeft(): Observable<any> {
    return this.participantLeft$.asObservable();
  }

  onNetworkQuality(): Observable<string> {
    return this.networkQuality$.asObservable();
  }

  // Network quality monitoring
  private monitorNetworkQuality(): void {
    // Monitor connection quality every 5 seconds
    setInterval(() => {
      const peers = this.peers$.value;
      for (const [peerId, peer] of peers) {
        if (peer.connection) {
          peer.connection.getStats().then(stats => {
            stats.forEach(report => {
              if (report.type === 'inbound-rtp' && report.kind === 'video') {
                const packetsLost = report.packetsLost || 0;
                const packetsReceived = report.packetsReceived || 0;
                const lossRate = packetsLost / (packetsLost + packetsReceived);

                let quality = 'excellent';
                if (lossRate > 0.05) quality = 'poor';
                else if (lossRate > 0.02) quality = 'fair';
                else if (lossRate > 0.01) quality = 'good';

                this.networkQuality$.next(quality);
              }
            });
          }).catch(error => {
            console.warn('Failed to get connection stats:', error);
          });
        }
      }
    }, 5000);
  }
}
