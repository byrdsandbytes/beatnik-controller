import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  BeatnikUpdateService,
  UpdateOverview,
  UpdateTarget,
  VersionInfo,
} from 'src/app/services/beatnik-update.service';

@Component({
  selector: 'app-beatnik-device-update',
  templateUrl: './beatnik-device-update.component.html',
  styleUrls: ['./beatnik-device-update.component.scss'],
  standalone: false,
})
export class BeatnikDeviceUpdateComponent implements OnInit, OnDestroy {
  // Host/IP of the device to update; when omitted the host serving the app is used and can be edited in expert mode
  @Input() host = window.location.hostname || 'localhost';
  @Input() lockHost = false;
  targets: (UpdateTarget | 'all')[] = ['bleno', 'controller', 'api', 'all'];
  overview?: UpdateOverview;
  versions: VersionInfo[] = [];
  offline = false;
  error?: string;
  message?: string;
  expert = localStorage.getItem('beatnik-update-expert') === 'true';
  private pollSub?: Subscription;

  constructor(private updateService: BeatnikUpdateService) {}

  ngOnInit() {
    this.refresh();
  }

  toggleExpert() {
    this.expert = !this.expert;
    localStorage.setItem('beatnik-update-expert', String(this.expert));
  }

  private get failed(): boolean {
    return !!this.overview?.targets.some((t) => t.state === 'failed');
  }

  get simpleIcon(): string {
    if (this.error) return 'cloud-offline-outline';
    if (this.offline || this.overview?.busy) return 'sync-outline';
    return this.failed ? 'alert-circle-outline' : 'checkmark-circle-outline';
  }

  get simpleColor(): string {
    if (this.error || this.failed) return 'danger';
    return this.offline || this.overview?.busy ? 'primary' : 'success';
  }

  get simpleTitle(): string {
    if (this.error) return 'Can’t reach your Beatnik';
    if (this.offline) return 'Restarting…';
    if (this.overview?.busy) return 'Updating…';
    if (this.failed) return 'Update failed';
    return this.overview ? 'Ready to update' : 'Checking…';
  }

  get simpleSubtitle(): string {
    if (this.error) return 'Make sure it is powered on and on the same network.';
    if (this.offline) return 'This takes a moment. Please keep this screen open.';
    if (this.overview?.busy) return 'Please keep this screen open.';
    if (this.failed) return 'Try again, or open Expert mode for details.';
    return 'Install the latest version of everything.';
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }

  refresh() {
    this.error = undefined;
    this.updateService.getStatus(this.host).subscribe({
      next: (o) => (this.overview = o),
      error: (e) => (this.error = this.describe(e)),
    });
    this.updateService.getVersions(this.host).subscribe({
      next: (response) => (this.versions = response.versions),
      error: (e) => (this.error = this.describe(e)),
    });
  }

  start(target: UpdateTarget | 'all') {
    this.error = undefined;
    this.message = undefined;
    this.updateService.update(target, this.host).subscribe({
      next: (res) => {
        this.message = res.message;
        this.poll();
      },
      error: (e) =>
        (this.error = e?.status === 409 ? 'Another update is already running' : this.describe(e)),
    });
  }

  private poll() {
    this.pollSub?.unsubscribe();
    // The API restarts when updating 'api'; the service reports that as offline
    this.pollSub = this.updateService
      .pollUntilDone(this.host)
      .subscribe({
        next: (o) => {
          this.offline = 'offline' in o;
          if (!('offline' in o)) {
            this.overview = o;
            if (!o.busy) {
              this.loadVersions();
            }
          }
        },
        error: (e) => (this.error = this.describe(e)),
      });
  }

  private loadVersions() {
    this.updateService.getVersions(this.host).subscribe({
      next: (response) => (this.versions = response.versions),
      error: (e) => (this.error = this.describe(e)),
    });
  }

  private describe(e: any): string {
    return e?.error?.message || e?.message || 'Request failed';
  }
}
