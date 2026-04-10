import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SystemInfo {
  hostname: string;
  ipAddresses: string[];
  totalRam: number;
  freeRam: number;
  temperature: number | null;
}

export type LedCommand =
  | { command: 'set_color'; params: { r: number; g: number; b: number } }
  | {
      command: 'pulse';
      params: {
        on_color: [number, number, number];
        off_color?: [number, number, number];
        fade_in?: number;
        fade_out?: number;
      };
    }
  | { command: 'blink'; params: { color: [number, number, number]; on_time?: number; off_time?: number } }
  | { command: 'off' };

export interface GenericResponse {
  message?: string;
  error?: string;
  success?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BeatnikSystemService {
  constructor(private http: HttpClient) {}

  private getApiUrl(host: string): string {
    return `http://${host}:3000/api/system`;
  }

  /**
   * Get current system information (hostname, IP, RAM, temp)
   */
  getInfo(host: string): Observable<SystemInfo> {
    return this.http.get<SystemInfo>(`${this.getApiUrl(host)}/info`);
  }

  /**
   * Send a command to the LED
   */
  setLedState(payload: LedCommand, host: string): Observable<GenericResponse> {
    return this.http.post<GenericResponse>(`${this.getApiUrl(host)}/led`, payload);
  }

  /**
   * Reboot the system via the system API
   */
  reboot(host: string): Observable<GenericResponse> {
    return this.http.post<GenericResponse>(`${this.getApiUrl(host)}/reboot`, {});
  }
}
