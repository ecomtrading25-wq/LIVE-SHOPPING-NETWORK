import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Gift, Heart, PartyPopper, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";

/**
 * Gift Cards Purchase Page
 * Purchase and send gift cards with custom designs
 */

export default function GiftCardsPage() {
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [selectedDesign, setSelectedDesign] = useState<string>("birthday");
  const [recipientEmail, setRecipientEmail] = useState<string>("");
  const [recipientName, setRecipientName] = useState<string>("");
  const [senderName, setSenderName] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("now");

  const presetAmounts = [25, 50, 100, 150, 200];

  const designs = [
    {
      id: "birthday",
      name: "Happy Birthday",
      icon: PartyPopper,
      gradient: "from-pink-500 to-purple-500",
      category: "celebration",
    },
    {
      id: "holiday",
      name: "Holiday Cheer",
      icon: Sparkles,
      gradient: "from-red-500 to-green-500",
      category: "seasonal",
    },
    {
      id: "thankyou",
      name: "Thank You",
      icon: Heart,
      gradient: "from-rose-500 to-pink-500",
      category: "gratitude",
    },
    {
      id: "congratulations",
      name: "Congratulations",
      icon: Check,
      gradient: "from-blue-500 to-cyan-500",
      category: "celebration",
    },
    {
      id: "default",
      name: "Classic",
      icon: Gift,
      gradient: "from-purple-500 to-indigo-500",
      category: "general",
    },
  ];

  const handlePurchase = () => {
    const amount = customAmount ? parseFloat(customAmount) : selectedAmount;

    if (!recipientEmail) {
      toast.error("Please enter recipient email");
      return;
    }

    if (amount < 10 || amount > 500) {
      toast.error("Amount must be between $10 and $500");
      return;
    }

    toast.success(`Gift card purchased! Confirmation sent to ${recipientEmail}`);
    
    // Reset form
    setRecipientEmail("");
    setRecipientName("");
    setSenderName("");
    setMessage("");
  };

  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount;
  const selectedDesignData = designs.find((d) => d.id === selectedDesign);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">
            <Gift className="inline w-12 h-12 mr-4" />
            Gift Cards
          </h1>
          <p className="text-xl text-muted-foreground">
            Give the gift of choice with a Live Shopping Network gift card
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Left: Gift Card Preview */}
          <div className="space-y-6">
            <Card className="bg-background text-foreground/10 border-white/20 backdrop-blur-xl overflow-hidden">
              <CardContent className="p-0">
                <div
                  className={`relative h-80 bg-gradient-to-br ${selectedDesignData?.gradient} p-8 flex flex-col justify-between`}
                >
                  {/* Design Icon */}
                  <div className="flex justify-between items-start">
                    {selectedDesignData && (
                      <selectedDesignData.icon className="w-16 h-16 text-white/80" />
                    )}
                    <div className="text-right">
                      <p className="text-white/80 text-sm">Gift Card</p>
                      <p className="text-foreground font-bold text-2xl">
                        ${finalAmount.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Message Preview */}
                  {message && (
                    <div className="bg-background text-foreground/20 backdrop-blur-sm rounded-lg p-4">
                      <p className="text-foreground text-sm italic">"{message}"</p>
                    </div>
                  )}

                  {/* Recipient Info */}
                  <div>
                    {recipientName && (
                      <p className="text-foreground text-lg font-medium mb-1">
                        To: {recipientName}
                      </p>
                    )}
                    {senderName && (
                      <p className="text-white/80 text-sm">From: {senderName}</p>
                    )}
                  </div>

                  {/* Brand */}
                  <div className="absolute bottom-4 right-4">
                    <p className="text-white/60 text-xs">Live Shopping Network</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-background text-foreground/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Check className="w-6 h-6 text-green-400" />
                  </div>
                  <p className="text-foreground font-medium">No Expiration</p>
                  <p className="text-gray-400 text-sm">Never expires</p>
                </CardContent>
              </Card>

              <Card className="bg-background text-foreground/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Gift className="w-6 h-6 text-blue-400" />
                  </div>
                  <p className="text-foreground font-medium">Instant Delivery</p>
                  <p className="text-gray-400 text-sm">Email delivery</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right: Purchase Form */}
          <Card className="bg-background text-foreground/10 border-white/20 backdrop-blur-xl">
            <CardContent className="p-6 space-y-6">
              {/* Amount Selection */}
              <div>
                <Label className="text-foreground text-lg mb-3 block">Select Amount</Label>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {presetAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant={selectedAmount === amount && !customAmount ? "default" : "outline"}
                      className={
                        selectedAmount === amount && !customAmount
                          ? "bg-purple-600"
                          : "bg-background/10 border-white/20 text-foreground hover:bg-background/20"
                      }
                      onClick={() => {
                        setSelectedAmount(amount);
                        setCustomAmount("");
                      }}
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
                <div>
                  <Label className="text-foreground text-sm">Custom Amount ($10-$500)</Label>
                  <Input
                    type="number"
                    placeholder="Enter custom amount"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="bg-background/10 border-white/20 text-foreground"
                    min="10"
                    max="500"
                  />
                </div>
              </div>

              {/* Design Selection */}
              <div>
                <Label className="text-foreground text-lg mb-3 block">Choose Design</Label>
                <RadioGroup value={selectedDesign} onValueChange={setSelectedDesign}>
                  <div className="grid grid-cols-2 gap-3">
                    {designs.map((design) => (
                      <label
                        key={design.id}
                        className={`relative cursor-pointer rounded-lg border-2 transition-all ${
                          selectedDesign === design.id
                            ? "border-purple-500 bg-purple-500/20"
                            : "border-white/20 bg-background text-foreground/5 hover:bg-background text-foreground/10"
                        }`}
                      >
                        <div className="p-4">
                          <RadioGroupItem
                            value={design.id}
                            className="sr-only"
                          />
                          <div
                            className={`w-full h-24 rounded-lg bg-gradient-to-br ${design.gradient} flex items-center justify-center mb-2`}
                          >
                            <design.icon className="w-8 h-8 text-foreground" />
                          </div>
                          <p className="text-foreground text-sm font-medium text-center">
                            {design.name}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              {/* Recipient Info */}
              <div className="space-y-3">
                <div>
                  <Label className="text-foreground">Recipient Email *</Label>
                  <Input
                    type="email"
                    placeholder="recipient@example.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="bg-background/10 border-white/20 text-foreground"
                  />
                </div>

                <div>
                  <Label className="text-foreground">Recipient Name (Optional)</Label>
                  <Input
                    placeholder="John Doe"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="bg-background/10 border-white/20 text-foreground"
                  />
                </div>

                <div>
                  <Label className="text-foreground">Your Name (Optional)</Label>
                  <Input
                    placeholder="Your name"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="bg-background/10 border-white/20 text-foreground"
                  />
                </div>

                <div>
                  <Label className="text-foreground">Personal Message (Optional)</Label>
                  <Textarea
                    placeholder="Add a personal message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="bg-background/10 border-white/20 text-foreground"
                    rows={3}
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {message.length}/200 characters
                  </p>
                </div>
              </div>

              {/* Delivery Options */}
              <div>
                <Label className="text-foreground text-lg mb-3 block">Delivery</Label>
                <RadioGroup value={deliveryDate} onValueChange={setDeliveryDate}>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-white/20 bg-background text-foreground/5 hover:bg-background text-foreground/10 cursor-pointer">
                      <RadioGroupItem value="now" />
                      <div>
                        <p className="text-foreground font-medium">Send Now</p>
                        <p className="text-gray-400 text-sm">Instant email delivery</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-white/20 bg-background text-foreground/5 hover:bg-background text-foreground/10 cursor-pointer">
                      <RadioGroupItem value="schedule" />
                      <div className="flex-1">
                        <p className="text-foreground font-medium">Schedule Delivery</p>
                        <Input
                          type="date"
                          className="mt-2 bg-background/10 border-white/20 text-foreground"
                          disabled={deliveryDate !== "schedule"}
                        />
                      </div>
                    </label>
                  </div>
                </RadioGroup>
              </div>

              {/* Purchase Button */}
              <div className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-foreground text-lg">Total:</span>
                  <span className="text-foreground text-3xl font-bold">
                    ${finalAmount.toFixed(2)}
                  </span>
                </div>
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  onClick={handlePurchase}
                >
                  Purchase Gift Card
                </Button>
                <p className="text-center text-gray-400 text-xs mt-2">
                  Secure checkout powered by Stripe
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Do gift cards expire?",
                a: "No, our gift cards never expire. Recipients can use them whenever they want.",
              },
              {
                q: "Can gift cards be used for live shopping sessions?",
                a: "Yes! Gift cards can be used for any purchase on Live Shopping Network, including live shopping sessions and regular products.",
              },
              {
                q: "What if I enter the wrong email address?",
                a: "Contact our support team immediately and we'll help redirect the gift card to the correct email.",
              },
              {
                q: "Can I check my gift card balance?",
                a: "Yes, recipients can check their balance anytime by entering their gift card code on our balance checker page.",
              },
            ].map((faq, idx) => (
              <Card key={idx} className="bg-background text-foreground/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-4">
                  <p className="text-foreground font-medium mb-2">{faq.q}</p>
                  <p className="text-gray-400 text-sm">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
