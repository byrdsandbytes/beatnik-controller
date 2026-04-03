import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces matching the API types
export interface HatProfile {
  id: string;
  name: string;
  overlay: string;
  eepromMatch?: string;
  camilla: {
    device: string;
    format: string;
    channels?: number;
  };
}

export interface HardwareStatus {
  currentConfig: HatProfile | null;
  detectedHardware: HatProfile | null;
  isMatch: boolean;
  eepromReadDisabled: boolean;
  camillaConfigFile: string | null;
}

export interface ApplyResponse {
  status: string;
  message: string;
  rebootRequired: boolean;
}

export interface CamillaConfigListResponse {
  configs: string[];
}

export interface CamillaDefaultConfigResponse {
  fileName: string | null;
}

export interface SetCamillaDefaultConfigRequest {
  fileName: string;
}

export interface SetCamillaDefaultConfigResponse {
  status: string;
  fileName: string;
}

@Injectable({
  providedIn: 'root'
})
export class BeatnikHardwareService {

  constructor(private http: HttpClient) {}

  private getApiUrl(host: string): string {
    return `http://${host}:3000/api/hardware`;
  }

  /**
   * Get a list of all supported HATs
   */
  getHats(host: string): Observable<HatProfile[]> {
    return this.http.get<HatProfile[]>(`${this.getApiUrl(host)}/hats`);
  }

  /**
   * Get the current system status (configured vs detected hardware)
   */
  getStatus(host: string): Observable<HardwareStatus> {
    return this.http.get<HardwareStatus>(`${this.getApiUrl(host)}/status`);
  }

  /**
   * Get all available CamillaDSP config files
   */
  getCamillaConfigs(host: string): Observable<CamillaConfigListResponse> {
    return this.http.get<CamillaConfigListResponse>(`${this.getApiUrl(host)}/camilla/configs`);
  }

  /**
   * Get the active default CamillaDSP config file
   */
  getDefaultCamillaConfig(host: string): Observable<CamillaDefaultConfigResponse> {
    return this.http.get<CamillaDefaultConfigResponse>(`${this.getApiUrl(host)}/camilla/configs/default`);
  }

  /**
   * Set the default CamillaDSP config file
   */
  setDefaultCamillaConfig(fileName: string, host: string): Observable<SetCamillaDefaultConfigResponse> {
    return this.http.put<SetCamillaDefaultConfigResponse>(
      `${this.getApiUrl(host)}/camilla/configs/default`,
      { fileName } satisfies SetCamillaDefaultConfigRequest
    );
  }

  /**
   * Apply a new hardware configuration
   * This will update config.txt and camilladsp.yml
   */
  applyConfiguration(hatId: string, host: string): Observable<ApplyResponse> {
    return this.http.post<ApplyResponse>(`${this.getApiUrl(host)}/apply`, { hatId });
  }

  /**
   * Trigger a system reboot
   */
  reboot(host: string): Observable<void> {
    return this.http.post<void>(`${this.getApiUrl(host)}/reboot`, {});
  }
}
