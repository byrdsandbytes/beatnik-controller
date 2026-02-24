export interface HatProfile {
  id: string;
  name: string;
  overlay: string;
  testedbyBeatnik: boolean;
  testedByCommunity: boolean;
  // String oder Regex, um den Namen im /proc/device-tree/hat/product zu matchen
  eepromMatch?: string; 
  camilla: {
    device: string; // Das ALSA Playback Device, z.B. "hw:1,0" oder "hw:Headphones"
    format: string; // Das unterstützte Format, z.B. "S32LE" oder "S16LE"
    channels?: number; // Optional, default 2
  };
}

// Die zentrale Datenbank aller unterstützten Soundkarten
export const SUPPORTED_HATS: Record<string, HatProfile> = {
  // --- HiFiBerry DACs ---

  'hifiberry-dac': {
    id: 'hifiberry-dac',
    name: 'HiFiBerry DAC / MiniAmp / Beocreate / DAC+ Light',
    overlay: 'dtoverlay=hifiberry-dac',
    eepromMatch: 'HiFiBerry DAC',
    testedbyBeatnik: false,
    testedByCommunity: false,
    camilla: {
      device: 'plughw:CARD=sndrpihifiberry,DEV=0',
      format: 'S32LE'
    }
  },
  'hifiberry-dac8x': {
    id: 'hifiberry-dac8x',
    name: 'HiFiBerry DAC8x',
    overlay: 'dtoverlay=hifiberry-dac8x',
    eepromMatch: 'HiFiBerry DAC8x',
    testedbyBeatnik: false,
    testedByCommunity: false,
    camilla: {
      device: 'plughw:CARD=sndrpihifiberry,DEV=0',
      format: 'S32LE'
    }
  },
  'hifiberry-dacplus-std': {
    id: 'hifiberry-dacplus-std',
    name: 'HiFiBerry DAC+ Standard',
    // Kernel >= 6.1.77
    overlay: 'dtoverlay=hifiberry-dacplus-std',
    eepromMatch: 'HiFiBerry DAC+', 
    testedbyBeatnik: false,
    testedByCommunity: false,
    camilla: {
      device: 'plughw:CARD=sndrpihifiberry,DEV=0',
      format: 'S32LE'
    }
  },
  'hifiberry-dacplus-pro': {
    id: 'hifiberry-dacplus-pro',
    name: 'HiFiBerry DAC+ Pro / DAC2 Pro',
    // Kernel >= 6.1.77
    overlay: 'dtoverlay=hifiberry-dacplus-pro',
    eepromMatch: 'HiFiBerry DAC+ Pro',
    testedbyBeatnik: false,
    testedByCommunity: false,
    camilla: {
      device: 'plughw:CARD=sndrpihifiberry,DEV=0',
      format: 'S32LE'
    }
  },

  'hifiberry-dacplushd': {
    id: 'hifiberry-dacplushd',
    name: 'HiFiBerry DAC2 HD',
    overlay: 'dtoverlay=hifiberry-dacplushd',
    eepromMatch: 'HiFiBerry DAC2 HD',
    testedbyBeatnik: false,
    testedByCommunity: false,
    camilla: {
      device: 'plughw:CARD=sndrpihifiberry,DEV=0',
      format: 'S32LE'
    }
  },
  'hifiberry-dacplusadc': {
    id: 'hifiberry-dacplusadc',
    name: 'HiFiBerry DAC+ ADC',
    overlay: 'dtoverlay=hifiberry-dacplusadc',
    eepromMatch: 'HiFiBerry DAC+ ADC',
    testedbyBeatnik: false,
    testedByCommunity: false,
    camilla: {
      device: 'plughw:CARD=sndrpihifiberry,DEV=0',
      format: 'S32LE'
    }
  },
  'hifiberry-dacplusadcpro': {
    id: 'hifiberry-dacplusadcpro',
    name: 'HiFiBerry DAC+ ADC Pro / DAC2 ADC Pro',
    overlay: 'dtoverlay=hifiberry-dacplusadcpro',
    eepromMatch: 'HiFiBerry DAC+ ADC Pro',
    testedbyBeatnik: true,
    testedByCommunity: false,
    camilla: {
      device: 'plughw:CARD=sndrpihifiberry,DEV=0',
      format: 'S32LE'
    }
  },

  // --- HiFiBerry Amps ---

  // 'hifiberry-amp': {
  //   id: 'hifiberry-amp',
  //   name: 'HiFiBerry Amp+',
  //   overlay: 'dtoverlay=hifiberry-amp',
  //   eepromMatch: 'HiFiBerry Amp', 
  //   testedbyBeatnik: false,
  //   camilla: {
  //     device: 'plughw:CARD=sndrpihifiberry,DEV=0',
  //     format: 'S32LE'
  //   }
  // },
  'hifiberry-amp2': {
    id: 'hifiberry-amp2',
    name: 'HiFiBerry Amp2 / Amp4',
    // Uses DAC+ Standard overlay on newer kernels
    overlay: 'dtoverlay=hifiberry-dacplus-std',
    eepromMatch: 'HiFiBerry Amp2', 
    testedbyBeatnik: false,
    testedByCommunity: false,
    camilla: {
      device: 'plughw:CARD=sndrpihifiberry,DEV=0',
      format: 'S32LE'
    }
  },
  // 'hifiberry-amp3': {
  //   id: 'hifiberry-amp3',
  //   name: 'HiFiBerry Amp3',
  //   overlay: 'dtoverlay=hifiberry-amp3',
  //   eepromMatch: 'HiFiBerry Amp3',
  //   testedbyBeatnik: false,
  //   camilla: {
  //     device: 'plughw:CARD=sndrpihifiberry,DEV=0',
  //     format: 'S32LE'
  //   }
  // },
  'hifiberry-amp4pro': {
    id: 'hifiberry-amp4pro',
    name: 'HiFiBerry Amp4 Pro',
    overlay: 'dtoverlay=hifiberry-amp4pro',
    eepromMatch: 'HiFiBerry Amp4 Pro',
    testedbyBeatnik: true,
    testedByCommunity: true,
    camilla: {
      device: 'plughw:CARD=sndrpihifiberry,DEV=0',
      format: 'S32LE'
    }
  },

  // --- HiFiBerry Digi ---

  'hifiberry-digi': {
    id: 'hifiberry-digi',
    name: 'HiFiBerry Digi / Digi+ / Digi 2 Standard',
    overlay: 'dtoverlay=hifiberry-digi',
    eepromMatch: 'HiFiBerry Digi',
    testedbyBeatnik: false,
    testedByCommunity: true,
    camilla: {
      device: 'plughw:CARD=sndrpihifiberry,DEV=0',
      format: 'S24LE3'
    }
  },
  'hifiberry-digi-pro': {
    id: 'hifiberry-digi-pro',
    name: 'HiFiBerry Digi+ Pro / Digi 2 Pro',
    overlay: 'dtoverlay=hifiberry-digi-pro',
    eepromMatch: 'HiFiBerry Digi+ Pro',
    testedbyBeatnik: false,
    testedByCommunity: true,
    camilla: {
      device: 'plughw:CARD=sndrpihifiberry,DEV=0',
      format: 'S24LE3'
    }
  },

  // --- Others ---

  'iqaudio-dacplus': {
    id: 'iqaudio-dacplus',
    name: 'IQaudIO Pi-DAC PRO / DAC+',
    overlay: 'dtoverlay=iqaudio-dacplus',
    eepromMatch: 'Pi-DAC PRO',
    testedbyBeatnik: false,
    testedByCommunity: false,
    camilla: {
      device: 'hw:1,0',
      format: 'S32LE'
    }
  },
  'rpi-digiamp-plus': {
    id: 'rpi-digiamp-plus',
    name: 'Raspberry Pi DigiAMP+',
    overlay: 'dtoverlay=iqaudio-digiamp-plus,unmute_amp',
    eepromMatch: 'Raspberry Pi DigiAMP+',
    testedbyBeatnik: true,
    testedByCommunity: false,
    camilla: {
      device: 'hw:1,0',
      format: 'S32LE'
    }
  },
  'rpi-hdmi0': {
    id: 'rpi-hdmi0',
    name: 'Raspberry Pi HDMI 0',
    overlay: '# Beatnik HDMI0',
    testedbyBeatnik: false,
    testedByCommunity: false,
    camilla: {
      device: 'hw:CARD=vc4hdmi0,DEV=0',
      format: 'S16LE'
    }
  },
  'usb-dac': {
    id: 'usb-dac',
    name: 'Generic USB DAC',
    overlay: '# No overlay needed for USB',
    // Kein eepromMatch, da USB
    testedbyBeatnik: false,
    testedByCommunity: false,
    camilla: {
      device: 'hw:1,0',
      format: 'S16LE'
    }
  },
  'none': {
    id: 'none',
    name: 'No HAT (Headphone Jack)',
    overlay: '# No HAT configured',
    testedbyBeatnik: false,
    testedByCommunity: false,
    camilla: {
      device: 'hw:0,0',
      format: 'S16LE'
    }
  }
};
