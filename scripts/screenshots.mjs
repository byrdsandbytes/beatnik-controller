#!/usr/bin/env node
/**
 * Generates documentation screenshots of the controller.
 * See docs/SCREENSHOTS.md for the checklist and the capture plan.
 *
 * No hardware needed: Playwright fakes every device interface the app talks to:
 *   - Snapcast JSON-RPC (ws :1780) from src/assets/mock/json/server-state.json
 *   - Beatnik API (http :3000), CamillaDSP (ws :1234) and mDNS from ./screenshot-mocks.mjs
 * All other traffic off localhost is blocked. Presets and settings are seeded into localStorage.
 *
 * Usage:
 *   npm start                              # in another terminal (ng serve)
 *   npm run screenshots                    # all shots → screenshots/
 *   npm run screenshots -- devices layout  # only the named shots
 *
 * Env:
 *   BASE_URL         dev server URL (default http://localhost:4200)
 *   SCREENSHOT_OUT   output dir (default ./screenshots), e.g. ../beatnik-pi/docs/images
 *   SCREENSHOT_PNG=1 also keep the raw PNG next to the .webp
 *
 * A failed shot leaves screenshots/_failed_<name>.png; DEBUG=1 prints the full Playwright log.
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { BEATNIK_API, BEATNIK_API_OK, MDNS_SERVICES, camillaReply } from './screenshot-mocks.mjs';

const MOCK_STATE = 'src/assets/mock/json/server-state.json';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4200';
const OUT = path.resolve(process.env.SCREENSHOT_OUT || 'screenshots');
const KEEP_PNG = process.env.SCREENSHOT_PNG === '1';

// iPhone 15
const VIEWPORT = { width: 393, height: 852 };
const DPR = 3;

// Ids from src/assets/mock/json/server-state.json
const GROUP = {
  livingRoom: 'f13057aa-ba82-449a-41cd-12144c04dfd3',
  kitchen: 'k23057aa-ba82-449a-41cd-12144c04dfd3',
  office: 'a1b2c3d4-0000-4000-8000-000000000003',
  terrace: 'a1b2c3d4-0000-4000-8000-000000000004',
  bedroom: 'a1b2c3d4-0000-4000-8000-000000000005',
};
const CLIENT = {
  livingRoom: '2c:cf:67:f0:f9:4a',
  kitchen: '2c:cf:67:f0:f9:4b',
  office: '2c:cf:67:f0:f9:40',
  terraceL: '2c:cf:67:f0:f9:4d',
  terraceR: '2c:cf:67:f0:f9:4e',
  bedroom: '2c:cf:67:f0:f9:4c',
};

const vol = (name, levels) => ({
  id: crypto.randomUUID(),
  presetName: name,
  data: [
    { clientId: CLIENT.livingRoom, groupId: GROUP.livingRoom, groupName: 'Living Room', volumePercent: levels[0] },
    { clientId: CLIENT.kitchen, groupId: GROUP.kitchen, groupName: 'Kitchen', volumePercent: levels[1] },
    { clientId: CLIENT.office, groupId: GROUP.office, groupName: 'Office', volumePercent: levels[2] },
    { clientId: CLIENT.terraceL, groupId: GROUP.terrace, groupName: 'Terrace', volumePercent: levels[3] },
    { clientId: CLIENT.terraceR, groupId: GROUP.terrace, groupName: 'Terrace', volumePercent: levels[3] },
    { clientId: CLIENT.bedroom, groupId: GROUP.bedroom, groupName: 'Bedroom', volumePercent: levels[4] },
  ],
});
const streams = (name, ids) => ({
  id: crypto.randomUUID(),
  presetName: name,
  data: Object.entries(GROUP).map(([key, groupId], i) => ({
    groupId,
    groupName: { livingRoom: 'Living Room', kitchen: 'Kitchen', office: 'Office', terrace: 'Terrace', bedroom: 'Bedroom' }[key],
    streamId: ids[i],
  })),
});

/** Capacitor Preferences on web = localStorage with this prefix. */
const PREFERENCES = {
  username: 'Alex',
  serverUrl: '192.168.1.150',
  scanForDevicesOnStartup: 'false',
  volumePresets: JSON.stringify([
    vol('Party', [85, 80, 60, 90, 0]),
    vol('Dinner', [45, 50, 0, 35, 0]),
    vol('Late night', [20, 0, 0, 0, 15]),
  ]),
  streamPresets: JSON.stringify([
    streams('Everyone on AirPlay', ['AirPlay', 'AirPlay', 'AirPlay', 'AirPlay', 'AirPlay']),
    streams('Records downstairs', ['Turntable', 'Turntable', 'Spotify', 'Turntable', 'AirPlay2']),
  ]),
};

// ---------------------------------------------------------------------------
// Helpers

/** In-app navigation without a reload, so the in-memory demo state survives. */
async function go(page, url) {
  await page.evaluate((u) => {
    history.pushState({}, '', u);
    dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  }, url);
  await page.waitForURL((u) => u.pathname === url.split('?')[0]);
  await settle(page);
}

async function settle(page, ms = 800) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(ms);
}

/** Set the bottom-sheet player modal to a breakpoint (0.05 = collapsed). */
async function playerBreakpoint(page, bp) {
  await page.evaluate(async (b) => {
    const modal = document.querySelector('ion-modal.player-modal');
    if (modal) await modal.setCurrentBreakpoint(b);
  }, bp);
  await page.waitForTimeout(600);
}

/** First visible match; Ionic keeps hidden cached pages in the DOM. */
const visible = (page, selector, opts) => page.locator(selector, opts).filter({ visible: true }).first();

/** Scroll the visible ion-content so the element containing `text` sits at `ratio` of the viewport height. */
async function scrollToText(page, selector, text, ratio = 0.4) {
  await visible(page, selector, { hasText: text }).evaluate(async (el, r) => {
    const content = el.closest('ion-content');
    const scroller = await content.getScrollElement();
    const delta = el.getBoundingClientRect().top - window.innerHeight * r;
    await content.scrollToPoint(0, scroller.scrollTop + delta, 0);
  }, ratio);
  await page.waitForTimeout(400);
}

async function save(page, name, { clip, locator, pad = 0 } = {}) {
  let region = clip;
  if (locator) {
    const box = await locator.boundingBox();
    if (!box) throw new Error(`${name}: element for clip not visible`);
    region = {
      x: Math.max(0, box.x - pad),
      y: Math.max(0, box.y - pad),
      width: Math.min(VIEWPORT.width, box.width + 2 * pad),
      height: box.height + 2 * pad,
    };
  }
  const png = await page.screenshot({ clip: region });
  const file = path.join(OUT, `${name}.webp`);
  await sharp(png).webp({ quality: 85 }).toFile(file);
  if (KEEP_PNG) await writeFile(path.join(OUT, `${name}.png`), png);
  console.log(`  ✓ ${path.relative(process.cwd(), file)}`);
}

// ---------------------------------------------------------------------------
// Shots ([D] = demo mode). Keys are the CLI filter names.

const SHOTS = {
  // Getting around
  connect: async (page) => {
    await go(page, '/settings');
    await playerBreakpoint(page, 0.05);
    await save(page, 'app_getting-around_connect');
  },
  layout: async (page) => {
    await go(page, '/tabs/dashboard');
    await playerBreakpoint(page, 0.5);
    await save(page, 'app_getting-around_layout');
    await playerBreakpoint(page, 0.05);
  },

  // Everyday use
  'quick-actions': async (page) => {
    await go(page, '/tabs/dashboard');
    await save(page, 'app_everyday_quick-actions', { locator: visible(page, '.fab-row'), pad: 12 });
  },
  devices: async (page) => {
    await go(page, '/tabs/devices');
    // Show the end of the Clients list and the start of Device Groups.
    await scrollToText(page, 'ion-list-header', 'Device Groups', 0.45);
    await save(page, 'app_everyday_devices');
  },
  'stream-details': async (page) => {
    await go(page, '/streams/AirPlay');
    await playerBreakpoint(page, 0.05);
    await visible(page, 'ion-accordion ion-item[slot="header"]').click();
    await page.waitForTimeout(600);
    await save(page, 'app_everyday_stream-details');
  },
  'volume-presets': async (page) => {
    await go(page, '/volume-presets');
    await playerBreakpoint(page, 0.05);
    await visible(page, 'ion-item-sliding').evaluate((el) => el.open('start'));
    await page.waitForTimeout(600);
    await save(page, 'app_everyday_volume-presets');
  },
  'capture-preset': async (page) => {
    await go(page, '/volume-preset-edit');
    await playerBreakpoint(page, 0.05);
    await visible(page, 'ion-button', { hasText: 'Save Preset' }).click();
    const alert = page.locator('ion-alert');
    await alert.waitFor();
    await alert.locator('input').first().fill('Sunday morning');
    await page.waitForTimeout(500);
    await save(page, 'app_everyday_capture-preset');
    await alert.evaluate((a) => a.dismiss(null, 'cancel'));
  },
  'stream-presets': async (page) => {
    await go(page, '/stream-presets');
    await playerBreakpoint(page, 0.05);
    await save(page, 'app_everyday_stream-presets');
  },

  // Settings & help
  settings: async (page) => {
    await go(page, '/settings');
    await playerBreakpoint(page, 0.05);
    await save(page, 'app_settings');
  },
  'demo-mode': async (page) => {
    await go(page, '/tabs/menu');
    await playerBreakpoint(page, 0.05);
    await save(page, 'app_settings_demo-mode');
  },

  // Maintenance
  'device-details': async (page) => {
    await go(page, `/devices/${GROUP.terrace}`);
    await playerBreakpoint(page, 0.05);
    // Now playing card at the top, then Stream / Group Name / Clients below it.
    await scrollToText(page, 'ion-label', 'Group Name', 0.87);
    await save(page, 'app_maintenance_device-details');
  },
  'speaker-picker': async (page) => {
    await go(page, `/devices/${GROUP.livingRoom}`);
    await playerBreakpoint(page, 0.05);
    // Cached device pages share the #device-menu-trigger id, so the popover's `trigger`
    // can bind to a hidden page. Open the visible page's popover directly instead.
    await visible(page, '#device-menu-trigger').evaluate((btn) =>
      btn.closest('ion-toolbar').querySelector('ion-popover').present());
    await page.locator('ion-popover ion-item', { hasText: 'Choose Speakers' }).filter({ visible: true }).click();
    await page.locator('app-choose-speakers').waitFor();
    await page.waitForTimeout(800);
    await save(page, 'app_maintenance_speaker-picker');
    await page.locator('ion-modal', { has: page.locator('app-choose-speakers') }).evaluate((m) => m.dismiss());
    await page.waitForTimeout(500);
  },
  'client-details': async (page) => {
    await go(page, `/clients/${CLIENT.livingRoom}`);
    await playerBreakpoint(page, 0.05);
    await visible(page, 'ion-segment-button[value="details"]').click();
    await visible(page, 'h2', { hasText: '°C' }).waitFor();
    await page.waitForTimeout(600);
    await save(page, 'app_maintenance_client-details');
  },
  updates: async (page) => {
    await go(page, '/beatnik-update');
    await visible(page, 'ion-button', { hasText: 'Update now' }).waitFor();
    // Expert mode lists the installed versions and per-component update buttons.
    await visible(page, 'ion-toggle.expert-toggle').click();
    // In a browser the host defaults to localhost; show a device name instead.
    await visible(page, 'ion-input input').fill('beatnik-server.local');
    await visible(page, 'ion-button', { hasText: 'Refresh' }).click();
    await page.waitForTimeout(800);
    await save(page, 'app_maintenance_updates');
  },
  'server-status': async (page) => {
    await go(page, '/server-status');
    await scrollToText(page, 'ion-card-title', 'Restart Services', 0.3);
    await save(page, 'app_maintenance_server-status');
  },
  scanner: async (page) => {
    await go(page, '/zeroconf');
    await visible(page, 'ion-buttons[slot="end"] ion-button').click();
    await visible(page, 'h2', { hasText: 'beatnik-terrace-l' }).waitFor();
    await page.waitForTimeout(800);
    await save(page, 'app_maintenance_scanner');
  },

  // Adding a device
  'setup-server': async (page) => {
    // A new device that is not in the Snapcast state yet.
    await go(page, '/setup-server/192.168.1.156');
    await visible(page, 'ion-button', { hasText: 'Setup as Server' }).waitFor({ timeout: 15000 });
    await page.waitForTimeout(800);
    await save(page, 'app_add-device_server');
  },
  'setup-name': async (page) => {
    await go(page, '/setup-device-group-name/192.168.1.151');
    await visible(page, 'ion-input input').fill('Living Room Amp');
    await page.locator('body').click({ position: { x: 5, y: 400 } }); // blur, hide caret
    await page.waitForTimeout(500);
    await save(page, 'app_add-device_name');
  },

  // CamillaDSP (Camilla DSP tab of the client details)
  ...camillaShots(),
};

function camillaShots() {
  const open = async (page) => {
    await go(page, `/clients/${CLIENT.livingRoom}`);
    await visible(page, 'ion-segment-button[value="camilla-dsp"]').click();
    await visible(page, 'ion-list-header', { hasText: 'Filters' }).waitFor({ timeout: 15000 });
    await page.waitForTimeout(800);
  };
  const section = (heading, file, ratio = 0.12) => async (page) => {
    await open(page);
    await scrollToText(page, 'ion-list-header', heading, ratio);
    await save(page, file);
  };
  return {
    'dsp-filters': section('Filters', 'app_camilladsp_filters'),
    'dsp-mixers': section('Mixers', 'app_camilladsp_mixers'),
    'dsp-processors': async (page) => {
      await open(page);
      // The compressor card (down to Soft clip) is taller than a phone screen:
      // capture it with a temporarily taller viewport.
      await page.setViewportSize({ width: VIEWPORT.width, height: 1500 });
      await page.waitForTimeout(600);
      await scrollToText(page, 'ion-list-header', 'Processors', 0.05);
      const card = visible(page, 'ion-card', { has: page.locator('ion-label', { hasText: 'Soft clip' }) });
      const header = await visible(page, 'ion-list-header', { hasText: 'Processors' }).boundingBox();
      const box = await card.boundingBox();
      await save(page, 'app_camilladsp_processors', {
        clip: { x: 0, y: header.y, width: VIEWPORT.width, height: box.y + box.height - header.y + 16 },
      });
      await page.setViewportSize(VIEWPORT);
      await page.waitForTimeout(400);
    },
    'dsp-configs': async (page) => {
      await open(page);
      await scrollToText(page, 'ion-list-header', 'Advanced Settings', 0.3);
      await visible(page, 'ion-button.config-select-button').click();
      const picker = visible(page, 'ion-modal.config-picker-modal'); // the template has two pickers
      await picker.getByText('beatnik_loudness.yml').waitFor();
      await page.waitForTimeout(600);
      await save(page, 'app_camilladsp_configs');
      // Pick a file: the picker closes and "Set as default" becomes active.
      // Both pickers in the template share isConfigPickerOpen, so two modals open; click in the top one.
      await page.locator('ion-modal.config-picker-modal.show-modal').last()
        .locator('ion-item', { hasText: 'beatnik_loudness.yml' }).click();
      await page.locator('ion-modal.config-picker-modal.show-modal').first().waitFor({ state: 'detached' });
      await page.waitForTimeout(600);
      await save(page, 'app_camilladsp_set-default');
    },
  };
}

// ---------------------------------------------------------------------------

async function main() {
  const only = process.argv.slice(2);
  const unknown = only.filter((n) => !SHOTS[n]);
  if (unknown.length) {
    console.error(`Unknown shot(s): ${unknown.join(', ')}\nAvailable: ${Object.keys(SHOTS).join(', ')}`);
    process.exit(1);
  }
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({
    // Keep the app from reaching a real Beatnik server on the LAN.
    args: ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost'],
  });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DPR,
    isMobile: true,
    hasTouch: true,
    colorScheme: 'light',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const isLocal = (url) => ['localhost', '127.0.0.1'].includes(url.hostname);

  // Fake Snapcast server: answers JSON-RPC from the mock state, so features that
  // query the server (e.g. capturing a volume preset) work without hardware.
  const mockState = JSON.parse(await readFile(MOCK_STATE, 'utf8'));
  // Fresh "last seen" timestamps instead of the ones frozen in the mock file.
  const now = Math.floor(Date.now() / 1000);
  for (const g of mockState.server.groups) for (const c of g.clients) c.lastSeen = { sec: now - 5, usec: 0 };
  await context.routeWebSocket(
    (url) => !isLocal(url),
    (ws) => {
      const port = new URL(ws.url()).port;
      if (port === '1780') {
        // Snapcast JSON-RPC
        ws.onMessage((raw) => {
          const req = JSON.parse(String(raw));
          if (req.id === undefined) return;
          const result =
            req.method === 'Server.GetStatus' ? mockState
            : req.method === 'Server.GetRpcVersion' ? { major: 2, minor: 0, patch: 0 }
            : {};
          ws.send(JSON.stringify({ jsonrpc: '2.0', id: req.id, result }));
        });
      } else if (port === '1234') {
        // CamillaDSP: requests are `{ Command: params }` or a bare "Command" string
        ws.onMessage((raw) => {
          const msg = JSON.parse(String(raw));
          const command = typeof msg === 'string' ? msg : Object.keys(msg)[0];
          ws.send(JSON.stringify(camillaReply(command)));
        });
      } else {
        ws.close();
      }
    },
  );

  // Beatnik API on port 3000 (any host, including localhost) is answered from mocks;
  // every other request off localhost is blocked so real LAN devices are never touched.
  await context.route(
    (url) => url.port === '3000' || !isLocal(url),
    (route) => {
      const req = route.request();
      const url = new URL(req.url());
      if (url.port !== '3000') return route.abort();
      const cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      };
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
      const body = BEATNIK_API[`${req.method()} ${url.pathname}`] ?? (req.method() === 'GET' ? null : BEATNIK_API_OK);
      if (body === null) return route.fulfill({ status: 404, headers: cors, json: { error: 'Not mocked' } });
      return route.fulfill({ status: 200, headers: cors, json: body });
    },
  );

  await context.addInitScript(({ prefs, mdns }) => {
    if (!sessionStorage.getItem('screenshots-seeded')) {
      for (const [k, v] of Object.entries(prefs)) localStorage.setItem(`CapacitorStorage.${k}`, v);
      sessionStorage.setItem('screenshots-seeded', '1');
    }
    // Fake Electron bridge used by @byrds/capacitor-mdns on web.
    const result = (services) => ({ error: false, errorMessage: null, servicesFound: services.length, services });
    window.mDNS = {
      getPluginPlatform: async () => ({ platform: 'web' }),
      discover: async ({ type } = {}) => {
        await new Promise((r) => setTimeout(r, 300));
        return result(mdns[type] ?? []);
      },
      watchServices: async ({ types = [] } = {}) => {
        const plugin = window.Capacitor.Plugins.mDNS;
        types.flatMap((t) => mdns[t] ?? []).forEach((service, i) =>
          setTimeout(() => plugin.notifyListeners('serviceFound', { service }), 300 + i * 150));
        return { error: false, errorMessage: null, watchersStarted: types.length };
      },
      stopWatching: async () => ({ error: false, errorMessage: null }),
    };
  }, { prefs: PREFERENCES, mdns: MDNS_SERVICES });

  const page = await context.newPage();
  page.on('pageerror', (e) => console.warn('  [pageerror]', e.message));

  console.log(`Opening ${BASE_URL} …`);
  await page.goto(`${BASE_URL}/tabs/dashboard`);
  // The app connects to the fake server on startup; wait for its data to render.
  await page.getByText('Living Room').first().waitFor({ timeout: 20000 });
  await settle(page, 1500);

  let failed = 0;
  for (const [name, shot] of Object.entries(SHOTS)) {
    if (only.length && !only.includes(name)) continue;
    console.log(name);
    try {
      await shot(page);
    } catch (e) {
      failed++;
      console.error(`  ✗ ${e.message.split('\n').slice(0, process.env.DEBUG ? 20 : 1).join('\n    ')}`);
      await page.screenshot({ path: path.join(OUT, `_failed_${name}.png`) }).catch(() => {});
    }
  }
  await browser.close();
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
