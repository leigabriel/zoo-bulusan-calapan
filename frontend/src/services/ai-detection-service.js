import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import {
    ANIMAL_CLASSES,
    LOCAL_MODEL_CONFIG,
    getAnimalInfo,
} from '../config/ai-service-config';

export const ErrorTypes = {
    INVALID_IMAGE: 'INVALID_IMAGE',
    MODEL_ERROR: 'MODEL_ERROR',
    NO_ANIMAL_DETECTED: 'NO_ANIMAL_DETECTED',
    LOW_CONFIDENCE: 'LOW_CONFIDENCE',
};

const ErrorMessages = {
    [ErrorTypes.INVALID_IMAGE]: 'The image could not be processed. Please try a different image.',
    [ErrorTypes.MODEL_ERROR]: 'The local AI model could not be loaded. Please refresh and try again.',
    [ErrorTypes.NO_ANIMAL_DETECTED]: 'No animal was detected. Try a clearer photo with the animal more visible.',
    [ErrorTypes.LOW_CONFIDENCE]: 'The model is not confident enough. Try a clearer or closer photo.',
};

let cachedModel = null;
let modelLoadPromise = null;

const disposePrediction = (prediction) => {
    if (Array.isArray(prediction)) {
        prediction.forEach((tensor) => tensor.dispose());
    } else {
        prediction?.dispose();
    }
};

const assertModelContract = (model) => {
    const inputShape = model.inputs[0]?.shape;
    const expectedInput = LOCAL_MODEL_CONFIG.inputSize;

    if (!inputShape || inputShape.length !== 4 || inputShape[1] !== expectedInput || inputShape[2] !== expectedInput || inputShape[3] !== 3) {
        throw new Error(`Expected model input [batch, ${expectedInput}, ${expectedInput}, 3], received ${JSON.stringify(inputShape)}`);
    }

};

export const loadLocalModel = async () => {
    if (cachedModel) return cachedModel;
    if (modelLoadPromise) return modelLoadPromise;

    modelLoadPromise = (async () => {
        await tf.ready();
        const model = await tf.loadGraphModel(LOCAL_MODEL_CONFIG.modelPath);

        try {
            assertModelContract(model);
            const warmupInput = tf.zeros([1, LOCAL_MODEL_CONFIG.inputSize, LOCAL_MODEL_CONFIG.inputSize, 3]);
            let warmupOutput;
            try {
                warmupOutput = model.predict(warmupInput);
                const outputTensor = Array.isArray(warmupOutput) ? warmupOutput[0] : warmupOutput;
                if (outputTensor.shape.at(-1) !== ANIMAL_CLASSES.length) {
                    throw new Error(`Expected ${ANIMAL_CLASSES.length} model outputs, received ${JSON.stringify(outputTensor.shape)}`);
                }
            } finally {
                warmupInput.dispose();
                disposePrediction(warmupOutput);
            }
            cachedModel = model;
            return model;
        } catch (error) {
            model.dispose();
            throw error;
        }
    })().catch((error) => {
        modelLoadPromise = null;
        throw error;
    });

    return modelLoadPromise;
};

export const isModelReady = () => cachedModel !== null;

export const isModelLoading = () => modelLoadPromise !== null && cachedModel === null;

const isValidImage = (imageSource) => {
    return imageSource instanceof HTMLImageElement
        && imageSource.complete
        && imageSource.naturalWidth > 0
        && imageSource.naturalHeight > 0;
};

export const detectAnimal = async (imageSource) => {
    if (!isValidImage(imageSource)) {
        return {
            success: false,
            error: ErrorMessages[ErrorTypes.INVALID_IMAGE],
            errorType: ErrorTypes.INVALID_IMAGE,
        };
    }

    let inputTensor;
    let prediction;

    try {
        const model = await loadLocalModel();
        inputTensor = tf.tidy(() => {
            const pixels = tf.browser.fromPixels(imageSource);
            const resized = tf.image.resizeBilinear(
                pixels,
                [LOCAL_MODEL_CONFIG.inputSize, LOCAL_MODEL_CONFIG.inputSize],
            );
            // The model contains its own MobileNetV2 [-1, 1] rescaling layer.
            return resized.toFloat().expandDims(0);
        });

        prediction = model.predict(inputTensor);
        const outputTensor = Array.isArray(prediction) ? prediction[0] : prediction;
        const probabilities = Array.from(await outputTensor.data());
        const maxConfidence = Math.max(...probabilities);
        const predictedIndex = probabilities.indexOf(maxConfidence);
        const animalName = ANIMAL_CLASSES[predictedIndex];

        if (!Number.isFinite(maxConfidence) || !animalName) {
            throw new Error('The model returned an invalid prediction.');
        }

        if (maxConfidence < LOCAL_MODEL_CONFIG.confidenceThreshold) {
            return {
                success: false,
                error: ErrorMessages[ErrorTypes.LOW_CONFIDENCE],
                errorType: ErrorTypes.LOW_CONFIDENCE,
            };
        }

        const info = getAnimalInfo(animalName);
        return {
            success: true,
            animal: animalName,
            confidence: Number((maxConfidence * 100).toFixed(1)),
            category: info.category,
            isBulusanAnimal: info.bulusan,
            classIndex: predictedIndex,
            source: 'local',
        };
    } catch (error) {
        console.error('[AI-Detection] Local model error:', error);
        return {
            success: false,
            error: ErrorMessages[ErrorTypes.MODEL_ERROR],
            errorType: ErrorTypes.MODEL_ERROR,
        };
    } finally {
        inputTensor?.dispose();
        disposePrediction(prediction);
    }
};

export const getCurrentSource = () => 'local';

export const getSourceDisplayName = () => 'Bulusan Zoo Local AI Model';

export const getErrorMessage = (errorType) => {
    return ErrorMessages[errorType] || ErrorMessages[ErrorTypes.MODEL_ERROR];
};

export default {
    loadLocalModel,
    isModelReady,
    isModelLoading,
    detectAnimal,
    getCurrentSource,
    getSourceDisplayName,
    getErrorMessage,
    ErrorTypes,
};