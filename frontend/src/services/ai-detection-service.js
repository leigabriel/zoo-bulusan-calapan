/**
 * AI Animal Detection Service
 * 
 * This service provides a unified interface for animal detection
 * using either a local TensorFlow.js model or the AnimalDetect API.
 * 
 * Pipeline Overview:
 * 1. Image validation and preprocessing
 * 2. API request with proper formatting
 * 3. Response parsing and normalization
 * 4. Fallback to local model if API fails
 */

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import { 
    AI_SOURCE, 
    ANIMAL_DETECT_CONFIG, 
    BACKEND_PROXY_CONFIG,
    LOCAL_MODEL_CONFIG,
    ANIMAL_CLASSES,
    getAnimalInfo,
    normalizeResponse 
} from '../config/ai-service-config';

// ============================================
// Logging System for Debugging
// ============================================
const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

// Set to DEBUG for full logging, INFO for production
const CURRENT_LOG_LEVEL = LOG_LEVELS.DEBUG;

const log = {
    debug: (...args) => CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG && console.log('[AI-Detection][DEBUG]', ...args),
    info: (...args) => CURRENT_LOG_LEVEL <= LOG_LEVELS.INFO && console.log('[AI-Detection][INFO]', ...args),
    warn: (...args) => CURRENT_LOG_LEVEL <= LOG_LEVELS.WARN && console.warn('[AI-Detection][WARN]', ...args),
    error: (...args) => CURRENT_LOG_LEVEL <= LOG_LEVELS.ERROR && console.error('[AI-Detection][ERROR]', ...args),
};

// ============================================
// Error Types for better debugging
// ============================================
export const ErrorTypes = {
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    API_ERROR: 'API_ERROR',
    INVALID_IMAGE: 'INVALID_IMAGE',
    IMAGE_TOO_LARGE: 'IMAGE_TOO_LARGE',
    UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
    EMPTY_RESULT: 'EMPTY_RESULT',
    MODEL_ERROR: 'MODEL_ERROR',
    NO_ANIMAL_DETECTED: 'NO_ANIMAL_DETECTED',
    LOW_CONFIDENCE: 'LOW_CONFIDENCE',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// User-friendly error messages
const ErrorMessages = {
    [ErrorTypes.NETWORK_ERROR]: 'Network connection failed. Please check your internet and try again.',
    [ErrorTypes.TIMEOUT_ERROR]: 'The request timed out. Please try again.',
    [ErrorTypes.API_ERROR]: 'The detection service is temporarily unavailable. Using local AI instead.',
    [ErrorTypes.INVALID_IMAGE]: 'The image could not be processed. Please try a different image.',
    [ErrorTypes.IMAGE_TOO_LARGE]: 'Image is too large. Please use an image under 10MB.',
    [ErrorTypes.UNSUPPORTED_FORMAT]: 'Unsupported image format. Please use JPG, PNG, or WebP.',
    [ErrorTypes.EMPTY_RESULT]: 'No animal detected in this image. Try a clearer photo.',
    [ErrorTypes.MODEL_ERROR]: 'AI model error. Please refresh and try again.',
    [ErrorTypes.NO_ANIMAL_DETECTED]: 'Could not identify an animal in this image. Try a different angle or clearer photo.',
    [ErrorTypes.LOW_CONFIDENCE]: 'Detection confidence is too low. Try a clearer image.',
    [ErrorTypes.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.'
};

// Supported image formats
const SUPPORTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_CONFIDENCE_THRESHOLD = 0.1; // 10% minimum confidence

// Cache for the local model
let cachedModel = null;
let modelLoading = false;
let modelLoadPromise = null;

/**
 * Load and cache the local TensorFlow model
 * @returns {Promise<tf.LayersModel>} The loaded model
 */
export const loadLocalModel = async () => {
    if (cachedModel) return cachedModel;
    
    if (modelLoading) {
        return modelLoadPromise;
    }
    
    modelLoading = true;
    modelLoadPromise = (async () => {
        try {
            await tf.ready();
            const model = await tf.loadLayersModel(LOCAL_MODEL_CONFIG.modelPath);
            
            // Warmup GPU
            const zero = tf.zeros([1, LOCAL_MODEL_CONFIG.inputSize, LOCAL_MODEL_CONFIG.inputSize, 3]);
            model.predict(zero).dispose();
            zero.dispose();
            
            cachedModel = model;
            return model;
        } catch (error) {
            console.error('Failed to load local model:', error);
            throw error;
        } finally {
            modelLoading = false;
        }
    })();
    
    return modelLoadPromise;
};

/**
 * Check if the model is ready
 * @returns {boolean} Whether the model is loaded
 */
export const isModelReady = () => {
    if (AI_SOURCE === 'animaldetect') return true; // API doesn't need preloading
    return cachedModel !== null;
};

/**
 * Check if the model is currently loading
 * @returns {boolean} Whether the model is loading
 */
export const isModelLoading = () => {
    if (AI_SOURCE === 'animaldetect') return false;
    return modelLoading;
};

/**
 * Run prediction using local TensorFlow model
 * @param {HTMLImageElement} imageElement - The image element to analyze
 * @returns {Promise<Object>} Prediction result
 */
const runLocalPrediction = async (imageElement) => {
    log.info('Running local TensorFlow prediction...');
    
    try {
        const model = await loadLocalModel();
        
        // Convert image element to proper format if needed
        let imgSource = imageElement;
        if (typeof imageElement === 'string') {
            // If it's a data URL, create an image element
            imgSource = new Image();
            await new Promise((resolve, reject) => {
                imgSource.onload = resolve;
                imgSource.onerror = reject;
                imgSource.src = imageElement;
            });
        }
        
        const tensor = tf.tidy(() => {
            const img = tf.browser.fromPixels(imgSource);
            const resized = tf.image.resizeBilinear(img, [LOCAL_MODEL_CONFIG.inputSize, LOCAL_MODEL_CONFIG.inputSize]);
            return resized.expandDims(0).div(255.0);
        });
        
        const predictions = await model.predict(tensor).data();
        const maxConfidence = Math.max(...predictions);
        const predictedIndex = predictions.indexOf(maxConfidence);
        const animalName = ANIMAL_CLASSES[predictedIndex] || 'Unknown';
        const confidencePct = (maxConfidence * 100).toFixed(1);
        
        tf.dispose(tensor);
        
        log.info('Local prediction result:', { animal: animalName, confidence: confidencePct + '%' });
        
        // Don't include description - let the caller fetch it from Wikipedia
        const info = getAnimalInfo(animalName);
        
        return {
            success: true,
            animal: animalName,
            confidence: confidencePct,
            description: '', // Empty - Wikipedia will provide this
            category: info.category,
            isBulusanAnimal: info.bulusan,
            rawConfidence: maxConfidence,
            source: 'local'
        };
    } catch (error) {
        log.error('Local prediction error:', error);
        throw {
            type: ErrorTypes.MODEL_ERROR,
            message: ErrorMessages[ErrorTypes.MODEL_ERROR],
            originalError: error
        };
    }
};

/**
 * Validate image before processing
 * @param {HTMLImageElement|string} imageSource - Image element or data URL
 * @returns {Object} Validation result { valid: boolean, error?: string, errorType?: string }
 */
const validateImage = (imageSource) => {
    log.debug('Validating image source type:', typeof imageSource);
    
    // For data URLs, check the format
    if (typeof imageSource === 'string') {
        if (!imageSource.startsWith('data:image/')) {
            log.warn('Invalid image: not a data URL');
            return { valid: false, error: ErrorMessages[ErrorTypes.INVALID_IMAGE], errorType: ErrorTypes.INVALID_IMAGE };
        }
        
        // Extract MIME type from data URL
        const mimeMatch = imageSource.match(/data:([^;]+);/);
        const mimeType = mimeMatch ? mimeMatch[1] : null;
        log.debug('Image MIME type:', mimeType);
        
        if (mimeType && !SUPPORTED_FORMATS.includes(mimeType)) {
            log.warn('Unsupported format:', mimeType);
            return { valid: false, error: ErrorMessages[ErrorTypes.UNSUPPORTED_FORMAT], errorType: ErrorTypes.UNSUPPORTED_FORMAT };
        }
        
        // Check approximate size (base64 is ~33% larger)
        const base64Data = imageSource.split(',')[1];
        if (!base64Data || base64Data.length === 0) {
            log.warn('Empty base64 data');
            return { valid: false, error: ErrorMessages[ErrorTypes.INVALID_IMAGE], errorType: ErrorTypes.INVALID_IMAGE };
        }
        
        const approximateSize = (base64Data.length * 3) / 4;
        log.debug('Approximate image size:', Math.round(approximateSize / 1024), 'KB');
        
        if (approximateSize > MAX_IMAGE_SIZE) {
            log.warn('Image too large:', Math.round(approximateSize / 1024 / 1024), 'MB');
            return { valid: false, error: ErrorMessages[ErrorTypes.IMAGE_TOO_LARGE], errorType: ErrorTypes.IMAGE_TOO_LARGE };
        }
    }
    
    // For HTMLImageElement
    if (imageSource instanceof HTMLImageElement) {
        if (!imageSource.complete || imageSource.naturalWidth === 0) {
            log.warn('Image element not loaded or empty');
            return { valid: false, error: ErrorMessages[ErrorTypes.INVALID_IMAGE], errorType: ErrorTypes.INVALID_IMAGE };
        }
        log.debug('Image dimensions:', imageSource.naturalWidth, 'x', imageSource.naturalHeight);
    }
    
    log.debug('Image validation passed');
    return { valid: true };
};

/**
 * Convert image element or data URL to base64 with preprocessing
 * @param {HTMLImageElement|string} imageSource - Image element or data URL
 * @param {Object} options - Conversion options
 * @param {number} options.maxDimension - Max width/height (default: 1024)
 * @param {number} options.quality - JPEG quality 0-1 (default: 0.85)
 * @returns {Promise<{base64: string, mimeType: string, width: number, height: number}>}
 */
const imageToBase64 = async (imageSource, options = {}) => {
    const { maxDimension = 1024, quality = 0.85 } = options;
    
    try {
        log.debug('Converting image to base64...');
        
        // If already a data URL, we may still need to resize
        let img;
        if (typeof imageSource === 'string' && imageSource.startsWith('data:')) {
            // Create an image element from data URL for potential resize
            img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error('Failed to load image from data URL'));
                img.src = imageSource;
            });
        } else if (imageSource instanceof HTMLImageElement) {
            img = imageSource;
        } else {
            throw new Error('Invalid image source type');
        }
        
        // Calculate resize dimensions while maintaining aspect ratio
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;
        
        log.debug('Original dimensions:', width, 'x', height);
        
        // Resize if needed
        if (width > maxDimension || height > maxDimension) {
            const ratio = Math.min(maxDimension / width, maxDimension / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
            log.debug('Resized dimensions:', width, 'x', height);
        }
        
        // Ensure minimum dimensions
        width = Math.max(width, 64);
        height = Math.max(height, 64);
        
        // Create canvas and draw image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Use high-quality image scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw white background (for transparent images)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        
        // Draw the image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG for consistent format
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64 = dataUrl.split(',')[1];
        
        log.debug('Base64 conversion complete, size:', Math.round(base64.length / 1024), 'KB');
        
        return { 
            base64,
            mimeType: 'image/jpeg',
            width,
            height,
            dataUrl
        };
    } catch (error) {
        log.error('Image conversion error:', error);
        throw {
            type: ErrorTypes.INVALID_IMAGE,
            message: ErrorMessages[ErrorTypes.INVALID_IMAGE],
            originalError: error
        };
    }
};

/**
 * Convert base64 to Blob for multipart/form-data
 * @param {string} base64 - Base64 encoded image
 * @param {string} mimeType - MIME type of the image
 * @returns {Blob} Image blob
 */
const base64ToBlob = (base64, mimeType = 'image/jpeg') => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
};

/**
 * Run prediction using Backend Proxy (recommended approach - avoids CORS)
 * The backend handles the AnimalDetect API call with secure API key storage
 * @param {HTMLImageElement|string} imageSource - Image element or data URL
 * @returns {Promise<Object>} Prediction result
 */
const runBackendProxyPrediction = async (imageSource) => {
    let timeoutId = null;
    
    try {
        log.info('=== Starting Backend Proxy Detection ===');
        log.info('Endpoint:', BACKEND_PROXY_CONFIG.detectUrl);
        
        // Validate image first
        const validation = validateImage(imageSource);
        if (!validation.valid) {
            throw {
                type: validation.errorType,
                message: validation.error
            };
        }
        
        // Convert image with preprocessing
        const { base64, mimeType, width, height, dataUrl } = await imageToBase64(imageSource, {
            maxDimension: 1024,
            quality: 0.9
        });
        
        log.info('Image preprocessed:', {
            size: Math.round(base64.length / 1024) + 'KB',
            dimensions: `${width}x${height}`,
            mimeType
        });
        
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), BACKEND_PROXY_CONFIG.timeout);
        
        // Build multipart/form-data request for backend
        const formData = new FormData();
        const blob = base64ToBlob(base64, mimeType);
        formData.append('image', blob, 'image.jpg');
        
        log.debug('FormData prepared for backend:', { blobSize: blob.size, blobType: blob.type });
        
        // Send to backend proxy (no API key needed - backend handles it)
        const response = await fetch(BACKEND_PROXY_CONFIG.detectUrl, {
            method: 'POST',
            body: formData,
            signal: controller.signal,
            credentials: 'include' // Include cookies for auth if needed
        });
        
        clearTimeout(timeoutId);
        timeoutId = null;
        
        log.info('Backend response:', { status: response.status, statusText: response.statusText });
        
        // Get response
        const responseText = await response.text();
        log.debug('Raw backend response:', responseText.substring(0, 500));
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            log.error('JSON parse error:', parseError.message);
            throw {
                type: ErrorTypes.API_ERROR,
                message: 'Invalid response from detection service',
                rawResponse: responseText.substring(0, 200)
            };
        }
        
        // Check for backend error responses
        if (!response.ok) {
            log.error('Backend returned error:', response.status, data);
            
            // Check if backend suggests fallback
            if (data.shouldFallback) {
                throw {
                    type: data.errorType || ErrorTypes.API_ERROR,
                    message: data.message || data.error || 'Detection service unavailable',
                    shouldFallback: true
                };
            }
            
            throw {
                type: data.errorType || ErrorTypes.API_ERROR,
                message: data.message || data.error || `Server returned ${response.status}`,
                status: response.status
            };
        }
        
        // Process successful response
        log.info('Backend detection result:', { 
            animal: data.animalName, 
            confidence: data.confidence,
            source: data.source 
        });
        
        // Validate result
        if (!data.success) {
            log.warn('Detection unsuccessful:', data);
            
            if (data.shouldFallback) {
                throw {
                    type: ErrorTypes.EMPTY_RESULT,
                    message: data.message || 'No animal detected',
                    shouldFallback: true
                };
            }
            
            return {
                success: false,
                animal: 'Unknown',
                confidence: '0',
                error: data.message || 'Detection unsuccessful',
                errorType: data.errorType || ErrorTypes.EMPTY_RESULT,
                source: 'backend'
            };
        }
        
        // Get additional info from local database (category, bulusan status only)
        const info = getAnimalInfo(data.animalName);
        
        return {
            success: true,
            animal: data.animalName,
            confidence: String(data.confidence),
            description: '', // Empty - Wikipedia will provide this
            category: data.category || info.category,
            isBulusanAnimal: info.bulusan,
            scientificName: data.scientificName || null,
            source: 'backend-animaldetect',
            processingTime: data.processingTime
        };
        
    } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        
        // Handle abort/timeout
        if (error.name === 'AbortError') {
            log.error('Backend request timed out after', BACKEND_PROXY_CONFIG.timeout, 'ms');
            throw {
                type: ErrorTypes.TIMEOUT_ERROR,
                message: ErrorMessages[ErrorTypes.TIMEOUT_ERROR],
                shouldFallback: true
            };
        }
        
        // Handle network errors (backend unreachable)
        if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed'))) {
            log.error('Network error (backend unreachable):', error.message);
            throw {
                type: ErrorTypes.NETWORK_ERROR,
                message: 'Could not connect to detection service. Using local AI.',
                shouldFallback: true,
                originalError: error
            };
        }
        
        // Re-throw structured errors
        if (error.type) {
            throw error;
        }
        
        // Unknown errors
        log.error('Unexpected backend error:', error);
        throw {
            type: ErrorTypes.UNKNOWN_ERROR,
            message: error.message || ErrorMessages[ErrorTypes.UNKNOWN_ERROR],
            shouldFallback: true,
            originalError: error
        };
    }
};

/**
 * Run prediction using AnimalDetect API with retry and fallback
 * @param {HTMLImageElement|string} imageSource - Image element or data URL
 * @param {number} retryCount - Number of retries attempted
 * @returns {Promise<Object>} Prediction result
 */
const runAnimalDetectPrediction = async (imageSource, retryCount = 0) => {
    const MAX_RETRIES = 2;
    let timeoutId = null;
    
    try {
        log.info('Starting AnimalDetect prediction, attempt:', retryCount + 1);
        
        // Validate image first
        const validation = validateImage(imageSource);
        if (!validation.valid) {
            throw {
                type: validation.errorType,
                message: validation.error
            };
        }
        
        // Convert image with preprocessing
        const { base64, mimeType, width, height, dataUrl } = await imageToBase64(imageSource, {
            maxDimension: 1024,
            quality: 0.9
        });
        
        log.info('Image preprocessed:', {
            size: Math.round(base64.length / 1024) + 'KB',
            dimensions: `${width}x${height}`,
            mimeType
        });
        
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), ANIMAL_DETECT_CONFIG.timeout);
        
        // Build multipart/form-data request
        const formData = new FormData();
        const blob = base64ToBlob(base64, mimeType);
        const filename = 'image.jpg';
        
        formData.append('image', blob, filename);
        log.debug('FormData prepared:', { blobSize: blob.size, blobType: blob.type, filename });
        
        // Add threshold parameter if configured
        if (ANIMAL_DETECT_CONFIG.threshold) {
            formData.append('threshold', String(ANIMAL_DETECT_CONFIG.threshold));
        }
        
        // Prepare headers
        const headers = {};
        
        // Add API key (required for most services)
        if (ANIMAL_DETECT_CONFIG.apiKey) {
            headers['Authorization'] = `Bearer ${ANIMAL_DETECT_CONFIG.apiKey}`;
            headers['X-API-Key'] = ANIMAL_DETECT_CONFIG.apiKey; // Some APIs use this instead
            log.debug('API key configured (length:', ANIMAL_DETECT_CONFIG.apiKey.length + ')');
        } else {
            log.warn('No API key configured! Detection may fail.');
        }
        
        const apiUrl = `${ANIMAL_DETECT_CONFIG.baseUrl}/detect`;
        log.info('Sending request to:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: formData,
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        timeoutId = null;
        
        log.info('Response received:', { status: response.status, statusText: response.statusText });
        log.debug('Response headers:', Object.fromEntries(response.headers.entries()));
        
        // Get raw response text for debugging
        const responseText = await response.text();
        log.debug('Raw response body:', responseText.substring(0, 500));
        
        if (!response.ok) {
            log.error('API returned error:', response.status, responseText);
            
            // Try JSON endpoint as fallback before giving up
            if (retryCount === 0 && response.status !== 401 && response.status !== 403) {
                log.info('Trying JSON format as fallback...');
                return await runAnimalDetectWithJSON(imageSource, base64);
            }
            
            throw {
                type: ErrorTypes.API_ERROR,
                message: `API returned ${response.status}: ${responseText.substring(0, 100)}`,
                status: response.status
            };
        }
        
        // Parse JSON response
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            log.error('JSON parse error:', parseError, 'Raw:', responseText.substring(0, 200));
            throw {
                type: ErrorTypes.API_ERROR,
                message: 'Invalid JSON response from API',
                rawResponse: responseText.substring(0, 200)
            };
        }
        
        log.info('Parsed API response:', JSON.stringify(data, null, 2));
        
        // Check for empty or invalid response
        if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
            log.warn('Empty response from API');
            throw {
                type: ErrorTypes.EMPTY_RESULT,
                message: ErrorMessages[ErrorTypes.EMPTY_RESULT]
            };
        }
        
        // Normalize the response
        const result = normalizeResponse(data, 'animaldetect');
        
        // Validate the normalized result
        if (!result.success || result.animal === 'Unknown' || parseFloat(result.confidence) < MIN_CONFIDENCE_THRESHOLD * 100) {
            log.warn('Low confidence or unknown result:', result);
            
            // If confidence is very low, it might be a false positive
            if (result.animal !== 'Unknown' && parseFloat(result.confidence) < MIN_CONFIDENCE_THRESHOLD * 100) {
                result.warning = 'Detection confidence is low. Results may be inaccurate.';
            }
        }
        
        result.source = 'animaldetect';
        log.info('Final result:', { animal: result.animal, confidence: result.confidence, source: result.source });
        
        return result;
        
    } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        
        // Handle abort/timeout
        if (error.name === 'AbortError') {
            log.error('Request timed out after', ANIMAL_DETECT_CONFIG.timeout, 'ms');
            if (retryCount < MAX_RETRIES) {
                log.info(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
                return runAnimalDetectPrediction(imageSource, retryCount + 1);
            }
            throw {
                type: ErrorTypes.TIMEOUT_ERROR,
                message: ErrorMessages[ErrorTypes.TIMEOUT_ERROR]
            };
        }
        
        // Handle network errors
        if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('network'))) {
            log.error('Network error:', error.message);
            throw {
                type: ErrorTypes.NETWORK_ERROR,
                message: ErrorMessages[ErrorTypes.NETWORK_ERROR],
                originalError: error
            };
        }
        
        // Re-throw structured errors
        if (error.type) {
            throw error;
        }
        
        // Unknown errors
        log.error('Unexpected error:', error);
        throw {
            type: ErrorTypes.UNKNOWN_ERROR,
            message: ErrorMessages[ErrorTypes.UNKNOWN_ERROR],
            originalError: error
        };
    }
};

/**
 * Alternative API call using JSON format (fallback for multipart issues)
 * @param {HTMLImageElement|string} imageSource - Image source
 * @param {string} base64 - Base64 encoded image
 * @returns {Promise<Object>} Prediction result
 */
const runAnimalDetectWithJSON = async (imageSource, base64) => {
    log.info('Attempting JSON format API call...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ANIMAL_DETECT_CONFIG.timeout);
    
    try {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (ANIMAL_DETECT_CONFIG.apiKey) {
            headers['Authorization'] = `Bearer ${ANIMAL_DETECT_CONFIG.apiKey}`;
            headers['X-API-Key'] = ANIMAL_DETECT_CONFIG.apiKey;
        }
        
        const apiUrl = `${ANIMAL_DETECT_CONFIG.baseUrl}/detect`;
        log.debug('JSON API request to:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                image: base64,
                format: 'base64',
                threshold: ANIMAL_DETECT_CONFIG.threshold
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const responseText = await response.text();
        log.debug('JSON API response:', response.status, responseText.substring(0, 300));
        
        if (!response.ok) {
            throw {
                type: ErrorTypes.API_ERROR,
                message: `API returned ${response.status}: ${responseText.substring(0, 100)}`,
                status: response.status
            };
        }
        
        const data = JSON.parse(responseText);
        const result = normalizeResponse(data, 'animaldetect');
        result.source = 'animaldetect';
        
        log.info('JSON API result:', { animal: result.animal, confidence: result.confidence });
        return result;
        
    } catch (error) {
        clearTimeout(timeoutId);
        log.error('JSON API call failed:', error);
        throw error;
    }
};

/**
 * Detect animal in image using configured AI source with automatic fallback
 * @param {HTMLImageElement|string} imageSource - Image element or data URL
 * @param {Object} options - Detection options
 * @param {boolean} options.enableFallback - Enable fallback to local model if API fails (uses config default)
 * @returns {Promise<Object>} Detection result in unified format
 */
export const detectAnimal = async (imageSource, options = {}) => {
    log.info('=== Starting Animal Detection ===');
    log.info('AI Source:', AI_SOURCE);
    
    // Use config fallback setting if not explicitly provided
    const enableFallback = options.enableFallback ?? BACKEND_PROXY_CONFIG.enableFallback ?? true;
    
    // Validate image first
    const validation = validateImage(imageSource);
    if (!validation.valid) {
        log.error('Image validation failed:', validation.error);
        return {
            success: false,
            error: validation.error,
            errorType: validation.errorType
        };
    }
    
    // Backend proxy mode (recommended - avoids CORS issues)
    if (AI_SOURCE === 'backend') {
        try {
            log.info('Using Backend Proxy → AnimalDetect API...');
            const result = await runBackendProxyPrediction(imageSource);
            log.info('Detection complete:', { animal: result.animal, confidence: result.confidence });
            return result;
        } catch (error) {
            log.error('Backend proxy failed:', error.type || error.message);
            
            // Only fallback if explicitly allowed and error suggests it
            if (enableFallback && (error.shouldFallback || error.type === ErrorTypes.NETWORK_ERROR || error.type === ErrorTypes.TIMEOUT_ERROR)) {
                log.info('Attempting fallback to local model...');
                try {
                    // Ensure local model is loaded
                    if (!cachedModel) {
                        log.info('Loading local model for fallback...');
                        await loadLocalModel();
                    }
                    const localResult = await runLocalPrediction(imageSource);
                    localResult.fallback = true;
                    localResult.originalError = error.message || error.type;
                    log.info('Local model fallback succeeded:', { animal: localResult.animal, confidence: localResult.confidence });
                    return localResult;
                } catch (localError) {
                    log.error('Local model fallback also failed:', localError);
                    return {
                        success: false,
                        error: error.message || ErrorMessages[ErrorTypes.UNKNOWN_ERROR],
                        errorType: error.type || ErrorTypes.UNKNOWN_ERROR,
                        fallbackAttempted: true,
                        fallbackError: localError.message
                    };
                }
            }
            
            // Don't fallback - return the error
            return {
                success: false,
                error: error.message || ErrorMessages[ErrorTypes.UNKNOWN_ERROR],
                errorType: error.type || ErrorTypes.UNKNOWN_ERROR
            };
        }
    }
    
    // Legacy direct API mode (not recommended due to CORS issues)
    if (AI_SOURCE === 'animaldetect') {
        try {
            log.info('Using direct AnimalDetect API (may have CORS issues)...');
            const result = await runAnimalDetectPrediction(imageSource);
            log.info('Detection complete:', { animal: result.animal, confidence: result.confidence });
            return result;
        } catch (error) {
            log.error('AnimalDetect API failed:', error.type || error.message);
            
            // Fallback to local model if enabled
            if (enableFallback) {
                log.info('Attempting fallback to local model...');
                try {
                    // Ensure local model is loaded
                    if (!cachedModel) {
                        log.info('Loading local model for fallback...');
                        await loadLocalModel();
                    }
                    const localResult = await runLocalPrediction(imageSource);
                    localResult.fallback = true;
                    localResult.originalError = error.message || error.type;
                    log.info('Local model fallback succeeded:', { animal: localResult.animal, confidence: localResult.confidence });
                    return localResult;
                } catch (localError) {
                    log.error('Local model fallback also failed:', localError);
                    return {
                        success: false,
                        error: error.message || ErrorMessages[ErrorTypes.UNKNOWN_ERROR],
                        errorType: error.type || ErrorTypes.UNKNOWN_ERROR,
                        fallbackAttempted: true,
                        fallbackError: localError.message
                    };
                }
            }
            
            return {
                success: false,
                error: error.message || ErrorMessages[ErrorTypes.UNKNOWN_ERROR],
                errorType: error.type || ErrorTypes.UNKNOWN_ERROR
            };
        }
    }
    
    // Use local model directly
    try {
        log.info('Using local model directly...');
        const result = await runLocalPrediction(imageSource);
        log.info('Local detection complete:', { animal: result.animal, confidence: result.confidence });
        return result;
    } catch (error) {
        log.error('Local model failed:', error);
        return {
            success: false,
            error: error.message || ErrorMessages[ErrorTypes.MODEL_ERROR],
            errorType: error.type || ErrorTypes.MODEL_ERROR
        };
    }
};

/**
 * Get the current AI source name
 * @returns {string} Current AI source
 */
export const getCurrentSource = () => AI_SOURCE;

/**
 * Get human-readable AI source name
 * @returns {string} Display name for the AI source
 */
export const getSourceDisplayName = () => {
    switch (AI_SOURCE) {
        case 'backend':
            return 'AnimalDetect AI';
        case 'animaldetect':
            return 'AnimalDetect API (Direct)';
        case 'local':
        default:
            return 'Local AI Model';
    }
};

/**
 * Get user-friendly error message for an error type
 * @param {string} errorType - The error type from ErrorTypes
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (errorType) => {
    return ErrorMessages[errorType] || ErrorMessages[ErrorTypes.UNKNOWN_ERROR];
};

export default {
    loadLocalModel,
    isModelReady,
    isModelLoading,
    detectAnimal,
    getCurrentSource,
    getSourceDisplayName,
    getErrorMessage,
    ErrorTypes
};
