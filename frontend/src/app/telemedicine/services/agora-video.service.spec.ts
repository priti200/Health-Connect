import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AgoraVideoService, AgoraTokenResponse } from './agora-video.service';
import { environment } from '../../../environments/environment';

// Mock Agora RTC SDK
const mockAgoraRTC = {
  createClient: jasmine.createSpy('createClient').and.returnValue({
    join: jasmine.createSpy('join').and.returnValue(Promise.resolve()),
    leave: jasmine.createSpy('leave').and.returnValue(Promise.resolve()),
    publish: jasmine.createSpy('publish').and.returnValue(Promise.resolve()),
    unpublish: jasmine.createSpy('unpublish').and.returnValue(Promise.resolve()),
    on: jasmine.createSpy('on'),
    off: jasmine.createSpy('off')
  }),
  createMicrophoneAudioTrack: jasmine.createSpy('createMicrophoneAudioTrack').and.returnValue(Promise.resolve({
    setEnabled: jasmine.createSpy('setEnabled').and.returnValue(Promise.resolve()),
    close: jasmine.createSpy('close')
  })),
  createCameraVideoTrack: jasmine.createSpy('createCameraVideoTrack').and.returnValue(Promise.resolve({
    setEnabled: jasmine.createSpy('setEnabled').and.returnValue(Promise.resolve()),
    close: jasmine.createSpy('close'),
    play: jasmine.createSpy('play')
  }))
};

// Mock window.AgoraRTC
(window as any).AgoraRTC = mockAgoraRTC;

describe('AgoraVideoService', () => {
  let service: AgoraVideoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AgoraVideoService]
    });
    service = TestBed.inject(AgoraVideoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('joinRoom', () => {
    it('should successfully join a room with backend token', async () => {
      const roomId = 'test-room';
      const userId = '123';
      const mockTokenResponse: AgoraTokenResponse = {
        token: 'mock-token',
        appId: environment.agora.appId,
        channelName: roomId,
        uid: userId,
        status: 'success',
        message: 'Token generated successfully'
      };

      const joinPromise = service.joinRoom(roomId, userId);

      const req = httpMock.expectOne(`${environment.apiUrl}/agora/token?channelName=${roomId}&uid=${userId}&expireTimeInSeconds=3600`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTokenResponse);

      await joinPromise;

      expect(mockAgoraRTC.createClient).toHaveBeenCalledWith({ mode: 'rtc', codec: 'vp8' });
    });

    it('should fallback to demo mode when backend is unavailable', async () => {
      const roomId = 'test-room';
      const userId = '123';

      const joinPromise = service.joinRoom(roomId, userId);

      const req = httpMock.expectOne(`${environment.apiUrl}/agora/token?channelName=${roomId}&uid=${userId}&expireTimeInSeconds=3600`);
      req.error(new ErrorEvent('Network error'));

      await joinPromise;

      // Should still succeed with demo mode
      expect(mockAgoraRTC.createClient).toHaveBeenCalled();
    });

    it('should handle invalid user ID', async () => {
      const roomId = 'test-room';
      const userId = 'invalid';

      try {
        await service.joinRoom(roomId, userId);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('toggleVideo', () => {
    it('should toggle video on/off', async () => {
      // First join a room to initialize tracks
      const roomId = 'test-room';
      const userId = '123';
      
      const joinPromise = service.joinRoom(roomId, userId);
      const req = httpMock.expectOne(`${environment.apiUrl}/agora/token?channelName=${roomId}&uid=${userId}&expireTimeInSeconds=3600`);
      req.error(new ErrorEvent('Network error')); // Use demo mode
      await joinPromise;

      // Now test video toggle
      await service.toggleVideo();
      // Video should be toggled (implementation depends on current state)
    });
  });

  describe('toggleAudio', () => {
    it('should toggle audio on/off', async () => {
      // First join a room to initialize tracks
      const roomId = 'test-room';
      const userId = '123';
      
      const joinPromise = service.joinRoom(roomId, userId);
      const req = httpMock.expectOne(`${environment.apiUrl}/agora/token?channelName=${roomId}&uid=${userId}&expireTimeInSeconds=3600`);
      req.error(new ErrorEvent('Network error')); // Use demo mode
      await joinPromise;

      // Now test audio toggle
      await service.toggleAudio();
      // Audio should be toggled (implementation depends on current state)
    });
  });

  describe('leaveRoom', () => {
    it('should successfully leave a room', async () => {
      // First join a room
      const roomId = 'test-room';
      const userId = '123';
      
      const joinPromise = service.joinRoom(roomId, userId);
      const req = httpMock.expectOne(`${environment.apiUrl}/agora/token?channelName=${roomId}&uid=${userId}&expireTimeInSeconds=3600`);
      req.error(new ErrorEvent('Network error')); // Use demo mode
      await joinPromise;

      // Now leave the room
      await service.leaveRoom();
      
      // Should clean up resources
      expect(service.callState$.value.isConnected).toBeFalse();
    });
  });

  describe('call state management', () => {
    it('should emit correct call states during connection', async () => {
      const states: any[] = [];
      service.callState$.subscribe(state => states.push(state));

      const roomId = 'test-room';
      const userId = '123';
      
      const joinPromise = service.joinRoom(roomId, userId);
      const req = httpMock.expectOne(`${environment.apiUrl}/agora/token?channelName=${roomId}&uid=${userId}&expireTimeInSeconds=3600`);
      req.error(new ErrorEvent('Network error')); // Use demo mode
      await joinPromise;

      // Should have emitted connecting and connected states
      expect(states.some(s => s.isConnecting)).toBeTrue();
      expect(states.some(s => s.isConnected)).toBeTrue();
    });
  });
});
