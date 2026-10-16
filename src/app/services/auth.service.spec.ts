import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should be created without accessing localStorage during server rendering', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        { provide: PLATFORM_ID, useValue: 'server' }
      ]
    });

    const service = TestBed.inject(AuthService);

    expect(service).toBeTruthy();
    expect(service.isLoggedIn()).toBe(false);
  });

  it('should restore the session from localStorage in the browser', () => {
    localStorage.setItem('isAuthenticated', 'true');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    const service = TestBed.inject(AuthService);

    expect(service.isLoggedIn()).toBe(true);
  });
});
