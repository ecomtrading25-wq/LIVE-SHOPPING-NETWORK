import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, MicOff, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

/**
 * Voice Search Component
 * Speech-to-text product search for hands-free shopping
 */

export default function VoiceSearch() {
  const [, setLocation] = useLocation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);

        // If final result, process the search
        if (event.results[current].isFinal) {
          handleVoiceSearch(transcriptText);
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Voice recognition error. Please try again.');
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  const startListening = () => {
    if (!recognition) {
      toast.error('Voice search not supported in this browser');
      return;
    }

    setShowModal(true);
    setTranscript("");
    setIsListening(true);
    recognition.start();
    toast.success('Listening... Speak now!');
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
    }
    setIsListening(false);
  };

  const handleVoiceSearch = async (searchQuery: string) => {
    setIsProcessing(true);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Navigate to search page with query
    setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
    
    setIsProcessing(false);
    setShowModal(false);
    toast.success(`Searching for: ${searchQuery}`);
  };

  const handleClose = () => {
    stopListening();
    setShowModal(false);
    setTranscript("");
  };

  return (
    <>
      {/* Voice Search Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={startListening}
        className="gap-2"
        disabled={isListening}
      >
        <Mic className="w-4 h-4" />
        <span className="hidden sm:inline">Voice Search</span>
      </Button>

      {/* Voice Search Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Voice Search</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Microphone Animation */}
            <div className="flex flex-col items-center gap-6 mb-6">
              <div
                className={`w-32 h-32 rounded-full flex items-center justify-center ${
                  isListening
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse"
                    : "bg-zinc-800"
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-16 h-16 text-white animate-spin" />
                ) : isListening ? (
                  <Mic className="w-16 h-16 text-white" />
                ) : (
                  <MicOff className="w-16 h-16 text-gray-400" />
                )}
              </div>

              <div className="text-center">
                {isProcessing ? (
                  <p className="text-white font-medium">Processing...</p>
                ) : isListening ? (
                  <>
                    <p className="text-white font-medium mb-2">Listening...</p>
                    <p className="text-sm text-gray-400">
                      Try saying: "Show me wireless headphones"
                    </p>
                  </>
                ) : (
                  <p className="text-gray-400">Click the button to start</p>
                )}
              </div>
            </div>

            {/* Transcript Display */}
            {transcript && (
              <div className="mb-6 p-4 bg-zinc-800 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">You said:</p>
                <p className="text-white font-medium">{transcript}</p>
              </div>
            )}

            {/* Control Buttons */}
            <div className="flex gap-3">
              {isListening ? (
                <Button
                  onClick={stopListening}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={isProcessing}
                >
                  <MicOff className="w-4 h-4 mr-2" />
                  Stop Listening
                </Button>
              ) : (
                <Button
                  onClick={startListening}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
                  disabled={isProcessing}
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Start Listening
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isListening || isProcessing}
              >
                Cancel
              </Button>
            </div>

            {/* Tips */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-400 font-medium mb-2">💡 Voice Search Tips:</p>
              <ul className="text-xs text-blue-300 space-y-1">
                <li>• Speak clearly and naturally</li>
                <li>• Try: "Show me [product name]"</li>
                <li>• Try: "Find [category] under $50"</li>
                <li>• Works best in quiet environments</li>
              </ul>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

/**
 * Floating Voice Search Button (for mobile)
 */
export function FloatingVoiceSearch() {
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Show button on mobile devices
    const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    setShowButton(isMobile);
  }, []);

  if (!showButton) return null;

  return (
    <div className="fixed bottom-24 right-6 z-40">
      <VoiceSearch />
    </div>
  );
}
