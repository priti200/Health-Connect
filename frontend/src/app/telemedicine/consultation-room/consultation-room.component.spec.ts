import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { ConsultationRoomComponent } from './consultation-room.component';
import { VideoConsultationService } from '../../core/services/video-consultation.service';
import { AuthService } from '../../core/services/auth.service';
import { PresenceService } from '../../core/services/presence.service';
import { NotificationService } from '../../core/services/notification.service';
import { AgoraVideoService } from '../services/agora-video.service';

describe('ConsultationRoomComponent', () => {
  let component: ConsultationRoomComponent;
  let fixture: ComponentFixture<ConsultationRoomComponent>;
  let mockVideoConsultationService: jasmine.SpyObj<VideoConsultationService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockPresenceService: jasmine.SpyObj<PresenceService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockAgoraVideoService: jasmine.SpyObj<AgoraVideoService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockUser = {
    id: 1,
    email: 'doctor@test.com',
    fullName: 'Dr. Test',
    role: 'DOCTOR'
  };

  const mockConsultation = {
    id: 1,
    roomId: 'test-room-123',
    doctor: { id: 1, fullName: 'Dr. Test' },
    patient: { id: 2, fullName: 'Patient Test' },
    status: 'SCHEDULED',
    scheduledAt: new Date(),
    type: 'VIDEO'
  };

  beforeEach(async () => {
    const videoConsultationSpy = jasmine.createSpyObj('VideoConsultationService', 
      ['getConsultationByRoomId', 'endConsultation']);
    const authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    const presenceSpy = jasmine.createSpyObj('PresenceService', ['updatePresence']);
    const notificationSpy = jasmine.createSpyObj('NotificationService', ['addNotification']);
    const agoraVideoSpy = jasmine.createSpyObj('AgoraVideoService', 
      ['joinRoom', 'leaveRoom', 'toggleVideo', 'toggleAudio'], 
      {
        callState$: of({ isConnected: false, isConnecting: false, localVideoEnabled: true, localAudioEnabled: true, remoteUsers: [], error: null }),
        localVideoTrack$: of(null),
        remoteVideoTracks$: of(new Map())
      });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [ConsultationRoomComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: VideoConsultationService, useValue: videoConsultationSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: PresenceService, useValue: presenceSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: AgoraVideoService, useValue: agoraVideoSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ roomId: 'test-room-123' })
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConsultationRoomComponent);
    component = fixture.componentInstance;
    
    mockVideoConsultationService = TestBed.inject(VideoConsultationService) as jasmine.SpyObj<VideoConsultationService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockPresenceService = TestBed.inject(PresenceService) as jasmine.SpyObj<PresenceService>;
    mockNotificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    mockAgoraVideoService = TestBed.inject(AgoraVideoService) as jasmine.SpyObj<AgoraVideoService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default mocks
    mockAuthService.getCurrentUser.and.returnValue(mockUser);
    mockVideoConsultationService.getConsultationByRoomId.and.returnValue(of(mockConsultation));
    mockAgoraVideoService.joinRoom.and.returnValue(Promise.resolve());
    mockAgoraVideoService.leaveRoom.and.returnValue(Promise.resolve());
    mockAgoraVideoService.toggleVideo.and.returnValue(Promise.resolve());
    mockAgoraVideoService.toggleAudio.and.returnValue(Promise.resolve());
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize consultation on ngOnInit', async () => {
    await component.ngOnInit();
    
    expect(mockVideoConsultationService.getConsultationByRoomId).toHaveBeenCalledWith('test-room-123');
    expect(component.consultation).toEqual(mockConsultation);
    expect(component.roomId).toBe('test-room-123');
  });

  it('should handle consultation loading error', async () => {
    mockVideoConsultationService.getConsultationByRoomId.and.returnValue(
      throwError('Consultation not found')
    );

    await component.ngOnInit();
    
    expect(component.error).toContain('Failed to load consultation');
    expect(component.isConnecting).toBeFalse();
  });

  it('should check user authorization', () => {
    component.consultation = mockConsultation;
    component.currentUser = mockUser;
    
    expect(component['isAuthorizedUser']()).toBeTrue();
    
    // Test unauthorized user
    component.currentUser = { ...mockUser, id: 999 };
    expect(component['isAuthorizedUser']()).toBeFalse();
  });

  it('should initialize Agora video successfully', async () => {
    component.consultation = mockConsultation;
    component.roomId = 'test-room-123';
    component.currentUser = mockUser;

    await component['initializeAgoraVideo']();
    
    expect(mockPresenceService.updatePresence).toHaveBeenCalledWith('BUSY', 'In video consultation');
    expect(mockAgoraVideoService.joinRoom).toHaveBeenCalledWith('test-room-123', '1');
  });

  it('should handle video toggle', async () => {
    await component.toggleVideo();
    
    expect(mockAgoraVideoService.toggleVideo).toHaveBeenCalled();
  });

  it('should handle audio toggle', async () => {
    await component.toggleAudio();
    
    expect(mockAgoraVideoService.toggleAudio).toHaveBeenCalled();
  });

  it('should end consultation (doctor only)', async () => {
    component.consultation = mockConsultation;
    component.currentUser = mockUser; // Doctor
    spyOn(window, 'confirm').and.returnValue(true);
    mockVideoConsultationService.endConsultation.and.returnValue(of({}));

    await component.endConsultation();
    
    expect(mockAgoraVideoService.leaveRoom).toHaveBeenCalled();
    expect(mockVideoConsultationService.endConsultation).toHaveBeenCalled();
    expect(mockPresenceService.updatePresence).toHaveBeenCalledWith('ONLINE');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/telemedicine/consultations']);
  });

  it('should prevent non-doctor from ending consultation', async () => {
    component.currentUser = { ...mockUser, role: 'PATIENT' };
    
    await component.endConsultation();
    
    expect(mockVideoConsultationService.endConsultation).not.toHaveBeenCalled();
  });

  it('should leave consultation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    
    component.leaveConsultation();
    
    expect(mockAgoraVideoService.leaveRoom).toHaveBeenCalled();
    expect(mockPresenceService.updatePresence).toHaveBeenCalledWith('ONLINE');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/telemedicine/consultations']);
  });

  it('should handle screen share (placeholder)', async () => {
    await component.toggleScreenShare();
    
    expect(mockNotificationService.addNotification).toHaveBeenCalledWith({
      type: 'system',
      title: 'Screen Share',
      message: 'Screen sharing feature will be available in the next update',
      timestamp: jasmine.any(Date)
    });
  });

  it('should clean up on destroy', () => {
    spyOn(component, 'leaveAgoraCall');
    
    component.ngOnDestroy();
    
    expect(component['leaveAgoraCall']).toHaveBeenCalled();
  });
});
