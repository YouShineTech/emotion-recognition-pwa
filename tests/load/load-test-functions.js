/**
 * Artillery Load Test Helper Functions
 * Provides utility functions for emotion recognition PWA load testing
 */

const crypto = require('crypto');

/**
 * Generate a random session ID
 */
function generateSessionId() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Generate mock frame data for testing
 */
function generateMockFrameData() {
  // Generate a small base64-encoded mock image data
  const mockImageData = Buffer.from('mock-image-data-for-testing').toString('base64');
  return mockImageData;
}

/**
 * Generate mock audio data for testing
 */
function generateMockAudioData() {
  // Generate a small base64-encoded mock audio data
  const mockAudioData = Buffer.from('mock-audio-data-for-testing').toString('base64');
  return mockAudioData;
}

/**
 * Generate a random emotion for testing
 */
function generateRandomEmotion() {
  const emotions = ['happy', 'sad', 'angry', 'surprised', 'fearful', 'disgusted', 'neutral'];
  return emotions[Math.floor(Math.random() * emotions.length)];
}

/**
 * Generate mock emotion analysis response
 */
function generateMockEmotionResponse() {
  return {
    emotions: {
      primary: generateRandomEmotion(),
      confidence: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
      secondary: emotions.filter(e => e !== generateRandomEmotion())[Math.floor(Math.random() * 6)]
    },
    facialFeatures: {
      landmarks: Array.from({length: 68}, (_, i) => ({x: Math.random() * 640, y: Math.random() * 480})),
      boundingBox: {
        x: Math.random() * 400,
        y: Math.random() * 300,
        width: Math.random() * 200 + 100,
        height: Math.random() * 200 + 100
      }
    },
    audioFeatures: {
      emotion: generateRandomEmotion(),
      confidence: Math.random() * 0.5 + 0.5,
      pitch: Math.random() * 200 + 100,
      volume: Math.random() * 0.5 + 0.5
    },
    timestamp: Date.now(),
    sessionId: generateSessionId()
  };
}

/**
 * Generate mock SDP offer for WebRTC testing
 */
function generateMockSDPOffer() {
  return `v=0
o=- ${Date.now()} 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0
a=msid-semantic: WMS
m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 102
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:${crypto.randomBytes(4).toString('hex')}
a=ice-pwd:${crypto.randomBytes(16).toString('hex')}
a=ice-options:trickle
a=fingerprint:sha-256 ${crypto.randomBytes(32).toString('hex')}
a=setup:actpass
a=mid:0
a=extmap:1 urn:ietf:params:rtp-hdrext:toffset
a=extmap:2 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time
a=extmap:3 urn:3gpp:video-orientation
a=extmap:4 http://www.ietf.org/id/draft-holmer-rmcat-transport-wide-cc-extensions-01
a=extmap:5 http://www.webrtc.org/experiments/rtp-hdrext/playout-delay
a=extmap:6 http://www.webrtc.org/experiments/rtp-hdrext/video-content-type
a=extmap:7 http://www.webrtc.org/experiments/rtp-hdrext/video-timing
a=extmap:8 http://www.webrtc.org/experiments/rtp-hdrext/color-space
a=sendrecv
a=rtcp-mux
a=rtcp-rsize
a=rtpmap:96 VP8/90000
a=rtcp-fb:96 goog-remb
a=rtcp-fb:96 transport-cc
a=rtcp-fb:96 ccm fir
a=rtcp-fb:96 nack
a=rtcp-fb:96 nack pli
a=rtpmap:97 rtx/90000
a=fmtp:97 apt=96
a=rtpmap:98 VP9/90000
a=rtcp-fb:98 goog-remb
a=rtcp-fb:98 transport-cc
a=rtcp-fb:98 ccm fir
a=rtcp-fb:98 nack
a=rtcp-fb:98 nack pli
a=rtpmap:99 rtx/90000
a=fmtp:99 apt=98
a=rtpmap:100 H264/90000
a=rtcp-fb:100 goog-remb
a=rtcp-fb:100 transport-cc
a=rtcp-fb:100 ccm fir
a=rtcp-fb:100 nack
a=rtcp-fb:100 nack pli
a=rtpmap:101 rtx/90000
a=fmtp:101 apt=100
a=rtpmap:102 red/90000
a=rtpmap:103 rtx/90000
a=fmtp:103 apt=102
a=ssrc-group:FID 1234567890 1234567891
a=ssrc:1234567890 cname:test
a=ssrc:1234567890 msid:test test
a=ssrc:1234567890 mslabel:test
a=ssrc:1234567890 label:test
a=ssrc:1234567891 cname:test
a=ssrc:1234567891 msid:test test
a=ssrc:1234567891 mslabel:test
a=ssrc:1234567891 label:test`;
}

/**
 * Pre-request hook to set up test data
 */
function beforeRequest(requestParams, context, ee, next) {
  // Generate session ID if not exists
  if (!context.vars.sessionId) {
    context.vars.sessionId = generateSessionId();
  }

  // Generate user ID if not exists
  if (!context.vars.userId) {
    context.vars.userId = `user-${Math.floor(Math.random() * 10000)}`;
  }

  // Generate mock data for emotion analysis
  if (requestParams.json && requestParams.json.frameData === 'base64-encoded-frame-data') {
    requestParams.json.frameData = generateMockFrameData();
  }

  if (requestParams.json && requestParams.json.audioData === 'base64-encoded-audio-data') {
    requestParams.json.audioData = generateMockAudioData();
  }

  // Generate SDP offer for WebRTC tests
  if (requestParams.json && requestParams.json.sdp === 'test-sdp-offer') {
    requestParams.json.sdp = generateMockSDPOffer();
  }

  next();
}

/**
 * Response validation hook
 */
function afterResponse(requestParams, response, context, ee, next) {
  // Log response time for performance monitoring
  if (response.timings && response.timings.phases) {
    console.log(`Response time: ${response.timings.phases.firstByte}ms`);
  }

  // Validate emotion analysis response structure
  if (response.body && response.body.emotions) {
    if (!response.body.emotions.primary || !response.body.emotions.confidence) {
      console.warn('Invalid emotion response structure');
    }
  }

  next();
}

module.exports = {
  beforeRequest,
  afterResponse,
  generateSessionId,
  generateMockFrameData,
  generateMockAudioData,
  generateRandomEmotion,
  generateMockEmotionResponse,
  generateMockSDPOffer
};
