/**
 * Animal Description Service
 * 
 * Primary service for fetching animal descriptions from Wikipedia API.
 * This service is the MAIN source for animal information - no internal database fallback.
 * 
 * Features:
 * - Wikipedia API integration for real-time descriptions
 * - Intelligent search with multiple query strategies
 * - LRU cache with configurable duration (12-24 hours)
 * - Graceful error handling with meaningful fallbacks
 */

// ============================================
// Configuration
// ============================================
const CONFIG = {
    // Cache duration in milliseconds (12 hours)
    CACHE_DURATION: 12 * 60 * 60 * 1000,
    // Maximum cache size (LRU eviction)
    MAX_CACHE_SIZE: 100,
    // API timeout in milliseconds
    API_TIMEOUT: 10000,
    // User agent for Wikipedia API (required)
    USER_AGENT: 'ZooBulusanScanner/2.0 (https://zoo-bulusan.app; contact@zoo-bulusan.app)',
    // Wikipedia API base URL
    WIKIPEDIA_API: 'https://en.wikipedia.org/api/rest_v1/page/summary'
};

// ============================================
// Cache Implementation
// ============================================
class LRUCache {
    constructor(maxSize = 100) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }
    
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        // Check if expired
        if (Date.now() - item.timestamp > CONFIG.CACHE_DURATION) {
            this.cache.delete(key);
            return null;
        }
        
        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, item);
        
        return item.data;
    }
    
    set(key, data) {
        // Remove oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    
    has(key) {
        return this.get(key) !== null;
    }
    
    clear() {
        this.cache.clear();
    }
    
    get size() {
        return this.cache.size;
    }
    
    entries() {
        return Array.from(this.cache.keys());
    }
}

// Global cache instance
const descriptionCache = new LRUCache(CONFIG.MAX_CACHE_SIZE);

// ============================================
// Logging
// ============================================
const log = {
    info: (...args) => console.log('[DescriptionService]', ...args),
    warn: (...args) => console.warn('[DescriptionService]', ...args),
    error: (...args) => console.error('[DescriptionService]', ...args),
    debug: (...args) => console.log('[DescriptionService][DEBUG]', ...args)
};

// ============================================
// Main API Functions
// ============================================

/**
 * Fetch animal description from Wikipedia API
 * @param {string} animalName - Name of the animal
 * @returns {Promise<Object>} Description object
 */
export const fetchAnimalDescription = async (animalName) => {
    log.info('Fetching description for:', animalName);
    
    // Validate input
    if (!animalName || animalName.toLowerCase() === 'unknown' || animalName.trim() === '') {
        log.warn('Invalid animal name provided');
        return createFallbackResult(animalName, 'Invalid animal name');
    }
    
    // Normalize the name for caching
    const cacheKey = normalizeForCache(animalName);
    
    // Check cache first
    const cached = descriptionCache.get(cacheKey);
    if (cached) {
        log.info('Cache hit for:', animalName);
        return { ...cached, fromCache: true };
    }
    
    log.info('Cache miss, fetching from Wikipedia...');
    
    try {
        // Try multiple search strategies
        const result = await fetchWithStrategies(animalName);
        
        if (result.success) {
            // Cache successful result
            descriptionCache.set(cacheKey, result);
            log.info('Successfully fetched and cached description for:', animalName);
        }
        
        return result;
        
    } catch (error) {
        log.error('Failed to fetch description:', error.message);
        
        // Create and cache fallback result to prevent repeated failed requests
        const fallback = createFallbackResult(animalName, error.message);
        descriptionCache.set(cacheKey, fallback);
        
        return fallback;
    }
};

/**
 * Try multiple search strategies to find the animal on Wikipedia
 * @param {string} animalName - Name of the animal
 * @returns {Promise<Object>} Description result
 */
const fetchWithStrategies = async (animalName) => {
    // Clean the animal name - remove common suffixes that don't exist as Wikipedia titles
    const cleanedName = cleanAnimalNameForSearch(animalName);
    
    const strategies = [
        // Strategy 1: Direct name lookup (most common case - e.g., "Zebra", "Lion")
        () => fetchWikipediaSummary(cleanedName),
        // Strategy 2: Try with species suffix for disambiguation (e.g., "Deer" → "Deer (animal)")
        () => fetchWikipediaSummary(`${cleanedName} (animal)`),
        // Strategy 3: Search API fallback - searches Wikipedia for matching articles
        () => searchAndFetch(cleanedName)
    ];
    
    for (let i = 0; i < strategies.length; i++) {
        try {
            log.debug(`Trying strategy ${i + 1} for "${cleanedName}"...`);
            const result = await strategies[i]();
            
            if (result.success && result.description && result.description.length > 30) {
                log.debug(`Strategy ${i + 1} succeeded`);
                return result;
            }
        } catch (error) {
            log.debug(`Strategy ${i + 1} failed:`, error.message);
        }
    }
    
    // All strategies failed
    throw new Error('All Wikipedia search strategies failed');
};

/**
 * Clean animal name for Wikipedia search
 * Removes common problematic suffixes and normalizes the name
 * @param {string} name - Raw animal name
 * @returns {string} Cleaned name
 */
const cleanAnimalNameForSearch = (name) => {
    if (!name) return '';
    
    let cleaned = name.trim();
    
    // Remove common suffixes that cause 404s (case-insensitive)
    const suffixesToRemove = [
        /\s+animal$/i,
        /\s+species$/i,
        /\s+creature$/i,
        /\s+bird$/i,      // "Eagle bird" → "Eagle"
        /\s+fish$/i,      // "Salmon fish" → "Salmon"
        /\s+mammal$/i,
    ];
    
    for (const suffix of suffixesToRemove) {
        cleaned = cleaned.replace(suffix, '');
    }
    
    // Remove parenthetical content from detection results
    cleaned = cleaned.replace(/\s*\([^)]*\)/g, '');
    
    // Normalize whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Capitalize first letter of each word
    cleaned = cleaned
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    
    return cleaned;
};

/**
 * Fetch summary from Wikipedia REST API
 * @param {string} query - Search query
 * @returns {Promise<Object>} Processed result
 */
const fetchWikipediaSummary = async (query) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);
    
    try {
        const encodedQuery = encodeURIComponent(query.replace(/\s+/g, '_'));
        const url = `${CONFIG.WIKIPEDIA_API}/${encodedQuery}`;
        
        log.debug('Fetching:', url);
        
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Api-User-Agent': CONFIG.USER_AGENT
            },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`Wikipedia returned ${response.status}`);
        }
        
        const data = await response.json();
        return processWikipediaResponse(data, query);
        
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
};

/**
 * Search Wikipedia and fetch the first relevant result
 * @param {string} animalName - Animal name to search
 * @returns {Promise<Object>} Processed result
 */
const searchAndFetch = async (animalName) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);
    
    try {
        // Use Wikipedia's search API - search works well with "animal" as a search term
        // This is different from direct page lookup - search finds pages containing both words
        const searchQuery = `${animalName} animal species`;
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*&srlimit=5`;
        
        log.debug('Searching Wikipedia for:', searchQuery);
        
        const searchResponse = await fetch(searchUrl, {
            headers: { 'Api-User-Agent': CONFIG.USER_AGENT },
            signal: controller.signal
        });
        
        if (!searchResponse.ok) {
            throw new Error('Search API failed');
        }
        
        const searchData = await searchResponse.json();
        const results = searchData?.query?.search || [];
        
        if (results.length === 0) {
            throw new Error('No search results found');
        }
        
        log.debug('Search results:', results.map(r => r.title));
        
        // Find the best match (prioritize exact name matches and animal-related results)
        const lowerName = animalName.toLowerCase();
        const bestResult = results.find(r => {
            const title = r.title.toLowerCase();
            const snippet = r.snippet.toLowerCase();
            
            // Exact match in title
            if (title === lowerName) return true;
            
            // Title starts with the animal name
            if (title.startsWith(lowerName)) return true;
            
            // Title contains animal name and snippet mentions animal/species/mammal etc
            if (title.includes(lowerName) && (
                snippet.includes('animal') ||
                snippet.includes('species') ||
                snippet.includes('mammal') ||
                snippet.includes('bird') ||
                snippet.includes('reptile') ||
                snippet.includes('fish')
            )) return true;
            
            return false;
        }) || results[0]; // Fall back to first result
        
        clearTimeout(timeoutId);
        
        log.debug('Best match:', bestResult.title);
        
        // Fetch the summary for the best result
        return await fetchWikipediaSummary(bestResult.title);
        
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
};

/**
 * Process Wikipedia API response into unified format
 * @param {Object} data - Wikipedia response
 * @param {string} originalQuery - Original search query
 * @returns {Object} Processed result
 */
const processWikipediaResponse = (data, originalQuery) => {
    log.debug('Processing Wikipedia response for:', data.title || originalQuery);
    
    // Check for disambiguation or missing pages
    if (data.type === 'disambiguation' || data.type === 'no-extract') {
        throw new Error('Disambiguation or no extract available');
    }
    
    // Extract and clean description
    let description = data.extract || '';
    
    if (!description || description.length < 20) {
        throw new Error('Insufficient description content');
    }
    
    // Clean up and limit description to 2-3 sentences
    description = cleanDescription(description);
    
    // Extract scientific name if available
    const scientificName = extractScientificName(description, data.title);
    
    // Determine category
    const category = determineCategory(description, data.title);
    
    return {
        success: true,
        description,
        title: data.title,
        thumbnail: data.thumbnail?.source || null,
        category,
        scientificName,
        source: 'wikipedia',
        pageUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(data.title)}`,
        originalQuery
    };
};

/**
 * Clean and format description text
 * @param {string} text - Raw description
 * @returns {string} Cleaned description
 */
const cleanDescription = (text) => {
    if (!text) return '';
    
    // Remove parenthetical content (often scientific names)
    let cleaned = text.replace(/\s*\([^)]*\)/g, '');
    
    // Remove excessive whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Split into sentences
    const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [cleaned];
    
    // Take first 2-3 sentences (or less if they're long)
    let result = '';
    for (let i = 0; i < Math.min(3, sentences.length); i++) {
        const sentence = sentences[i].trim();
        if (result.length + sentence.length > 400) break;
        result += (result ? ' ' : '') + sentence;
    }
    
    // Ensure minimum quality
    if (result.length < 30 && sentences.length > 0) {
        result = sentences[0].trim();
    }
    
    return result;
};

/**
 * Extract scientific name from text
 * @param {string} text - Description text
 * @param {string} title - Article title
 * @returns {string|null} Scientific name if found
 */
const extractScientificName = (text, title) => {
    // Common patterns for scientific names
    const patterns = [
        /\(([A-Z][a-z]+ [a-z]+)\)/,           // (Genus species)
        /scientifically known as ([A-Z][a-z]+ [a-z]+)/i,
        /scientific name[:\s]+([A-Z][a-z]+ [a-z]+)/i,
        /\b([A-Z][a-z]+ [a-z]+us)\b/,          // Ends in 'us' (Latin)
        /\b([A-Z][a-z]+ [a-z]+is)\b/           // Ends in 'is' (Latin)
    ];
    
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match?.[1]) return match[1];
    }
    
    return null;
};

/**
 * Determine animal category from description
 * @param {string} text - Description text
 * @param {string} title - Article title
 * @returns {string} Category
 */
const determineCategory = (text, title) => {
    const combined = `${title} ${text}`.toLowerCase();
    
    const categories = {
        'Mammal': ['mammal', 'carnivore', 'herbivore', 'primate', 'rodent', 'whale', 'dolphin', 'bat', 'marsupial', 'feline', 'canine', 'bovine', 'equine'],
        'Bird': ['bird', 'avian', 'fowl', 'raptor', 'waterfowl', 'songbird', 'parrot', 'eagle', 'owl', 'penguin', 'flamingo'],
        'Reptile': ['reptile', 'lizard', 'snake', 'crocodilian', 'turtle', 'tortoise', 'gecko', 'iguana', 'alligator', 'crocodile'],
        'Amphibian': ['amphibian', 'frog', 'toad', 'salamander', 'newt', 'caecilian'],
        'Fish': ['fish', 'shark', 'ray', 'salmon', 'tuna', 'bass', 'trout', 'carp', 'aquatic'],
        'Insect': ['insect', 'beetle', 'butterfly', 'moth', 'ant', 'bee', 'wasp', 'dragonfly', 'grasshopper'],
        'Arachnid': ['spider', 'scorpion', 'arachnid', 'tarantula', 'tick', 'mite'],
        'Crustacean': ['crab', 'lobster', 'shrimp', 'crustacean', 'crayfish', 'barnacle']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(kw => combined.includes(kw))) {
            return category;
        }
    }
    
    return 'Animal';
};

// ============================================
// Helper Functions
// ============================================

/**
 * Normalize animal name for cache key
 * @param {string} name - Animal name
 * @returns {string} Normalized cache key
 */
const normalizeForCache = (name) => {
    return name.toLowerCase().trim().replace(/\s+/g, '_');
};

/**
 * Create a fallback result when Wikipedia fails
 * @param {string} animalName - Animal name
 * @param {string} error - Error message
 * @returns {Object} Fallback result
 */
const createFallbackResult = (animalName, error) => {
    const safeName = animalName || 'Unknown';
    const capitalizedName = safeName.charAt(0).toUpperCase() + safeName.slice(1).toLowerCase();
    
    return {
        success: true, // Mark as success so UI doesn't show error state
        description: `Description unavailable for ${capitalizedName}. This species could not be found in our knowledge database.`,
        category: determineCategory('', safeName),
        source: 'fallback',
        error,
        originalQuery: animalName
    };
};

// ============================================
// Exported Utility Functions
// ============================================

/**
 * Clear the description cache
 */
export const clearDescriptionCache = () => {
    descriptionCache.clear();
    log.info('Cache cleared');
};

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export const getCacheStats = () => {
    return {
        size: descriptionCache.size,
        maxSize: CONFIG.MAX_CACHE_SIZE,
        entries: descriptionCache.entries(),
        cacheDurationHours: CONFIG.CACHE_DURATION / (60 * 60 * 1000)
    };
};

/**
 * Prefetch descriptions for a list of animals (batch operation)
 * @param {string[]} animalNames - Array of animal names
 * @returns {Promise<Object>} Results map
 */
export const prefetchDescriptions = async (animalNames) => {
    log.info('Prefetching descriptions for', animalNames.length, 'animals');
    
    const results = {};
    const batchSize = 3; // Limit concurrent requests
    
    for (let i = 0; i < animalNames.length; i += batchSize) {
        const batch = animalNames.slice(i, i + batchSize);
        const promises = batch.map(async (name) => {
            try {
                const result = await fetchAnimalDescription(name);
                results[name] = result;
            } catch (error) {
                results[name] = createFallbackResult(name, error.message);
            }
        });
        
        await Promise.all(promises);
        
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < animalNames.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    log.info('Prefetch complete:', Object.keys(results).length, 'descriptions loaded');
    return results;
};

export default {
    fetchAnimalDescription,
    clearDescriptionCache,
    getCacheStats,
    prefetchDescriptions
};
