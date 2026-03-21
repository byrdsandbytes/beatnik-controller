import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { first, firstValueFrom, Observable } from 'rxjs';
import { SnapCastServerStatusResponse } from 'src/app/model/snapcast.model';
import { SnapcastService } from 'src/app/services/snapcast.service';

@Component({
  selector: 'app-setup-device-group-name',
  templateUrl: './setup-device-group-name.page.html',
  styleUrls: ['./setup-device-group-name.page.scss'],
  standalone: false,
})
export class SetupDeviceGroupNamePage implements OnInit {
  ip: string = '';
  serverState: Observable<SnapCastServerStatusResponse>;
  groupId: string = '';
  deviceGroupName: string = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private snapcastService: SnapcastService
  ) {}

  async ngOnInit() {
    // Get the IP from the route parameters
    this.ip = this.activatedRoute.snapshot.paramMap.get('ip') || '';
    console.log('SetupDeviceGroupNamePage: IP from route parameters:', this.ip);
    this.serverState = this.snapcastService.state$;

    // Get the group ID for the IP
    this.groupId = (await this.getGroupIdFromIp(this.ip)) || '';
    console.log('SetupDeviceGroupNamePage: Group ID for IP:', this.groupId);
  }

  async getGroupIdFromIp(ip: string): Promise<string | null> {
    const state = await firstValueFrom(this.snapcastService.state$);
    if (!state || !state.server || !state.server.groups) {
      console.warn(
        'SetupDeviceGroupNamePage: Invalid server state received',
        state
      );
      return null;
    }
    for (const group of state.server.groups) {
      if (group.clients) {
        for (const client of group.clients) {
          const hostIP = client.host?.ip;
          // remove ::ffff prefix if present
          const normalizedIP = hostIP?.startsWith('::ffff:')
            ? hostIP.substring(7)
            : hostIP;
          if (normalizedIP === ip) {
            console.log(
              `SetupDeviceGroupNamePage: Found group ID ${group.id} for IP ${ip}`
            );
            if (group.name) {
              this.deviceGroupName = group.name;
            }
            return group.id;
          }
        }
      }
    }

    console.warn(`SetupDeviceGroupNamePage: No group ID found for IP ${ip}`);
    return null;
  }

  changeGroupName(newName: string): void {
    if (!this.groupId) {
      console.error(
        'SetupDeviceGroupNamePage: No group ID available to change group name'
      );
      return;
    }
    this.snapcastService.setGroupName(this.groupId, newName).subscribe({
      next: () => {
        console.log(
          `SetupDeviceGroupNamePage: Group name changed to ${newName} for ID ${this.groupId}`
        );
      },
      error: (error) => {
        console.error(
          `SetupDeviceGroupNamePage: Error changing group name for ID ${this.groupId}`,
          error
        );
      },
    });
  }
}
