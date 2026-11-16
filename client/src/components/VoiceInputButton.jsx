import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Sparkles } from 'lucide-react';

const VoiceInputButton = ({ onTranscript, className = '' }) => {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (onTranscript) {
        onTranscript(transcript);
      }
      setIsListening(false);
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    setRecognition(rec);
  }, [onTranscript]);

  const toggleListen = () => {
    if (!supported) {
      alert('Speech recognition is not supported in this browser. Please type text directly.');
      return;
    }

    if (isListening) {
      recognition?.stop();
    } else {
      recognition?.start();
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={toggleListen}
        className={`px-4 py-3 rounded-2xl font-extrabold text-xs transition-all shadow-xl flex items-center justify-center gap-2.5 cursor-pointer ${
          isListening
            ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse ring-4 ring-rose-500/40'
            : 'bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white shadow-blue-500/25'
        } ${className}`}
        title="Tap to speak your complaint hands-free"
      >
        {isListening ? (
          <>
            <MicOff className="w-5 h-5 animate-bounce text-white" />
            <span className="text-sm tracking-wide">LISTENING... SPEAK NOW</span>
          </>
        ) : (
          <>
            <Mic className="w-5 h-5 text-white" />
            <span className="text-sm tracking-wide">🎙️ TAP TO SPEAK (VOICE INPUT)</span>
          </>
        )}
      </button>

      {isListening && (
        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 animate-pulse">
          <Sparkles className="w-3 h-3" /> Speaking recognized... Say your issue clearly.
        </span>
      )}
    </div>
  );
};

export default VoiceInputButton;
