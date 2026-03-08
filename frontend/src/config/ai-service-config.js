/**
 * AI Service Configuration
 * 
 * This file controls which AI source is used for animal detection.
 * 
 * Architecture:
 * - 'backend': Routes requests through backend proxy → AnimalDetect API (recommended)
 * - 'local': Uses the local TensorFlow.js model (no API needed)
 * 
 * The backend proxy approach solves CORS issues by keeping the API key
 * secure on the server and handling all external API communication there.
 * 
 * Flow: Frontend → /api/animal-detect → Backend → AnimalDetect API → Backend → Frontend
 */

// Get backend URL for API proxy
const getBackendUrl = () => {
    // Use environment variable if set, otherwise auto-detect
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    // Development default
    const port = import.meta.env.VITE_BACKEND_PORT || 5000;
    return `http://localhost:${port}/api`;
};

// AI Source selection
// Options: 'backend' | 'local'
// 'backend' uses the server proxy (recommended - avoids CORS issues)
// 'local' uses TensorFlow.js directly in browser
export const AI_SOURCE = import.meta.env.VITE_AI_SOURCE || 'backend';

// Backend proxy configuration (recommended approach)
export const BACKEND_PROXY_CONFIG = {
    // Backend API endpoint for animal detection
    detectUrl: `${getBackendUrl()}/animal-detect`,
    // Health check endpoint
    healthUrl: `${getBackendUrl()}/animal-detect/health`,
    // Request timeout in milliseconds
    timeout: 35000, // 35 seconds (slightly longer than backend timeout)
    // Enable automatic fallback to local model if backend fails
    enableFallback: true,
    // Minimum confidence to consider a detection valid
    minConfidence: 0.10,
};

// Legacy direct API configuration (kept for reference, but not recommended due to CORS)
export const ANIMAL_DETECT_CONFIG = {
    // API key should NOT be in frontend - use backend proxy instead
    apiKey: '', // Intentionally empty - API key is on server
    // Request timeout in milliseconds (used for local model timeout reference)
    timeout: 30000,
    // Detection confidence threshold (0.0 - 1.0)
    threshold: 0.15,
    // Enable automatic fallback to local model if API fails
    enableFallback: true,
};

// Local Model Configuration
export const LOCAL_MODEL_CONFIG = {
    modelPath: '/models/model.json',
    inputSize: 150,
    confidenceThreshold: 0.5,
};

/**
 * Unified Response Format
 * Both AI sources will return data in this format:
 * {
 *   success: boolean,
 *   animal: string,
 *   confidence: number (0-100),
 *   description: string,
 *   category: string,
 *   isBulusanAnimal: boolean,
 *   rawResponse?: any // Original API response for debugging
 * }
 */

// Animal information database for both AI sources
export const ANIMAL_DATABASE = {
    'Bear': { description: "Bears have an excellent sense of smell, better than dogs.", category: "Mammal", bulusan: false, icon: "bear" },
    'Bird': { description: "Birds are the only animals with feathers.", category: "Bird", bulusan: true, icon: "bird" },
    'Cat': { description: "Cats use their whiskers to navigate in the dark.", category: "Mammal", bulusan: false, icon: "cat" },
    'Cow': { description: "Cows have best friends and get stressed when separated.", category: "Mammal", bulusan: false, icon: "cow" },
    'Deer': { description: "Deer antlers grow faster than any other living tissue.", category: "Mammal", bulusan: true, icon: "deer" },
    'Dog': { description: "A dog's nose print is unique, much like a human fingerprint.", category: "Mammal", bulusan: false, icon: "dog" },
    'Dolphin': { description: "Dolphins give themselves names.", category: "Mammal", bulusan: false, icon: "dolphin" },
    'Elephant': { description: "Elephants are the only mammals that can't jump.", category: "Mammal", bulusan: true, icon: "elephant" },
    'Giraffe': { description: "A giraffe's tongue is purple to prevent sunburn!", category: "Mammal", bulusan: false, icon: "giraffe" },
    'Horse': { description: "Horses can sleep standing up.", category: "Mammal", bulusan: true, icon: "horse" },
    'Kangaroo': { description: "Kangaroos cannot walk backwards.", category: "Mammal", bulusan: false, icon: "kangaroo" },
    'Lion': { description: "A lion's roar can be heard from 5 miles away.", category: "Mammal", bulusan: true, icon: "lion" },
    'Panda': { description: "Pandas spend up to 14 hours a day eating.", category: "Mammal", bulusan: false, icon: "panda" },
    'Tiger': { description: "No two tigers have the same stripes.", category: "Mammal", bulusan: true, icon: "tiger" },
    'Zebra': { description: "Zebras stripes act as a bug repellent.", category: "Mammal", bulusan: false, icon: "zebra" },
    // Additional animals for AnimalDetect API compatibility
    'Crocodile': { description: "Crocodiles can hold their breath for more than an hour.", category: "Reptile", bulusan: true, icon: "crocodile" },
    'Monkey': { description: "Monkeys can understand basic math and concepts.", category: "Mammal", bulusan: true, icon: "monkey" },
    'Snake': { description: "Snakes smell with their tongues.", category: "Reptile", bulusan: false, icon: "snake" },
    'Turtle': { description: "Turtles have been around for over 200 million years.", category: "Reptile", bulusan: true, icon: "turtle" },
    'Frog': { description: "Frogs can absorb water through their skin.", category: "Amphibian", bulusan: false, icon: "frog" },
    'Parrot': { description: "Parrots can live for over 80 years.", category: "Bird", bulusan: true, icon: "parrot" },
    'Eagle': { description: "Eagles can see up to 2 miles away.", category: "Bird", bulusan: true, icon: "eagle" },
    'Owl': { description: "Owls can rotate their heads 270 degrees.", category: "Bird", bulusan: false, icon: "owl" },
    'Penguin': { description: "Penguins mate for life.", category: "Bird", bulusan: false, icon: "penguin" },
    'Flamingo': { description: "Flamingos are pink due to their diet of shrimp.", category: "Bird", bulusan: true, icon: "flamingo" },
};

// Get all supported animal classes for local model
export const ANIMAL_CLASSES = Object.keys(ANIMAL_DATABASE).slice(0, 15); // Original 15 classes

/**
 * Get animal info from the database
 * NOTE: This function provides metadata only (category, bulusan status).
 * Descriptions should be fetched from Wikipedia, not from this database.
 * @param {string} animalName - Name of the animal
 * @returns {Object} Animal metadata (category, bulusan status, icon)
 */
export const getAnimalInfo = (animalName) => {
    // Normalize the animal name (capitalize first letter)
    const normalized = animalName.charAt(0).toUpperCase() + animalName.slice(1).toLowerCase();
    const info = ANIMAL_DATABASE[normalized];
    
    // Return metadata only - NO description (Wikipedia provides descriptions)
    return {
        category: info?.category || "Animal",
        bulusan: info?.bulusan || false,
        icon: info?.icon || animalName.toLowerCase()
    };
};

/**
 * Transform API response to unified format
 * Handles various API response structures from different providers
 * @param {Object} response - Raw API response
 * @param {string} source - AI source ('local' | 'animaldetect')
 * @returns {Object} Unified response format
 */
export const normalizeResponse = (response, source) => {
    if (source === 'animaldetect') {
        if (!response) {
            return createFailedResult('Empty response from API', response);
        }
        
        // Extract detection
        let detection = extractDetection(response);
        
        if (!detection) {
            return createFailedResult('Could not parse API response', response);
        }
        
        // Extract values
        const animalName = extractAnimalName(detection);
        const confidence = extractConfidence(detection);
        
        // Get additional info from database (metadata only - no description)
        const info = getAnimalInfo(animalName);
        
        // Determine success based on whether we got a valid animal name and confidence
        const isSuccess = animalName !== 'Unknown' && confidence > 0;
        
        return {
            success: isSuccess,
            animal: animalName,
            confidence: confidence.toFixed(1),
            description: '', // Empty - Wikipedia provides descriptions, not internal database
            category: extractCategory(detection, info),
            isBulusanAnimal: info.bulusan,
            scientificName: extractScientificName(detection),
            rawResponse: response
        };
    }
    
    // Local model response is already in correct format
    return response;
};

/**
 * Extract detection object from various API response structures
 * @param {Object} response - Raw API response
 * @returns {Object|null} Detection object or null
 */
const extractDetection = (response) => {
    // array response
    if (Array.isArray(response) && response.length > 0) {
        return response[0];
    }
    
    // nested arrays
    const arrayFields = ['predictions', 'detections', 'results', 'animals', 'classifications', 'matches'];
    for (const field of arrayFields) {
        if (response?.[field] && Array.isArray(response[field]) && response[field].length > 0) {
            return response[field][0];
        }
    }
    
    // data field
    if (response?.data) {
        if (Array.isArray(response.data) && response.data.length > 0) {
            return response.data[0];
        }
        if (typeof response.data === 'object') {
            return response.data;
        }
    }
    
    // result field
    if (response?.result && typeof response.result === 'object') {
        return response.result;
    }
    
    // direct fields
    const directFields = ['animal', 'name', 'label', 'class', 'species', 'common_name', 'prediction'];
    for (const field of directFields) {
        if (response?.[field]) {
            return response;
        }
    }
    
    // response with confidence
    if (response && typeof response === 'object' && Object.keys(response).length > 0) {
        if (response.confidence !== undefined || response.score !== undefined || response.probability !== undefined) {
            return response;
        }
    }
    
    return null;
};

/**
 * Extract animal name from detection object
 * @param {Object} detection - Detection object
 * @returns {string} Animal name
 */
const extractAnimalName = (detection) => {
    // Priority order of field names to check
    const nameFields = [
        'common_name',      // iNaturalist style
        'commonName',       // camelCase variant
        'name',             // Generic
        'animal',           // Generic
        'label',            // ML model style
        'class',            // Classifier style  
        'className',        // camelCase variant
        'prediction',       // Generic
        'species',          // Scientific
        'species_guess',    // iNaturalist
        'title',            // Some APIs use this
        'identified_as',    // Some APIs
    ];
    
    for (const field of nameFields) {
        const value = detection[field];
        if (value && typeof value === 'string' && value.trim().length > 0) {
            const cleaned = cleanAnimalName(value);
            return cleaned;
        }
    }
    
    // nested taxonomy
    const nestedFields = ['taxonomy', 'taxon', 'classification', 'species_info'];
    for (const field of nestedFields) {
        if (detection[field] && typeof detection[field] === 'object') {
            const nested = detection[field];
            for (const nameField of nameFields) {
                if (nested[nameField]) {
                    const cleaned = cleanAnimalName(nested[nameField]);
                    return cleaned;
                }
            }
        }
    }
    
    return 'Unknown';
};

/**
 * Clean and normalize animal name
 * @param {string} name - Raw animal name
 * @returns {string} Cleaned name
 */
const cleanAnimalName = (name) => {
    if (!name) return 'Unknown';
    
    // Convert to string if needed
    let cleaned = String(name).trim();
    
    // Handle common formats
    cleaned = cleaned
        .replace(/_/g, ' ')           // snake_case to spaces
        .replace(/-/g, ' ')           // kebab-case to spaces
        .replace(/\s+/g, ' ')         // multiple spaces to single
        .trim();
    
    // Capitalize first letter of each word
    cleaned = cleaned.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    
    // If name is too long, it might be a description - take first word
    if (cleaned.split(' ').length > 3) {
        cleaned = cleaned.split(' ')[0];
    }
    
    return cleaned || 'Unknown';
};

/**
 * Extract confidence score from detection object
 * @param {Object} detection - Detection object
 * @returns {number} Confidence as percentage (0-100)
 */
const extractConfidence = (detection) => {
    const confidenceFields = ['confidence', 'score', 'probability', 'prob', 'certainty', 'match_score'];
    
    for (const field of confidenceFields) {
        const value = detection[field];
        if (value !== undefined && value !== null) {
            let confidence = parseFloat(value);
            
            if (isNaN(confidence)) {
                continue;
            }
            
            // Normalize to 0-100 range
            if (confidence >= 0 && confidence <= 1) {
                confidence = confidence * 100;
            }
            
            // Clamp to valid range
            confidence = Math.max(0, Math.min(100, confidence));
            return confidence;
        }
    }
    
    return 0;
};

/**
 * Extract category from detection
 * @param {Object} detection - Detection object
 * @param {Object} info - Info from database
 * @returns {string} Category
 */
const extractCategory = (detection, info) => {
    const categoryFields = ['category', 'type', 'class_name', 'animal_type', 'kingdom'];
    
    for (const field of categoryFields) {
        if (detection[field] && typeof detection[field] === 'string') {
            return detection[field];
        }
    }
    
    // Check taxonomy
    if (detection.taxonomy?.class) {
        return detection.taxonomy.class;
    }
    
    return info.category || 'Animal';
};

/**
 * Extract scientific name from detection
 * @param {Object} detection - Detection object
 * @returns {string|null} Scientific name
 */
const extractScientificName = (detection) => {
    const sciFields = ['scientific_name', 'scientificName', 'latin_name', 'binomial'];
    
    for (const field of sciFields) {
        if (detection[field]) {
            return detection[field];
        }
    }
    
    if (detection.taxonomy?.scientific_name) {
        return detection.taxonomy.scientific_name;
    }
    
    return null;
};

/**
 * Create a failed result object
 * @param {string} message - Error message
 * @param {Object} response - Original response
 * @returns {Object} Failed result
 */
const createFailedResult = (message, response) => {
    return {
        success: false,
        animal: 'Unknown',
        confidence: '0',
        description: message,
        category: 'Unknown',
        isBulusanAnimal: false,
        rawResponse: response
    };
};
