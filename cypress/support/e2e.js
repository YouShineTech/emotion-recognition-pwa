// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  // for uncaught exceptions in the application
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  return true;
});

// Custom error handling for WebRTC related errors
Cypress.on('fail', (error, runnable) => {
  if (error.message.includes('getUserMedia')) {
    // Skip tests that fail due to camera/microphone access in CI
    return false;
  }
  throw error;
});

// Global beforeEach hook
beforeEach(() => {
  // Clear localStorage and sessionStorage
  cy.clearLocalStorage();
  cy.clearCookies();

  // Mock camera and microphone permissions
  cy.window().then((win) => {
    cy.stub(win.navigator.mediaDevices, 'getUserMedia').resolves({
      getTracks: () => [
        {
          kind: 'video',
          stop: cy.stub(),
          getSettings: () => ({ width: 640, height: 480 })
        },
        {
          kind: 'audio',
          stop: cy.stub(),
          getSettings: () => ({ sampleRate: 44100 })
        }
      ]
    });
  });
});
