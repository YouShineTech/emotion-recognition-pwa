describe('Emotion Recognition PWA - Basic Functionality', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForServerHealth();
  });

  it('should load the application successfully', () => {
    cy.get('[data-testid="app-container"]').should('be.visible');
    cy.get('[data-testid="app-title"]').should('contain', 'Emotion Recognition');
  });

  it('should request camera and microphone permissions', () => {
    cy.grantMediaPermissions();
    cy.get('[data-testid="permission-request"]').should('be.visible');
    cy.get('[data-testid="grant-permissions"]').click();
    cy.get('[data-testid="video-element"]').should('be.visible');
  });

  it('should display camera feed when permissions are granted', () => {
    cy.grantMediaPermissions();
    cy.startVideoStream();
    cy.get('[data-testid="video-element"]').should('be.visible');
    cy.get('[data-testid="camera-status"]').should('contain', 'Active');
  });

  it('should establish WebRTC connection', () => {
    cy.mockWebRTCConnection();
    cy.grantMediaPermissions();
    cy.startVideoStream();
    cy.checkWebRTCStatus('connected');
  });

  it('should display emotion analysis overlay', () => {
    cy.mockEmotionResponse('happy', 0.9);
    cy.grantMediaPermissions();
    cy.startVideoStream();
    cy.waitForEmotionAnalysis();
    cy.get('[data-testid="emotion-overlay"]').should('be.visible');
  });

  it('should show correct emotion labels', () => {
    cy.mockEmotionResponse('surprised', 0.85);
    cy.grantMediaPermissions();
    cy.startVideoStream();
    cy.waitForEmotionAnalysis();
    cy.checkEmotion('surprised');
  });

  it('should handle permission denial gracefully', () => {
    cy.window().then((win) => {
      cy.stub(win.navigator.mediaDevices, 'getUserMedia').rejects(new Error('Permission denied'));
    });

    cy.get('[data-testid="grant-permissions"]').click();
    cy.get('[data-testid="error-message"]').should('contain', 'Camera access denied');
    cy.get('[data-testid="permission-fallback"]').should('be.visible');
  });

  it('should display loading states during processing', () => {
    cy.grantMediaPermissions();
    cy.startVideoStream();
    cy.get('[data-testid="processing-indicator"]').should('be.visible');
    cy.waitForLoading();
  });

  it('should be responsive on different screen sizes', () => {
    cy.viewport(375, 667); // Mobile
    cy.get('[data-testid="app-container"]').should('be.visible');

    cy.viewport(768, 1024); // Tablet
    cy.get('[data-testid="app-container"]').should('be.visible');

    cy.viewport(1920, 1080); // Desktop
    cy.get('[data-testid="app-container"]').should('be.visible');
  });

  it('should handle network disconnection gracefully', () => {
    cy.simulateNetworkConditions({ offline: true });
    cy.grantMediaPermissions();
    cy.startVideoStream();
    cy.get('[data-testid="offline-indicator"]').should('be.visible');
  });

  it('should provide PWA installation prompt', () => {
    cy.checkPWAInstallPrompt();
    cy.get('[data-testid="install-prompt"]').should('be.visible');
  });
});
