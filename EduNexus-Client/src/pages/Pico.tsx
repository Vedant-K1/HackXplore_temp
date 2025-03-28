import React, { useEffect, useState } from 'react';
import { WebVoiceProcessor } from '@picovoice/web-voice-processor';
import { PorcupineWorker } from '@picovoice/porcupine-web';
import { modelParams } from '../assets/pico/porcupine_params';
import { keyword_params } from '../assets/pico/hey_nex_wasm';


const PorcupineTest: React.FC = () => {  
  const [isListening, setIsListening] = useState(false);
  const ACCESS_KEY = 'k2/vH1u/xdOwDZZh9aFev+jC55I3GFFFbVIr+F3wIs5rWnqw2NaGaQ==';
  const porcupineKeywords = [{ base64: keyword_params, label: "WORD HAS BEEN DETECTED",}]
  const porcupineModel = { base64: modelParams, customWritePath: 'hey_nex', forceWrite: true, version: 1,}

  useEffect(() => {
    const initPorcupine = async () => {
      const keywordCallback = (detection: any) => {
        console.log(`Detected keyword: ${detection.label}`);
      };

      // Initialize Porcupine Worker
      const porcupine = await PorcupineWorker.create(
        ACCESS_KEY,
        // BuiltInKeyword.Alexa,
        porcupineKeywords,
        keywordCallback,
        porcupineModel
      );

      await WebVoiceProcessor.subscribe(porcupine);
      setIsListening(true);

      return () => {
        WebVoiceProcessor.unsubscribe(porcupine);
        porcupine.terminate();
      };
    };

    initPorcupine();

  }, [ACCESS_KEY]);

  return (
    <div>
      <h1>Porcupine Wake Word Detection</h1>
      <p>{isListening ? 'Listening for wake word...' : 'Initializing...'}</p>
    </div>
  );
};

export default PorcupineTest;
