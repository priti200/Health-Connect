import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
  UID
} from 'agora-rtc-sdk-ng';

export interface AgoraCallState {
  isConnected: boolean;
  isConnecting: boolean;
  localVideoEnabled: boolean;
  localAudioEnabled: boolean;
  remoteUsers: UID[];
  error: string | null;
}

export interface AgoraTokenResponse {
  token: string;
  appId: string;
  channelName: string;
  uid: string;
  status: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AgoraVideoService {
  private readonly APP_ID = environment.agora.appId;

  private client: IAgoraRTCClient | null = null;
  private localVideoTrack: ICameraVideoTrack | null = null;
  private localAudioTrack: IMicrophoneAudioTrack | null = null;

  // State management
  private callStateSubject = new BehaviorSubject<AgoraCallState>({
    isConnected: false,
    isConnecting: false,
    localVideoEnabled: true,
    localAudioEnabled: true,
    remoteUsers: [],
    error: null
  });

  private localVideoTrackSubject = new BehaviorSubject<ICameraVideoTrack | null>(null);
  private remoteVideoTracksSubject = new BehaviorSubject<Map<UID, IRemoteVideoTrack>>(new Map());

  // Public observables
  public callState$ = this.callStateSubject.asObservable();
  public localVideoTrack$ = this.localVideoTrackSubject.asObservable();
  public remoteVideoTracks$ = this.remoteVideoTracksSubject.asObservable();

  constructor(private http: HttpClient) {
    // Initialize Agora client
    this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    this.setupClientEventHandlers();
  }

  /**
   * Join a video call room
   */
  async joinRoom(roomId: string, userId: string): Promise<void> {
    try {
      this.updateCallState({ isConnecting: true, error: null });

      if (!this.client) {
        throw new Error('Agora client not initialized');
      }

      // Get token from backend
      const tokenResponse = await this.getAgoraToken(roomId, parseInt(userId));

      if (tokenResponse.status !== 'success') {
        throw new Error(`Failed to get token: ${tokenResponse.message}`);
      }

      // Join the channel with token (null for demo mode)
      const token = (tokenResponse.token === 'null' || tokenResponse.token === '') ? null : tokenResponse.token;
      await this.client.join(tokenResponse.appId, roomId, token, parseInt(userId));

      // Create and publish local tracks
      await this.createAndPublishLocalTracks();

      this.updateCallState({
        isConnected: true,
        isConnecting: false
      });

      console.log('Successfully joined Agora room:', roomId);

    } catch (error) {
      console.error('Failed to join room:', error);
      this.updateCallState({
        isConnecting: false,
        error: 'Failed to join video call. Please try again.'
      });
      throw error;
    }
  }

  /**
   * Leave the video call
   */
  async leaveRoom(): Promise<void> {
    try {
      // Stop and close local tracks
      if (this.localVideoTrack) {
        this.localVideoTrack.stop();
        this.localVideoTrack.close();
        this.localVideoTrack = null;
      }

      if (this.localAudioTrack) {
        this.localAudioTrack.stop();
        this.localAudioTrack.close();
        this.localAudioTrack = null;
      }

      // Leave the channel
      if (this.client) {
        await this.client.leave();
      }

      // Reset state
      this.updateCallState({
        isConnected: false,
        isConnecting: false,
        remoteUsers: [],
        error: null
      });

      this.localVideoTrackSubject.next(null);
      this.remoteVideoTracksSubject.next(new Map());

      console.log('Left Agora room successfully');

    } catch (error) {
      console.error('Error leaving room:', error);
    }
  }

  /**
   * Toggle local video on/off
   */
  async toggleVideo(): Promise<void> {
    if (!this.localVideoTrack) return;

    const currentState = this.callStateSubject.value;
    const newVideoState = !currentState.localVideoEnabled;

    await this.localVideoTrack.setEnabled(newVideoState);
    this.updateCallState({ localVideoEnabled: newVideoState });
  }

  /**
   * Toggle local audio on/off
   */
  async toggleAudio(): Promise<void> {
    if (!this.localAudioTrack) return;

    const currentState = this.callStateSubject.value;
    const newAudioState = !currentState.localAudioEnabled;

    await this.localAudioTrack.setEnabled(newAudioState);
    this.updateCallState({ localAudioEnabled: newAudioState });
  }

  /**
   * Get local video track for displaying in UI
   */
  getLocalVideoTrack(): ICameraVideoTrack | null {
    return this.localVideoTrack;
  }

  /**
   * Get remote video track for a specific user
   */
  getRemoteVideoTrack(userId: UID): IRemoteVideoTrack | null {
    const remoteTracks = this.remoteVideoTracksSubject.value;
    return remoteTracks.get(userId) || null;
  }

  private async createAndPublishLocalTracks(): Promise<void> {
    try {
      console.log('Creating local audio and video tracks...');

      // Check for camera and microphone permissions first
      try {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        console.log('Camera and microphone permissions granted');
      } catch (permissionError) {
        console.error('Camera/microphone permission denied:', permissionError);
        throw new Error('Please allow camera and microphone access to join the video call');
      }

      // Create local video and audio tracks separately to avoid TypeScript issues
      try {
        this.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack({
          encoderConfig: "music_standard",
        });
        console.log('Audio track created successfully');
      } catch (audioError) {
        console.error('Failed to create audio track:', audioError);
        throw new Error('Failed to access microphone. Please check your device settings.');
      }

      try {
        this.localVideoTrack = await AgoraRTC.createCameraVideoTrack({
          encoderConfig: "480p_1",
        });
        console.log('Video track created successfully');
      } catch (videoError) {
        console.error('Failed to create video track:', videoError);
        // Clean up audio track if video fails
        if (this.localAudioTrack) {
          this.localAudioTrack.close();
          this.localAudioTrack = null;
        }
        throw new Error('Failed to access camera. Please check if it is being used by another application.');
      }

      console.log('Local tracks created successfully');

      // Publish tracks to the channel
      if (this.client && this.localAudioTrack && this.localVideoTrack) {
        await this.client.publish([this.localAudioTrack, this.localVideoTrack]);
        console.log('Local tracks published to channel');
      }

      // Emit local video track
      this.localVideoTrackSubject.next(this.localVideoTrack);

      console.log('Local tracks created and published successfully');

    } catch (error) {
      console.error('Failed to create local tracks:', error);

      // Provide specific error messages
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        if (error.message.includes('permission') || error.message.includes('Permission')) {
          throw new Error('Camera and microphone access denied. Please allow permissions and try again.');
        } else if (error.message.includes('NotFoundError')) {
          throw new Error('Camera or microphone not found. Please check your devices.');
        } else if (error.message.includes('NotAllowedError')) {
          throw new Error('Camera and microphone access blocked. Please allow permissions in your browser.');
        }
      } else {
        console.error('Unknown error object:', JSON.stringify(error));
      }

      throw new Error('Failed to access camera and microphone. Please check your devices and permissions.');
    }
  }

  private setupClientEventHandlers(): void {
    if (!this.client) return;

    // Handle remote user joined
    this.client.on('user-published', async (user, mediaType) => {
      console.log('Remote user published:', user.uid, mediaType);

      // Subscribe to the remote user
      await this.client!.subscribe(user, mediaType);

      if (mediaType === 'video') {
        const remoteVideoTrack = user.videoTrack as IRemoteVideoTrack;
        const currentTracks = this.remoteVideoTracksSubject.value;
        currentTracks.set(user.uid, remoteVideoTrack);
        this.remoteVideoTracksSubject.next(new Map(currentTracks));
      }

      // Update remote users list
      const currentState = this.callStateSubject.value;
      const updatedUsers = [...currentState.remoteUsers];
      if (!updatedUsers.includes(user.uid)) {
        updatedUsers.push(user.uid);
        this.updateCallState({ remoteUsers: updatedUsers });
      }
    });

    // Handle remote user left
    this.client.on('user-left', (user) => {
      console.log('Remote user left:', user.uid);

      // Remove from remote video tracks
      const currentTracks = this.remoteVideoTracksSubject.value;
      currentTracks.delete(user.uid);
      this.remoteVideoTracksSubject.next(new Map(currentTracks));

      // Update remote users list
      const currentState = this.callStateSubject.value;
      const updatedUsers = currentState.remoteUsers.filter(uid => uid !== user.uid);
      this.updateCallState({ remoteUsers: updatedUsers });
    });

    // Handle connection state changes
    this.client.on('connection-state-change', (curState, revState) => {
      console.log('Connection state changed:', curState, revState);

      if (curState === 'DISCONNECTED') {
        this.updateCallState({
          isConnected: false,
          error: 'Connection lost. Please try rejoining the call.'
        });
      }
    });
  }

  private updateCallState(updates: Partial<AgoraCallState>): void {
    const currentState = this.callStateSubject.value;
    this.callStateSubject.next({ ...currentState, ...updates });
  }

  /**
   * Get Agora token from backend
   */
  private async getAgoraToken(channelName: string, uid: number): Promise<AgoraTokenResponse> {
    try {
      const response = await this.http.post<AgoraTokenResponse>(
        `${environment.apiUrl}/agora/token`,
        {
          channelName,
          uid: uid,
          expireTimeInSeconds: 3600
        }
      ).toPromise();

      if (!response) {
        throw new Error('No response from token service');
      }

      return response;
    } catch (error) {
      console.warn('Backend not available, using demo mode:', error);

      // Fallback to demo mode when backend is not available
      return {
        token: '', // empty token works for Agora demo mode
        appId: environment.agora.appId,
        channelName: channelName,
        uid: uid.toString(),
        status: 'success',
        message: 'Using demo mode - no token required'
      };
    }
  }
}
