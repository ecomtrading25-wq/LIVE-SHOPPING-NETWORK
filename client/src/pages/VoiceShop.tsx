import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Mic,
  MicOff,
  Volume2,
  ShoppingCart,
  Check,
  X,
  Loader2,
  Sparkles,
  Package,
  Search,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Voice Commerce Platform
 * Speech-to-text ordering, wake-word detection, voice search, hands-free checkout
 */

interface VoiceCommand {
  id: string;
  transcript: string;
  timestamp: Date;
  action: "search" | "add_to_cart" | "remove_from_cart" | "checkout" | "info" | "unknown";
  confidence: number;
  result?: string;
}

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export default function VoiceShopPage() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [commands, setCommands] = useState<VoiceCommand[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wakeWordActive, setWakeWordActive] = useState(true);
  const [lastWakeWord, setLastWakeWord] = useState<Date | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Web Speech API
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(interimTranscript || finalTranscript);
        
        if (finalTranscript) {
          handleVoiceCommand(finalTranscript, event.results[event.results.length - 1][0].confidence);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          toast.error('No speech detected. Please try again.');
        }
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Wake word detection (simplified - in production use a proper wake word library)
  useEffect(() => {
    if (wakeWordActive && transcript.toLowerCase().includes('hey shopping')) {
      setLastWakeWord(new Date());
      speak('Yes, how can I help you?');
      setTranscript('');
    }
  }, [transcript, wakeWordActive]);

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
      toast.success('Voice shopping activated');
    } else {
      toast.error('Speech recognition not supported in this browser');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      setTranscript('');
    }
  };

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceCommand = async (text: string, confidence: number) => {
    setIsProcessing(true);
    const lowerText = text.toLowerCase();
    
    let action: VoiceCommand['action'] = 'unknown';
    let result = '';

    // Search command
    if (lowerText.includes('search') || lowerText.includes('find') || lowerText.includes('show me')) {
      action = 'search';
      const searchTerm = text.replace(/search|find|show me/gi, '').trim();
      result = `Searching for "${searchTerm}"...`;
      speak(`Searching for ${searchTerm}`);
      
      // Mock search results
      setTimeout(() => {
        speak(`I found 12 products matching ${searchTerm}. The top result is Wireless Earbuds Pro for $89.99. Would you like to add it to your cart?`);
      }, 1000);
    }
    
    // Add to cart command
    else if (lowerText.includes('add') && (lowerText.includes('cart') || lowerText.includes('basket'))) {
      action = 'add_to_cart';
      
      // Mock product (in production, parse product name from command)
      const mockProduct: CartItem = {
        productId: Date.now().toString(),
        name: 'Wireless Earbuds Pro',
        price: 89.99,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200',
      };
      
      setCart(prev => {
        const existing = prev.find(item => item.productId === mockProduct.productId);
        if (existing) {
          return prev.map(item =>
            item.productId === mockProduct.productId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        }
        return [...prev, mockProduct];
      });
      
      result = `Added ${mockProduct.name} to cart`;
      speak(`Added ${mockProduct.name} to your cart for $${mockProduct.price}`);
    }
    
    // Remove from cart command
    else if (lowerText.includes('remove') && (lowerText.includes('cart') || lowerText.includes('basket'))) {
      action = 'remove_from_cart';
      
      if (cart.length > 0) {
        const removed = cart[cart.length - 1];
        setCart(prev => prev.slice(0, -1));
        result = `Removed ${removed.name} from cart`;
        speak(`Removed ${removed.name} from your cart`);
      } else {
        result = 'Your cart is empty';
        speak('Your cart is already empty');
      }
    }
    
    // Checkout command
    else if (lowerText.includes('checkout') || lowerText.includes('buy') || lowerText.includes('purchase')) {
      action = 'checkout';
      
      if (cart.length > 0) {
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        result = `Proceeding to checkout. Total: $${total.toFixed(2)}`;
        speak(`Your total is $${total.toFixed(2)}. Say "confirm checkout" to complete your purchase, or "cancel" to go back.`);
      } else {
        result = 'Your cart is empty';
        speak('Your cart is empty. Please add items before checking out.');
      }
    }
    
    // Info command
    else if (lowerText.includes('what') || lowerText.includes('how many') || lowerText.includes('total')) {
      action = 'info';
      
      if (lowerText.includes('cart') || lowerText.includes('basket')) {
        const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        result = `You have ${itemCount} items in your cart. Total: $${total.toFixed(2)}`;
        speak(`You have ${itemCount} items in your cart, with a total of $${total.toFixed(2)}`);
      }
    }
    
    // Unknown command
    else {
      result = 'I didn\'t understand that command. Try saying "search for product", "add to cart", or "checkout"';
      speak('I didn\'t understand that. You can say things like search for wireless earbuds, add to cart, or checkout.');
    }

    const command: VoiceCommand = {
      id: Date.now().toString(),
      transcript: text,
      timestamp: new Date(),
      action,
      confidence,
      result,
    };

    setCommands(prev => [command, ...prev].slice(0, 10));
    setTranscript('');
    setIsProcessing(false);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const quickCommands = [
    { label: 'Search Products', command: 'Search for wireless earbuds' },
    { label: 'Add to Cart', command: 'Add to cart' },
    { label: 'View Cart', command: 'What\'s in my cart?' },
    { label: 'Checkout', command: 'Proceed to checkout' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
            <Mic className="w-10 h-10 text-foreground" />
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4">Voice Shopping</h1>
          <p className="text-muted-foreground text-xl mb-6">Shop hands-free with voice commands</p>
          
          {/* Wake Word Status */}
          {wakeWordActive && (
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Say "Hey Shopping" to activate
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Voice Control */}
          <div className="lg:col-span-2 space-y-6">
            {/* Microphone Control */}
            <Card className="p-8 bg-background text-foreground/5 border-white/10">
              <div className="text-center">
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 transition-all ${
                    isListening
                      ? 'bg-gradient-to-br from-red-500 to-pink-500 animate-pulse'
                      : 'bg-gradient-to-br from-purple-500 to-pink-500 hover:scale-110'
                  }`}
                >
                  {isListening ? (
                    <MicOff className="w-16 h-16 text-foreground" />
                  ) : (
                    <Mic className="w-16 h-16 text-foreground" />
                  )}
                </button>

                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {isListening ? 'Listening...' : 'Tap to Start'}
                </h2>
                
                {/* Live Transcript */}
                {transcript && (
                  <div className="mt-6 p-4 bg-background text-foreground/10 rounded-lg">
                    <p className="text-foreground text-lg">{transcript}</p>
                    {isProcessing && (
                      <Loader2 className="w-5 h-5 text-purple-400 animate-spin mx-auto mt-2" />
                    )}
                  </div>
                )}

                {/* Quick Commands */}
                <div className="mt-8">
                  <p className="text-gray-400 text-sm mb-4">Quick Commands:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {quickCommands.map((cmd) => (
                      <Button
                        key={cmd.label}
                        variant="outline"
                        onClick={() => handleVoiceCommand(cmd.command, 1.0)}
                        disabled={isProcessing}
                      >
                        <Volume2 className="w-4 h-4 mr-2" />
                        {cmd.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Command History */}
            <Card className="p-6 bg-background text-foreground/5 border-white/10">
              <h2 className="text-2xl font-bold text-foreground mb-6">Command History</h2>
              <div className="space-y-3">
                {commands.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No commands yet. Start speaking to see your history.</p>
                ) : (
                  commands.map((command) => (
                    <Card key={command.id} className="p-4 bg-background text-foreground/5 border-white/10">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          command.action === 'search' ? 'bg-blue-500/20' :
                          command.action === 'add_to_cart' ? 'bg-green-500/20' :
                          command.action === 'remove_from_cart' ? 'bg-red-500/20' :
                          command.action === 'checkout' ? 'bg-purple-500/20' :
                          command.action === 'info' ? 'bg-yellow-500/20' :
                          'bg-gray-500/20'
                        }`}>
                          {command.action === 'search' && <Search className="w-5 h-5 text-blue-400" />}
                          {command.action === 'add_to_cart' && <Plus className="w-5 h-5 text-green-400" />}
                          {command.action === 'remove_from_cart' && <Minus className="w-5 h-5 text-red-400" />}
                          {command.action === 'checkout' && <ShoppingCart className="w-5 h-5 text-purple-400" />}
                          {command.action === 'info' && <Package className="w-5 h-5 text-yellow-400" />}
                          {command.action === 'unknown' && <X className="w-5 h-5 text-gray-400" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-foreground font-medium mb-1">"{command.transcript}"</p>
                          <p className="text-gray-400 text-sm mb-2">{command.result}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{command.timestamp.toLocaleTimeString()}</span>
                            <span>•</span>
                            <span>Confidence: {(command.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Cart Sidebar */}
          <div className="space-y-6">
            {/* Cart Summary */}
            <Card className="p-6 bg-background text-foreground/5 border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Your Cart</h2>
                <Badge className="bg-purple-500/20 text-purple-400">
                  {cartItemCount} items
                </Badge>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Your cart is empty</p>
                  <p className="text-gray-500 text-sm mt-2">Say "add to cart" to add items</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item) => (
                      <div key={item.productId} className="flex gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="text-foreground font-medium text-sm mb-1">{item.name}</p>
                          <p className="text-gray-400 text-sm">Qty: {item.quantity}</p>
                          <p className="text-purple-400 font-bold">${item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/10 pt-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">Subtotal</span>
                      <span className="text-foreground font-bold">${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">Shipping</span>
                      <span className="text-green-400">FREE</span>
                    </div>
                    <div className="flex items-center justify-between text-xl font-bold">
                      <span className="text-foreground">Total</span>
                      <span className="text-foreground">${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Proceed to Checkout
                  </Button>
                </>
              )}
            </Card>

            {/* Voice Tips */}
            <Card className="p-6 bg-background text-foreground/5 border-white/10">
              <h3 className="text-xl font-bold text-foreground mb-4">Voice Commands</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5" />
                  <span className="text-muted-foreground">"Search for wireless earbuds"</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5" />
                  <span className="text-muted-foreground">"Add to cart"</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5" />
                  <span className="text-muted-foreground">"What's in my cart?"</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5" />
                  <span className="text-muted-foreground">"Remove from cart"</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-400 mt-0.5" />
                  <span className="text-muted-foreground">"Proceed to checkout"</span>
                </li>
              </ul>
            </Card>

            {/* Settings */}
            <Card className="p-6 bg-background text-foreground/5 border-white/10">
              <h3 className="text-xl font-bold text-foreground mb-4">Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Wake Word Detection</span>
                  <button
                    onClick={() => setWakeWordActive(!wakeWordActive)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      wakeWordActive ? 'bg-purple-500' : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-background text-foreground rounded-full transition-transform ${
                        wakeWordActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
