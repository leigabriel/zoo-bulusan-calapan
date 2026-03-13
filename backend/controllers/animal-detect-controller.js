/**
 * Animal Detection Controller
 * 
 * Backend proxy for AnimalDetect API to avoid CORS issues.
 * The API key is stored securely on the server, never exposed to the frontend.
 * 
 * Flow: Frontend → Backend Proxy → AnimalDetect API → Backend → Frontend
 */

const FormData = require('form-data');

// Log utils - minimal output
const log = {
    info: (...args) => console.info('[AnimalDetect]', ...args),
    warn: (...args) => console.warn('[AnimalDetect]', ...args),
    error: (...args) => console.error('[AnimalDetect]', ...args),
    debug: () => {},
};

// Configuration from environment
const ANIMAL_DETECT_CONFIG = {
    apiUrl: process.env.ANIMAL_DETECT_API_URL || 'https://www.animaldetect.com/api/v1/detect',
    apiKey: process.env.ANIMAL_DETECT_API_KEY || '',
    timeout: parseInt(process.env.ANIMAL_DETECT_TIMEOUT) || 30000,
    minConfidence: parseFloat(process.env.ANIMAL_DETECT_MIN_CONFIDENCE) || 0.10,
};

/**
 * Normalize the API response to a consistent format
 * Handles various response structures from different API providers
 */
const normalizeApiResponse = (data) => {
    if (!data) {
        return { success: false, error: 'Empty response from API' };
    }
    
    // Extract detection from various response structures
    let detection = null;
    
    // Case 1: Direct array response [{ ... }]
    if (Array.isArray(data) && data.length > 0) {
        detection = data[0];
    }
    // Case 2: Nested arrays - check common field names for detection results
    else if (data.annotations && Array.isArray(data.annotations) && data.annotations.length > 0) {
        // AnimalDetect API uses 'annotations' array
        detection = data.annotations[0];
    }
    else if (data.predictions && Array.isArray(data.predictions) && data.predictions.length > 0) {
        detection = data.predictions[0];
    }
    else if (data.detections && Array.isArray(data.detections) && data.detections.length > 0) {
        detection = data.detections[0];
    }
    else if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        detection = data.results[0];
    }
    else if (data.animals && Array.isArray(data.animals) && data.animals.length > 0) {
        detection = data.animals[0];
    }
    else if (data.classifications && Array.isArray(data.classifications) && data.classifications.length > 0) {
        detection = data.classifications[0];
    }
    // Case 3: Nested in 'data' field
    else if (data.data) {
        if (Array.isArray(data.data) && data.data.length > 0) {
            detection = data.data[0];
        } else if (typeof data.data === 'object') {
            detection = data.data;
        }
    }
    // Case 4: Nested in 'result' field
    else if (data.result && typeof data.result === 'object') {
        detection = data.result;
    }
    // Case 5: Response has direct detection fields
    else if (data.animal || data.name || data.label || data.class || data.species || data.common_name || data.prediction) {
        detection = data;
    }
    // Case 6: Check for confidence field directly
    else if (data.confidence !== undefined || data.score !== undefined || data.probability !== undefined) {
        detection = data;
    }
    
    if (!detection) {
        log.warn('Could not extract detection from response');
        return { success: false, error: 'Could not parse API response', rawResponse: data };
    }
    
    log.debug('Extracted detection:', JSON.stringify(detection));
    
    // Extract animal name
    const nameFields = ['common_name', 'commonName', 'name', 'animal', 'label', 'class', 'className', 'prediction', 'species', 'species_guess', 'title', 'identified_as'];
    let animalName = 'Unknown';
    
    for (const field of nameFields) {
        const value = detection[field];
        if (value && typeof value === 'string' && value.trim().length > 0) {
            animalName = cleanAnimalName(value);
            log.debug(`Found animal name in field '${field}':`, animalName);
            break;
        }
    }
    
    // Check nested taxonomy fields
    if (animalName === 'Unknown') {
        const nestedFields = ['taxonomy', 'taxon', 'classification', 'species_info'];
        for (const field of nestedFields) {
            if (detection[field] && typeof detection[field] === 'object') {
                for (const nameField of nameFields) {
                    if (detection[field][nameField]) {
                        animalName = cleanAnimalName(detection[field][nameField]);
                        break;
                    }
                }
                if (animalName !== 'Unknown') break;
            }
        }
    }
    
    // Extract confidence
    const confidenceFields = ['confidence', 'score', 'probability', 'prob', 'certainty', 'match_score'];
    let confidence = 0;
    
    for (const field of confidenceFields) {
        const value = detection[field];
        if (value !== undefined && value !== null) {
            let conf = parseFloat(value);
            if (!isNaN(conf)) {
                // Normalize to 0-100 range
                if (conf >= 0 && conf <= 1) {
                    conf = conf * 100;
                }
                confidence = Math.max(0, Math.min(100, conf));
                log.debug(`Found confidence in field '${field}':`, confidence.toFixed(1) + '%');
                break;
            }
        }
    }
    
    // Extract additional info
    const scientificName = detection.scientific_name || detection.scientificName || 
                          detection.latin_name || detection.taxonomy?.scientific_name || null;
    
    const category = detection.category || detection.type || detection.class_name || 
                    detection.animal_type || detection.taxonomy?.class || 'Animal';
    
    const isSuccess = animalName !== 'Unknown' && confidence > 0;
    
    log.info('Normalized result:', { animal: animalName, confidence: confidence.toFixed(1) + '%', success: isSuccess });
    
    return {
        success: isSuccess,
        animalName,
        confidence: parseFloat(confidence.toFixed(1)),
        scientificName,
        category,
        source: 'animaldetect',
        rawResponse: data
    };
};

/**
 * Clean and normalize animal name
 */
const cleanAnimalName = (name) => {
    if (!name) return 'Unknown';
    
    let cleaned = String(name).trim()
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    // Capitalize first letter of each word
    cleaned = cleaned.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    
    // If name is too long, take first word
    if (cleaned.split(' ').length > 3) {
        cleaned = cleaned.split(' ')[0];
    }
    
    return cleaned || 'Unknown';
};

/**
 * Delay utility for retry logic
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Main detection endpoint
 * POST /api/animal-detect
 */
exports.detectAnimal = async (req, res) => {
    const startTime = Date.now();
    log.info('=== Animal Detection Request Received ===');
    
    try {
        // Check if API key is configured
        if (!ANIMAL_DETECT_CONFIG.apiKey) {
            log.warn('No API key configured - returning configuration error');
            return res.status(503).json({
                success: false,
                error: 'Animal detection API is not configured',
                errorType: 'CONFIG_ERROR',
                message: 'Please configure ANIMAL_DETECT_API_KEY in the server environment'
            });
        }
        
        // Validate request
        if (!req.file && !req.body.image) {
            log.warn('No image provided in request');
            return res.status(400).json({
                success: false,
                error: 'No image provided',
                errorType: 'INVALID_IMAGE',
                message: 'Please provide an image file or base64 encoded image'
            });
        }
        
        let imageBuffer;
        let mimeType = 'image/jpeg';
        
        // Handle file upload
        if (req.file) {
            imageBuffer = req.file.buffer;
            mimeType = req.file.mimetype;
            log.info('Image from file upload:', {
                size: Math.round(imageBuffer.length / 1024) + 'KB',
                mimetype: mimeType,
                originalName: req.file.originalname
            });
        }
        // Handle base64 encoded image
        else if (req.body.image) {
            const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '');
            imageBuffer = Buffer.from(base64Data, 'base64');
            
            // Detect mime type from data URL
            const mimeMatch = req.body.image.match(/^data:(image\/\w+);base64,/);
            if (mimeMatch) {
                mimeType = mimeMatch[1];
            }
            
            log.info('Image from base64:', {
                size: Math.round(imageBuffer.length / 1024) + 'KB',
                mimetype: mimeType
            });
        }
        
        // Validate image size
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (imageBuffer.length > maxSize) {
            log.warn('Image too large:', Math.round(imageBuffer.length / 1024 / 1024) + 'MB');
            return res.status(400).json({
                success: false,
                error: 'Image is too large',
                errorType: 'IMAGE_TOO_LARGE',
                message: 'Please use an image under 10MB'
            });
        }
        
        // Prepare FormData for API request
        const formData = new FormData();
        formData.append('image', imageBuffer, {
            filename: 'image.jpg',
            contentType: mimeType
        });
        
        // Add threshold if configured
        if (ANIMAL_DETECT_CONFIG.minConfidence) {
            formData.append('threshold', String(ANIMAL_DETECT_CONFIG.minConfidence));
        }
        
        log.info('Sending request to AnimalDetect API:', ANIMAL_DETECT_CONFIG.apiUrl);
        log.debug('Request headers:', {
            'x-api-key': ANIMAL_DETECT_CONFIG.apiKey.substring(0, 8) + '...',
            'Content-Type': 'multipart/form-data'
        });
        
        // Make API request with retry logic
        let response;
        let lastError;
        const maxRetries = 2;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 0) {
                    log.info(`Retry attempt ${attempt}/${maxRetries}...`);
                    await delay(1000 * attempt);
                }
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), ANIMAL_DETECT_CONFIG.timeout);
                
                response = await fetch(ANIMAL_DETECT_CONFIG.apiUrl, {
                    method: 'POST',
                    headers: {
                        'x-api-key': ANIMAL_DETECT_CONFIG.apiKey,
                        'Authorization': `Bearer ${ANIMAL_DETECT_CONFIG.apiKey}`,
                        ...formData.getHeaders()
                    },
                    body: formData.getBuffer(),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                log.info('API Response status:', response.status, response.statusText);
                
                if (response.ok) {
                    break; // Success, exit retry loop
                }
                
                // Don't retry auth errors or method not allowed
                if (response.status === 401 || response.status === 403) {
                    const errorText = await response.text();
                    log.error('Authentication error:', errorText);
                    return res.status(response.status).json({
                        success: false,
                        error: 'API authentication failed',
                        errorType: 'AUTH_ERROR',
                        message: 'Invalid API key or unauthorized access'
                    });
                }
                
                // Don't retry 405 Method Not Allowed - indicates wrong endpoint or method
                if (response.status === 405) {
                    const errorText = await response.text();
                    log.error('Method not allowed (405) - check API endpoint URL:', errorText);
                    return res.status(502).json({
                        success: false,
                        error: 'API endpoint configuration error',
                        errorType: 'ENDPOINT_ERROR',
                        message: 'The API endpoint returned 405 Method Not Allowed. Please verify ANIMAL_DETECT_API_URL is correct.',
                        shouldFallback: true
                    });
                }
                
                lastError = new Error(`API returned ${response.status}`);
                
            } catch (err) {
                lastError = err;
                log.warn(`Request attempt ${attempt + 1} failed:`, err.message);
                
                if (err.name === 'AbortError') {
                    lastError = new Error('Request timed out');
                }
            }
        }
        
        // Check if all retries failed
        if (!response || !response.ok) {
            log.error('All retry attempts failed:', lastError?.message);
            return res.status(502).json({
                success: false,
                error: 'AnimalDetect API request failed',
                errorType: 'API_ERROR',
                message: lastError?.message || 'Failed to connect to detection service',
                shouldFallback: true
            });
        }
        
        // Parse response
        const responseText = await response.text();
        log.debug('Raw API response:', responseText.substring(0, 500));
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            log.error('JSON parse error:', parseError.message);
            return res.status(502).json({
                success: false,
                error: 'Invalid response from API',
                errorType: 'PARSE_ERROR',
                message: 'Could not parse API response',
                shouldFallback: true
            });
        }
        
        // Normalize the response
        const result = normalizeApiResponse(data);
        
        // Add timing info
        result.processingTime = Date.now() - startTime;
        log.info('Detection complete in', result.processingTime + 'ms');
        
        // Return result
        if (result.success) {
            res.json(result);
        } else {
            // API returned but couldn't detect animal
            res.json({
                ...result,
                shouldFallback: true,
                message: 'No animal detected in image'
            });
        }
        
    } catch (error) {
        log.error('Unexpected error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            errorType: 'SERVER_ERROR',
            message: error.message,
            shouldFallback: true
        });
    }
};

/**
 * Health check endpoint for the detection service
 * GET /api/animal-detect/health
 */
exports.healthCheck = async (req, res) => {
    const status = {
        service: 'animal-detect-proxy',
        timestamp: new Date().toISOString(),
        configured: !!ANIMAL_DETECT_CONFIG.apiKey,
        apiUrl: ANIMAL_DETECT_CONFIG.apiUrl ? ANIMAL_DETECT_CONFIG.apiUrl.replace(/\/api.*/, '/...') : 'not set'
    };
    
    if (!ANIMAL_DETECT_CONFIG.apiKey) {
        status.warning = 'API key not configured. Detection will use local model only.';
    }
    
    res.json(status);
};

/**
 * Configuration info endpoint (non-sensitive)
 * GET /api/animal-detect/config
 */
exports.getConfig = async (req, res) => {
    res.json({
        apiConfigured: !!ANIMAL_DETECT_CONFIG.apiKey,
        timeout: ANIMAL_DETECT_CONFIG.timeout,
        minConfidence: ANIMAL_DETECT_CONFIG.minConfidence,
        // Don't expose actual API URL or key
    });
};