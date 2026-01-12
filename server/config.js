module.exports = {
  // Listen on all interfaces
  listenIp: '0.0.0.0',
  listenPort: 3016,
  
  mediasoup: {
    // Number of mediasoup workers to launch
    numWorkers: Object.keys(require('os').cpus()).length,
    
    // Worker settings
    worker: {
      rtcMinPort: 10000,
      rtcMaxPort: 10100,
      logLevel: 'warn',
      logTags: [
        'info',
        'ice',
        'dtls',
        'rtp',
        'srtp',
        'rtcp',
      ],
    },
    
    // Router settings
    router: {
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2
        },
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000,
          parameters: {
            'x-google-start-bitrate': 1000
          }
        },
      ]
    },
    
    // Transport settings
    webRtcTransport: {
      listenIps: [
        {
          ip: '0.0.0.0',
          announcedIp: '10.197.253.108' // ✅ Must be your Laptop's IP
        }
      ],
    }
  }
};