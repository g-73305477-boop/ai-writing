
import React, { useState, useRef, useCallback } from 'react';
import { PracticeWord, CanvasRef } from './types';
import { generatePronunciation, checkHandwriting } from './services/geminiService';
import { decode, decodeAudioData } from './utils/audioUtils';
import Canvas from './components/Canvas';

const PRACTICE_WORDS: PracticeWord[] = [
  { word: 'air' },
  { word: 'water' },
  { word: 'shelter' },
  { word: 'food' },
];

type FeedbackType = 'idle' | 'info' | 'correct' | 'incorrect';

const App = () => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('idle');
  const canvasRef = useRef<CanvasRef>(null);

  const currentWord = PRACTICE_WORDS[currentWordIndex];

  const handleNextWord = useCallback(() => {
    setCurrentWordIndex((prevIndex) => (prevIndex + 1) % PRACTICE_WORDS.length);
    setFeedback('');
    setFeedbackType('idle');
    canvasRef.current?.clear();
  }, []);

  const playAudio = async (base64Audio: string) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const decodedData = decode(base64Audio);
      const audioBuffer = await decodeAudioData(decodedData, audioContext);
  
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (error) {
      console.error("Failed to play audio:", error);
      setFeedback("Could not play the pronunciation audio.");
      setFeedbackType('info');
    }
  };
  
  const handleError = (error: unknown, defaultMessage: string) => {
      console.error(defaultMessage, error);
      // Display a generic message to the user instead of a specific API key error.
      // This improves the user experience on new deployments.
      setFeedback(defaultMessage);
      setFeedbackType('info');
  }

  const handlePronunciation = useCallback(async () => {
    try {
      setFeedback('Getting pronunciation...');
      setFeedbackType('info');
      const audioData = await generatePronunciation(currentWord.word);
      if (audioData) {
        await playAudio(audioData);
        setFeedback('');
        setFeedbackType('idle');
      } else {
        setFeedback('Could not get pronunciation.');
        setFeedbackType('info');
      }
    } catch (error) {
      handleError(error, 'Could not fetch pronunciation.');
    }
  }, [currentWord.word]);

  const handleCheckHandwriting = useCallback(async () => {
    if (!canvasRef.current) return;

    const imageDataUrl = canvasRef.current.toDataURL();
    if (imageDataUrl.length < 100) { 
        setFeedback('Please write the word first.');
        setFeedbackType('info');
        return;
    }

    setIsChecking(true);
    setFeedback('Checking...');
    setFeedbackType('info');
    try {
      const result = await checkHandwriting(imageDataUrl, currentWord.word);
      // More robust check: trim, lowercase, and check if it starts with "correct"
      const isCorrect = result.trim().toLowerCase().startsWith('correct');
      setFeedback(isCorrect ? 'Correct!' : 'Incorrect, please try again.');
      setFeedbackType(isCorrect ? 'correct' : 'incorrect');
    } catch (error) {
      handleError(error, 'Error checking handwriting. Please try again.');
    } finally {
      setIsChecking(false);
    }
  }, [currentWord.word]);
  
  const clearCanvas = () => {
    canvasRef.current?.clear();
    setFeedback('');
    setFeedbackType('idle');
  };

  const feedbackStyles = {
    correct: 'bg-green-100 text-green-800',
    incorrect: 'bg-red-100 text-red-800',
    info: 'bg-yellow-100 text-yellow-800',
    idle: 'hidden',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <p className="text-xs text-center text-gray-500 mb-4">Created by kwang Chien Team 1</p>
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">Handwriting Practice</h1>
        <div className="mb-4 text-center">
          <p className="text-xl text-gray-600">Write the word:</p>
          <div className="flex items-center justify-center my-2">
            <p className="text-4xl font-bold text-blue-600">{currentWord.word}</p>
            <button onClick={handlePronunciation} className="ml-4 p-2 rounded-full hover:bg-gray-200" aria-label="Listen to pronunciation">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.858 17.142a5 5 0 010-7.072m2.828 9.9a9 9 0 010-12.728M12 18.5a.5.5 0 01-1 0v-13a.5.5 0 011 0v13z" />
              </svg>
            </button>
          </div>
        </div>
        <Canvas ref={canvasRef} width={380} height={200} feedbackType={feedbackType} />
        <div className="flex justify-between mt-4">
          <button onClick={clearCanvas} className="px-4 py-2 text-white bg-gray-500 rounded hover:bg-gray-600">Clear</button>
          <button onClick={handleCheckHandwriting} disabled={isChecking} className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-blue-300">
            {isChecking ? 'Checking...' : 'A.I Check'}
          </button>
        </div>
        {feedback && (
          <div className={`mt-4 text-center p-2 rounded flex items-center justify-center font-semibold ${feedbackStyles[feedbackType]}`}>
            {feedbackType === 'correct' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {feedbackType === 'incorrect' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <p>{feedback}</p>
          </div>
        )}
        <div className="mt-6 text-center">
          <button onClick={handleNextWord} className="px-6 py-2 text-white bg-indigo-500 rounded-full hover:bg-indigo-600">Next Word</button>
        </div>
      </div>
    </div>
  );
};

export default App;
