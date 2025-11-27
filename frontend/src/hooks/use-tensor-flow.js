import { useState, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';

const ANIMAL_CLASSES = [
    'Bear', 'Bird', 'Cat', 'Cow', 'Deer', 'Dog', 'Dolphin',
    'Elephant', 'Giraffe', 'Horse', 'Kangaroo', 'Lion',
    'Panda', 'Tiger', 'Zebra'
];

const useTensorFlow = () => {
    const [model, setModel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadModel = async () => {
            try {
                setLoading(true);
                setError(null);
                
                await tf.ready();
                const loadedModel = await tf.loadLayersModel('/models/model.json');
                setModel(loadedModel);
            } catch (err) {
                console.error('Error loading model:', err);
                setError('Failed to load AI model');
            } finally {
                setLoading(false);
            }
        };

        loadModel();

        return () => {
            if (model) {
                model.dispose();
            }
        };
    }, []);

    const preprocessImage = useCallback((imageElement) => {
        return tf.tidy(() => {
            let tensor = tf.browser.fromPixels(imageElement);
            tensor = tf.image.resizeBilinear(tensor, [224, 224]);
            tensor = tensor.toFloat().div(tf.scalar(255));
            tensor = tensor.expandDims(0);
            return tensor;
        });
    }, []);

    const predict = useCallback(async (imageElement) => {
        if (!model) {
            throw new Error('Model not loaded');
        }

        try {
            const tensor = preprocessImage(imageElement);
            const predictions = model.predict(tensor);
            const probabilities = await predictions.data();
            
            tensor.dispose();
            predictions.dispose();

            const results = ANIMAL_CLASSES.map((className, index) => ({
                className,
                probability: probabilities[index] * 100
            }));

            results.sort((a, b) => b.probability - a.probability);

            return {
                prediction: results[0].className,
                confidence: results[0].probability,
                allPredictions: results
            };
        } catch (err) {
            console.error('Prediction error:', err);
            throw new Error('Failed to classify image');
        }
    }, [model, preprocessImage]);

    const classifyFromCanvas = useCallback(async (canvas) => {
        return predict(canvas);
    }, [predict]);

    const classifyFromFile = useCallback(async (file) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = async () => {
                try {
                    const result = await predict(img);
                    resolve(result);
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    }, [predict]);

    return {
        model,
        loading,
        error,
        predict,
        classifyFromCanvas,
        classifyFromFile,
        animalClasses: ANIMAL_CLASSES,
        isReady: !loading && !error && model !== null
    };
};

export default useTensorFlow;
