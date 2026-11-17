import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { BeatnikSystemService, SystemInfo } from 'src/app/services/beatnik-system.service';

// Last known info per host, shown immediately on re-open while a fresh copy is fetched
const systemInfoCache = new Map<string, SystemInfo>();

@Component({
  selector: 'app-hardware-info',
  templateUrl: './hardware-info.component.html',
  styleUrls: ['./hardware-info.component.scss'],
  standalone: false
})
export class HardwareInfoComponent implements OnChanges {
  @Input() host = '';

  systemInfo?: SystemInfo;
  loading = false;
  error = '';
  skeletonItems = Array.from({ length: 8 });

  constructor(private beatnikSystemService: BeatnikSystemService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['host']) {
      this.systemInfo = systemInfoCache.get(this.host);
      this.load();
    }
  }

  load() {
    if (!this.host) {
      return;
    }
    const host = this.host;
    this.loading = true;
    this.error = '';
    this.beatnikSystemService.getInfo(host).subscribe({
      next: (info) => {
        systemInfoCache.set(host, info);
        if (host === this.host) {
          this.systemInfo = info;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to get system info:', err);
        this.loading = false;
        this.error = `Can't load system info from ${host}.`;
      }
    });
  }
}
