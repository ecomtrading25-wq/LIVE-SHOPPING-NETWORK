import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, X, Loader2, Search, ShoppingCart } from "lucide-react";
import { useLocation } from "wouter";

interface VoiceCommand {
  type: "search" | "navigate" | "add_to_cart" | "unknown";
  query?: string;
  productId?: string;
  destination?: string;
}

/**
 * Voice Shopping Assistant
 * Hands-free shopping experience with speech recognition
 * Voice commands for search, navigation, and cart actions
 */
export default function VoiceShoppingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setLocation] = useLocation();
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);

        if (event.results[current].isFinal) {
          processVoiceCommand(transcriptText);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setFeedback("Sorry, I didn't catch that. Please try again.");
        speak("Sorry, I didn't catch that. Please try again.");
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Initialize speech synthesis
    synthRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const speak = (text: string) => {
    if (synthRef.current) {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      synthRef.current.speak(utterance);
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript("");
      setFeedback("");
      setIsListening(true);
      recognitionRef.current.start();
      speak("I'm listening. How can I help you?");
    } else {
      setFeedback("Voice recognition is not supported in your browser.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const parseVoiceCommand = (text: string): VoiceCommand => {
    const lowerText = text.toLowerCase();

    // Search commands
    if (lowerText.includes("search for") || lowerText.includes("find") || lowerText.includes("show me")) {
      const query = lowerText
        .replace(/search for/gi, "")
        .replace(/find/gi, "")
        .replace(/show me/gi, "")
        .trim();
      return { type: "search", query };
    }

    // Navigation commands
    if (lowerText.includes("go to") || lowerText.includes("open") || lowerText.includes("show")) {
      if (lowerText.includes("cart") || lowerText.includes("shopping cart")) {
        return { type: "navigate", destination: "/cart" };
      }
      if (lowerText.includes("wishlist") || lowerText.includes("favorites")) {
        return { type: "navigate", destination: "/wishlist" };
      }
      if (lowerText.includes("home") || lowerText.includes("homepage")) {
        return { type: "navigate", destination: "/" };
      }
      if (lowerText.includes("products") || lowerText.includes("shop")) {
        return { type: "navigate", destination: "/products" };
      }
      if (lowerText.includes("rewards") || lowerText.includes("points")) {
        return { type: "navigate", destination: "/rewards" };
      }
    }

    // Add to cart commands
    if (lowerText.includes("add to cart") || lowerText.includes("buy this")) {
      return { type: "add_to_cart" };
    }

    return { type: "unknown" };
  };

  const processVoiceCommand = async (text: string) => {
    setIsProcessing(true);
    const command = parseVoiceCommand(text);

    switch (command.type) {
      case "search":
        if (command.query) {
          setFeedback(`Searching for "${command.query}"...`);
          speak(`Searching for ${command.query}`);
          setTimeout(() => {
            setLocation(`/search?q=${encodeURIComponent(command.query!)}`);
            setIsOpen(false);
          }, 1000);
        }
        break;

      case "navigate":
        if (command.destination) {
          const destinationName = command.destination.replace("/", "").replace("-", " ");
          setFeedback(`Opening ${destinationName}...`);
          speak(`Opening ${destinationName}`);
          setTimeout(() => {
            setLocation(command.destination!);
            setIsOpen(false);
          }, 1000);
        }
        break;

      case "add_to_cart":
        setFeedback("Please navigate to a product page first to add items to cart.");
        speak("Please navigate to a product page first to add items to cart.");
        break;

      case "unknown":
        setFeedback("I didn't understand that command. Try saying 'search for headphones' or 'go to cart'.");
        speak("I didn't understand that command. Try saying search for headphones or go to cart.");
        break;
    }

    setIsProcessing(false);
  };

  const exampleCommands = [
    { icon: Search, text: "Search for wireless headphones" },
    { icon: ShoppingCart, text: "Go to cart" },
    { icon: Search, text: "Find running shoes" },
    { icon: ShoppingCart, text: "Show me my wishlist" },
  ];

  return (
    <>
      {/* Voice Assistant Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        title="Voice Shopping Assistant"
      >
        <Mic className="w-6 h-6 text-foreground" />
      </button>

      {/* Voice Assistant Modal */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/60 z-40 text-foreground"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-x-4 bottom-4 z-50 max-w-md mx-auto md:bottom-auto md:top-1/2 md:-translate-y-1/2">
            <Card className="p-6 bg-background border-purple-500/30 text-foreground">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Mic className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Voice Assistant</h3>
                    <p className="text-sm text-gray-400">Ask me anything!</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-card rounded-full transition-colors text-card-foreground"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Microphone Button */}
              <div className="flex flex-col items-center mb-6">
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={isProcessing}
                  className={`
                    w-24 h-24 rounded-full flex items-center justify-center transition-all
                    ${isListening
                      ? "bg-red-600 hover:bg-red-700 animate-pulse"
                      : "bg-purple-600 hover:bg-purple-700"
                    }
                    ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  {isProcessing ? (
                    <Loader2 className="w-10 h-10 text-foreground animate-spin" />
                  ) : isListening ? (
                    <MicOff className="w-10 h-10 text-foreground" />
                  ) : (
                    <Mic className="w-10 h-10 text-foreground" />
                  )}
                </button>
                <p className="text-sm text-gray-400 mt-4">
                  {isListening
                    ? "Listening..."
                    : isProcessing
                    ? "Processing..."
                    : "Tap to speak"}
                </p>
              </div>

              {/* Transcript */}
              {transcript && (
                <div className="mb-4 p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">You said:</p>
                  <p className="text-foreground">{transcript}</p>
                </div>
              )}

              {/* Feedback */}
              {feedback && (
                <div className="mb-4 p-4 bg-purple-500/20 rounded-lg border border-purple-500/30">
                  <div className="flex items-start gap-2">
                    <Volume2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <p className="text-foreground text-sm">{feedback}</p>
                  </div>
                </div>
              )}

              {/* Example Commands */}
              <div>
                <p className="text-sm text-gray-400 mb-3">Try saying:</p>
                <div className="space-y-2">
                  {exampleCommands.map((cmd, index) => {
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setTranscript(cmd.text);
                          processVoiceCommand(cmd.text);
                        }}
                        className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
                      >
                        <Icon className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-muted-foreground">{cmd.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Browser Support Notice */}
              {!recognitionRef.current && (
                <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                  <p className="text-sm text-yellow-400">
                    Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}
