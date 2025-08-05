#!/usr/bin/env python3
"""
Audio Emotion Analyzer
Python script for audio emotion recognition using librosa and TensorFlow
"""

import sys
import json
import librosa
import numpy as np
import tensorflow as tf
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

class AudioEmotionAnalyzer:
    def __init__(self):
        self.model = None
        self.emotion_labels = []
        self.sample_rate = 48000
        self.model_path = None
        self.model_type = 'fast'

    def initialize(self, config):
        """Initialize the analyzer with configuration"""
        self.model_path = config.get('modelPath', './models/audio-emotion')
        self.model_type = config.get('modelType', 'fast')
        self.emotion_labels = config.get('emotionLabels', [
            'neutral', 'calm', 'happy', 'sad', 'angry', 'fearful', 'disgust', 'surprised'
        ])

        # Load or create model
        self.load_model()

    def load_model(self):
        """Load pre-trained model or create a simple one"""
        model_file = Path(self.model_path) / f"{self.model_type}_model.h5"

        if model_file.exists():
            try:
                self.model = tf.keras.models.load_model(str(model_file))
                print(f"Loaded model from {model_file}", file=sys.stderr)
            except Exception as e:
                print(f"Failed to load model: {e}", file=sys.stderr)
                self.create_dummy_model()
        else:
            print(f"Model file not found: {model_file}, creating dummy model", file=sys.stderr)
            self.create_dummy_model()

    def create_dummy_model(self):
        """Create a simple dummy model for demonstration"""
        # Simple model that outputs random predictions
        # In production, this would be replaced with a trained CNN/RNN model
        input_shape = (40,)  # 40 MFCC features

        if self.model_type == 'fast':
            # MobileNet-inspired lightweight model
            self.model = tf.keras.Sequential([
                tf.keras.layers.Dense(64, activation='relu', input_shape=input_shape),
                tf.keras.layers.Dropout(0.3),
                tf.keras.layers.Dense(32, activation='relu'),
                tf.keras.layers.Dropout(0.3),
                tf.keras.layers.Dense(len(self.emotion_labels), activation='softmax')
            ])
        else:
            # ResNet-inspired deeper model
            self.model = tf.keras.Sequential([
                tf.keras.layers.Dense(128, activation='relu', input_shape=input_shape),
                tf.keras.layers.Dropout(0.4),
                tf.keras.layers.Dense(64, activation='relu'),
                tf.keras.layers.Dropout(0.4),
                tf.keras.layers.Dense(32, activation='relu'),
                tf.keras.layers.Dropout(0.3),
                tf.keras.layers.Dense(len(self.emotion_labels), activation='softmax')
            ])

        self.model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
        print(f"Created dummy {self.model_type} model", file=sys.stderr)

    def extract_features(self, audio_path):
        """Extract MFCC and other audio features"""
        try:
            # Load audio file
            y, sr = librosa.load(audio_path, sr=self.sample_rate, duration=3.0)

            # Extract MFCC features (13 coefficients)
            mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            mfcc_mean = np.mean(mfcc, axis=1)
            mfcc_std = np.std(mfcc, axis=1)

            # Extract additional features
            spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
            zero_crossing_rate = np.mean(librosa.feature.zero_crossing_rate(y))
            energy = np.mean(librosa.feature.rms(y=y))

            # Combine features
            features = np.concatenate([
                mfcc_mean,
                mfcc_std,
                [spectral_centroid, zero_crossing_rate, energy]
            ])

            # Pad or truncate to expected size (40 features)
            if len(features) < 40:
                features = np.pad(features, (0, 40 - len(features)), 'constant')
            else:
                features = features[:40]

            return {
                'features': features.tolist(),
                'mfcc': mfcc_mean.tolist(),
                'spectralCentroid': float(spectral_centroid),
                'zeroCrossingRate': float(zero_crossing_rate),
                'energy': float(energy)
            }

        except Exception as e:
            print(f"Feature extraction error: {e}", file=sys.stderr)
            # Return zero features on error
            return {
                'features': [0.0] * 40,
                'mfcc': [0.0] * 13,
                'spectralCentroid': 0.0,
                'zeroCrossingRate': 0.0,
                'energy': 0.0
            }

    def predict_emotion(self, features):
        """Predict emotion from features"""
        try:
            # Reshape features for model input
            features_array = np.array(features['features']).reshape(1, -1)

            # Get prediction
            predictions = self.model.predict(features_array, verbose=0)
            probabilities = predictions[0]

            # Create emotion scores dictionary
            scores = {}
            for i, label in enumerate(self.emotion_labels):
                scores[label] = float(probabilities[i])

            # Find dominant emotion
            dominant_idx = np.argmax(probabilities)
            dominant_emotion = self.emotion_labels[dominant_idx]
            confidence = float(probabilities[dominant_idx])

            return {
                'emotion': dominant_emotion,
                'confidence': confidence,
                'scores': scores
            }

        except Exception as e:
            print(f"Prediction error: {e}", file=sys.stderr)
            # Return neutral emotion on error
            scores = {label: 0.0 for label in self.emotion_labels}
            scores['neutral'] = 1.0

            return {
                'emotion': 'neutral',
                'confidence': 1.0,
                'scores': scores
            }

    def analyze_audio(self, audio_path, session_id, timestamp):
        """Analyze audio file for emotion"""
        try:
            # Extract features
            features = self.extract_features(audio_path)

            # Predict emotion
            emotion_result = self.predict_emotion(features)

            # Create result
            result = {
                'sessionId': session_id,
                'timestamp': timestamp,
                'emotion': emotion_result['emotion'],
                'confidence': emotion_result['confidence'],
                'scores': emotion_result['scores'],
                'features': {
                    'mfcc': features['mfcc'],
                    'spectralCentroid': features['spectralCentroid'],
                    'zeroCrossingRate': features['zeroCrossingRate'],
                    'energy': features['energy']
                },
                'voiceActivity': features['energy'] > 0.01,  # Simple VAD based on energy
                'duration': 1.0  # Assume 1 second duration
            }

            return result

        except Exception as e:
            print(f"Analysis error: {e}", file=sys.stderr)
            return {
                'sessionId': session_id,
                'timestamp': timestamp,
                'error': str(e)
            }

def main():
    analyzer = AudioEmotionAnalyzer()

    # Signal ready
    print("READY")
    sys.stdout.flush()

    # Process requests
    for line in sys.stdin:
        try:
            request = json.loads(line.strip())
            action = request.get('action')

            if action == 'init':
                analyzer.initialize(request['config'])
                response = {'status': 'initialized'}

            elif action == 'analyze':
                audio_path = request['audioPath']
                session_id = request['sessionId']
                timestamp = request['timestamp']

                result = analyzer.analyze_audio(audio_path, session_id, timestamp)
                response = {'result': result, 'sessionId': session_id, 'timestamp': timestamp}

            else:
                response = {'error': f'Unknown action: {action}'}

            print(json.dumps(response))
            sys.stdout.flush()

        except Exception as e:
            error_response = {'error': str(e)}
            print(json.dumps(error_response))
            sys.stdout.flush()

if __name__ == '__main__':
    main()
