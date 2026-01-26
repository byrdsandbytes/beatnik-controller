import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SnapcastStatus {
  active: boolean;  // Is the service currently running (systemctl is-active)
  enabled: boolean; // Is the service set to start on boot (systemctl is-enabled)
}

export interface SnapcastActionResponse extends SnapcastStatus {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class BeatnikSnapcastService {

  constructor(private http: HttpClient) {}

  private getApiUrl(host: string): string {
    return `http://${host}:3000/api/snapcast`;
  }

  /**
   * Check if Snapserver is running and enabled
   */
  getStatus(host: string): Observable<SnapcastStatus> {
    return this.http.get<SnapcastStatus>(`${this.getApiUrl(host)}/status`);
  }

  /**
   * Enable Snapserver (starts immediately and enables on boot)
   */
  enable(host: string): Observable<SnapcastActionResponse> {
    return this.http.post<SnapcastActionResponse>(`${this.getApiUrl(host)}/enable`, {});
  }

  /**
   * Disable Snapserver (stops immediately and disables on boot)
   */
  disable(host: string): Observable<SnapcastActionResponse> {
    return this.http.post<SnapcastActionResponse>(`${this.getApiUrl(host)}/disable`, {});
  }
}
