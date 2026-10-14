import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, timer } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';

export type UpdateTarget = 'bleno' | 'controller' | 'camilladsp' | 'api';
export type UpdateState = 'idle' | 'running' | 'success' | 'failed';

export interface UpdateStatus {
  target: UpdateTarget;
  state: UpdateState;
  startedAt?: string;
  finishedAt?: string;
  message?: string;
  output?: string; // Tail of the update log
}

export interface UpdateOverview {
  busy: boolean; // True while an update is running
  targets: UpdateStatus[];
}

export interface StartUpdateResponse {
  success: boolean;
  message: string;
  targets: UpdateTarget[];
}

@Injectable({
  providedIn: 'root'
})
export class BeatnikUpdateService {
  constructor(private http: HttpClient) {}

  private getApiUrl(host: string): string {
    return `http://${host}:3000/api/update`;
  }

  /**
   * Get the state of the last update for every target
   */
  getStatus(host: string): Observable<UpdateOverview> {
    return this.http.get<UpdateOverview>(`${this.getApiUrl(host)}/status`);
  }

  /**
   * Start an update (returns immediately, the update runs in the background).
   * Responds with 409 if another update is already running.
   */
  update(target: UpdateTarget | 'all', host: string): Observable<StartUpdateResponse> {
    return this.http.post<StartUpdateResponse>(`${this.getApiUrl(host)}/${target}`, {});
  }

  /**
   * Poll the status until no update is running anymore.
   * Note: updating 'api' restarts the Hardware API, so requests fail for a few
   * seconds. Handle the error (e.g. with retry) until the API is reachable again.
   */
  pollUntilDone(host: string, intervalMs = 3000): Observable<UpdateOverview> {
    return timer(0, intervalMs).pipe(
      switchMap(() => this.getStatus(host)),
      takeWhile(status => status.busy, true)
    );
  }
}
