import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, timer } from 'rxjs';
import { catchError, switchMap, takeWhile } from 'rxjs/operators';

export type UpdateTarget = 'bleno' | 'controller' | 'api';
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

export interface VersionInfo {
  target: UpdateTarget;
  installed: boolean;
  version: string | null;
  image?: string;
  imageId?: string;
}

export interface VersionsResponse {
  versions: VersionInfo[];
}

// Emitted by pollUntilDone() while the API is unreachable (it restarts after an 'api' update)
export interface UpdateOffline {
  offline: true;
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
   * Get installed version information for every update target
   */
  getVersions(host: string): Observable<VersionsResponse> {
    return this.http.get<VersionsResponse>(`${this.getApiUrl(host)}/versions`);
  }

  /**
   * Start an update (returns immediately, the update runs in the background).
   * - 'bleno' and 'api' install the latest .deb release with apt (404 if the package is not installed).
   * - 'controller' pulls the latest Docker image.
   * - 'all' runs bleno, controller and api in that order; it stops at the first failure.
   * Responds with 409 if another update is already running.
   */
  update(target: UpdateTarget | 'all', host: string): Observable<StartUpdateResponse> {
    return this.http.post<StartUpdateResponse>(`${this.getApiUrl(host)}/${target}`, {});
  }

  /**
   * Poll the status until no update is running anymore.
   * Updating 'api' restarts the Hardware API, so requests fail for a few seconds.
   * Failed polls are emitted as { offline: true } and polling continues until the API
   * is reachable again and reports busy = false.
   */
  pollUntilDone(host: string, intervalMs = 3000): Observable<UpdateOverview | UpdateOffline> {
    return timer(0, intervalMs).pipe(
      switchMap(() =>
        this.getStatus(host).pipe(catchError(() => of<UpdateOffline>({ offline: true })))
      ),
      takeWhile(status => 'offline' in status || status.busy, true)
    );
  }
}
