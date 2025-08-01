// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to grant camera and microphone permissions
Cypress.Commands.add('grantMediaPermissions', () => {
  cy.window().then((win) => {
    cy.stub(win.navigator.permissions, 'query').resolves({ state: 'granted' });
  });
});

// Custom command to mock WebRTC connection
Cypress.Commands.add('mockWebRTCConnection', () => {
  cy.window().then((win) => {
    // Mock RTCPeerConnection
    cy.stub(win, 'RTCPeerConnection').returns({
      createOffer: cy.stub().resolves({ sdp: 'mock-sdp-offer' }),
      createAnswer: cy.stub().resolves({ sdp: 'mock-sdp-answer' }),
      setLocalDescription: cy.stub().resolves(),
      setRemoteDescription: cy.stub().resolves(),
      addTrack: cy.stub(),
      addEventListener: cy.stub(),
      removeEventListener: cy.stub(),
      close: cy.stub(),
      connectionState: 'connected',
      iceConnectionState: 'connected'
    });
  });
});

// Custom command to wait for emotion analysis
Cypress.Commands.add('waitForEmotionAnalysis', (timeout = 10000) => {
  cy.get('[data-testid="emotion-overlay"]', { timeout }).should('be.visible');
});

// Custom command to check for specific emotion
Cypress.Commands.add('checkEmotion', (emotion) => {
  cy.get('[data-testid="emotion-label"]').should('contain', emotion);
});

// Custom command to start video stream
Cypress.Commands.add('startVideoStream', () => {
  cy.get('[data-testid="start-camera"]').click();
  cy.get('[data-testid="video-element"]').should('be.visible');
});

// Custom command to stop video stream
Cypress.Commands.add('stopVideoStream', () => {
  cy.get('[data-testid="stop-camera"]').click();
  cy.get('[data-testid="video-element"]').should('not.exist');
});

// Custom command to check WebRTC connection status
Cypress.Commands.add('checkWebRTCStatus', (expectedStatus = 'connected') => {
  cy.get('[data-testid="webrtc-status"]').should('contain', expectedStatus);
});

// Custom command to wait for server health
Cypress.Commands.add('waitForServerHealth', () => {
  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/health`,
    failOnStatusCode: false
  }).then((response) => {
    expect(response.status).to.be.oneOf([200, 503]);
  });
});

// Custom command to mock emotion analysis response
Cypress.Commands.add('mockEmotionResponse', (emotion = 'happy', confidence = 0.85) => {
  cy.intercept('POST', '/api/emotion/analyze', {
    statusCode: 200,
    body: {
      emotions: {
        primary: emotion,
        confidence: confidence,
        secondary: 'neutral'
      },
      facialFeatures: {
        landmarks: [],
        boundingBox: { x: 100, y: 100, width: 200, height: 200 }
      },
      audioFeatures: {
        emotion: emotion,
        confidence: confidence,
        pitch: 150,
        volume: 0.7
      },
      timestamp: Date.now(),
      sessionId: 'test-session-id'
    }
  }).as('emotionAnalysis');
});

// Custom command to check PWA installation prompt
Cypress.Commands.add('checkPWAInstallPrompt', () => {
  cy.window().then((win) => {
    cy.stub(win, 'beforeinstallprompt').returns({
      prompt: cy.stub().resolves(),
      userChoice: Promise.resolve({ outcome: 'accepted' })
    });
  });
});

// Custom command to simulate network conditions
Cypress.Commands.add('simulateNetworkConditions', (conditions = {}) => {
  const defaultConditions = {
    latency: 100,
    downloadThroughput: 1024 * 1024, // 1MB/s
    uploadThroughput: 512 * 1024, // 512KB/s
    offline: false
  };

  const finalConditions = { ...defaultConditions, ...conditions };

  cy.window().then((win) => {
    cy.stub(win.navigator, 'connection').value({
      effectiveType: finalConditions.offline ? 'none' : '4g',
      downlink: finalConditions.downloadThroughput / (1024 * 1024),
      rtt: finalConditions.latency
    });
  });
});

// Custom command to check for error messages
Cypress.Commands.add('checkErrorMessage', (expectedMessage) => {
  cy.get('[data-testid="error-message"]').should('contain', expectedMessage);
});

// Custom command to wait for loading state
Cypress.Commands.add('waitForLoading', (timeout = 10000) => {
  cy.get('[data-testid="loading-spinner"]', { timeout }).should('not.exist');
});

// Custom command to check accessibility
Cypress.Commands.add('checkAccessibility', () => {
  cy.injectAxe();
  cy.checkA11y();
});

// Override visit command to include custom setup
Cypress.Commands.overwrite('visit', (originalFn, url, options) => {
  return originalFn(url, {
    ...options,
    onBeforeLoad: (win) => {
      // Mock required APIs
      cy.stub(win.navigator.mediaDevices, 'getUserMedia').resolves({
        getTracks: () => [
          { kind: 'video', stop: cy.stub() },
          { kind: 'audio', stop: cy.stub() }
        ]
      });

      cy.stub(win.navigator.permissions, 'query').resolves({ state: 'granted' });

      // Call original onBeforeLoad if provided
      if (options && options.onBeforeLoad) {
        options.onBeforeLoad(win);
      }
    }
  });
});
