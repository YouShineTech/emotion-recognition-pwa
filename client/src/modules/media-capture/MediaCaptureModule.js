"use strict";
/**
 * Media Capture Module
 *
 * Handles camera and microphone access using getUserMedia API
 * Provides device enumeration, switching, and error handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaCaptureModule = void 0;
class MediaCaptureModule {
    currentStream = null;
    devices = [];
    config;
    eventListeners = new Map();
    constructor(config = {}) {
        this.config = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 },
                facingMode: 'user',
                ...config.video,
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                ...config.audio,
            },
        };
        this.setupDeviceChangeListener();
    }
    /**
     * Request permissions for media access
     */
    async requestPermissions() {
        try {
            await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const devices = await this.enumerateDevices();
            return { success: true, availableDevices: devices };
        }
        catch (error) {
            const captureError = this.handleMediaError(error);
            return { success: false, error: captureError.message };
        }
    }
    /**
     * Start media capture with given configuration
     */
    async startCapture(config) {
        if (config) {
            this.updateConfig(config);
        }
        return this.initialize();
    }
    /**
     * Stop media capture
     */
    stopCapture() {
        this.stop();
    }
    /**
     * Initialize media capture and get user media stream
     */
    async initialize() {
        try {
            await this.enumerateDevices();
            this.currentStream = await navigator.mediaDevices.getUserMedia(this.config);
            this.emit('streamStarted', this.currentStream);
            return this.currentStream;
        }
        catch (error) {
            const captureError = this.handleMediaError(error);
            this.emit('error', captureError);
            throw captureError;
        }
    }
    /**
     * Stop current media stream and cleanup resources
     */
    stop() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => {
                track.stop();
            });
            this.currentStream = null;
            this.emit('streamStopped');
        }
    }
    /**
     * Switch to a different camera device
     */
    async switchCamera(deviceId) {
        try {
            this.stop();
            const newConfig = {
                ...this.config,
                video: {
                    ...this.config.video,
                    deviceId: { exact: deviceId },
                },
            };
            this.currentStream = await navigator.mediaDevices.getUserMedia(newConfig);
            this.emit('deviceSwitched', { type: 'video', deviceId });
            return this.currentStream;
        }
        catch (error) {
            const captureError = this.handleMediaError(error);
            this.emit('error', captureError);
            throw captureError;
        }
    }
    /**
     * Switch to a different microphone device
     */
    async switchMicrophone(deviceId) {
        try {
            this.stop();
            const newConfig = {
                ...this.config,
                audio: {
                    ...this.config.audio,
                    deviceId: { exact: deviceId },
                },
            };
            this.currentStream = await navigator.mediaDevices.getUserMedia(newConfig);
            this.emit('deviceSwitched', { type: 'audio', deviceId });
            return this.currentStream;
        }
        catch (error) {
            const captureError = this.handleMediaError(error);
            this.emit('error', captureError);
            throw captureError;
        }
    }
    /**
     * Get list of available media devices
     */
    async enumerateDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.devices = devices.map(device => ({
                deviceId: device.deviceId,
                label: device.label || `${device.kind} ${device.deviceId.slice(0, 8)}`,
                kind: device.kind,
                groupId: device.groupId,
            }));
            return this.devices;
        }
        catch {
            const captureError = {
                name: 'DeviceEnumerationError',
                message: 'Failed to enumerate media devices',
                code: 'DEVICE_ENUMERATION_FAILED',
            };
            this.emit('error', captureError);
            throw captureError;
        }
    }
    /**
     * Get current media stream
     */
    getCurrentStream() {
        return this.currentStream;
    }
    /**
     * Get available devices
     */
    getDevices() {
        return this.devices;
    }
    /**
     * Update capture configuration
     */
    updateConfig(newConfig) {
        this.config = {
            ...this.config,
            ...newConfig,
            video: { ...this.config.video, ...newConfig.video },
            audio: { ...this.config.audio, ...newConfig.audio },
        };
    }
    /**
     * Add event listener
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    /**
     * Remove event listener
     */
    off(event, callback) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    /**
     * Emit event to listeners
     */
    emit(event, data) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(callback => callback(data));
        }
    }
    /**
     * Handle media errors and convert to CaptureError
     */
    handleMediaError(error) {
        switch (error.name) {
            case 'NotAllowedError':
                return {
                    name: 'PermissionDeniedError',
                    message: 'Camera/microphone access denied by user',
                    code: 'PERMISSION_DENIED',
                };
            case 'NotFoundError':
                return {
                    name: 'DeviceNotFoundError',
                    message: 'No camera or microphone found',
                    code: 'DEVICE_NOT_FOUND',
                };
            case 'OverconstrainedError':
                return {
                    name: 'ConstraintError',
                    message: 'Camera/microphone constraints cannot be satisfied',
                    code: 'CONSTRAINT_NOT_SATISFIED',
                };
            case 'NotReadableError':
                return {
                    name: 'DeviceInUseError',
                    message: 'Camera/microphone is already in use',
                    code: 'DEVICE_IN_USE',
                };
            default:
                return {
                    name: 'UnknownError',
                    message: error.message || 'Unknown media capture error',
                    code: 'UNKNOWN_ERROR',
                };
        }
    }
    /**
     * Setup device change listener
     */
    setupDeviceChangeListener() {
        if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
            navigator.mediaDevices.addEventListener('devicechange', async () => {
                await this.enumerateDevices();
                this.emit('devicesChanged', this.devices);
            });
        }
    }
    /**
     * Check if media capture is supported
     */
    static isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }
    /**
     * Get supported constraints
     */
    static async getSupportedConstraints() {
        if (navigator.mediaDevices && navigator.mediaDevices.getSupportedConstraints) {
            return navigator.mediaDevices.getSupportedConstraints();
        }
        return {};
    }
}
exports.MediaCaptureModule = MediaCaptureModule;
exports.default = MediaCaptureModule;
//# sourceMappingURL=MediaCaptureModule.js.map