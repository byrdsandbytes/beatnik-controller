import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { retry } from 'rxjs/operators';
import {
  BeatnikUpdateService,
  UpdateOverview,
  UpdateTarget,
} from 'src/app/services/beatnik-update.service';

@Component({
  selector: 'app-beatnik-update',
  templateUrl: './beatnik-update.page.html',
  styleUrls: ['./beatnik-update.page.scss'],
  standalone: false,
})
export class BeatnikUpdatePage implements OnDestroy {
  host = window.location.hostname || 'localhost';
  targets: (UpdateTarget | 'all')[] = ['bleno', 'controller', 'camilladsp', 'api', 'all'];
  overview?: UpdateOverview;
  error?: string;
  message?: string;
  private pollSub?: Subscription;

  constructor(private updateService: BeatnikUpdateService) {}

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }

  refresh() {
    this.error = undefined;
    this.updateService.getStatus(this.host).subscribe({
      next: (o) => (this.overview = o),
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
    // The API restarts when updating 'api', so retry through transient failures
    this.pollSub = this.updateService
      .pollUntilDone(this.host)
      .pipe(retry({ delay: 3000 }))
      .subscribe({
        next: (o) => (this.overview = o),
        error: (e) => (this.error = this.describe(e)),
      });
  }

  private describe(e: any): string {
    return e?.error?.message || e?.message || 'Request failed';
  }
}
