import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ShoppingBag,
  Truck,
  CreditCard,
  Video,
  MessageCircle,
} from "lucide-react";

/**
 * FAQ Page
 * Frequently Asked Questions with collapsible sections
 */

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  icon: typeof HelpCircle;
  title: string;
  color: string;
  items: FAQItem[];
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const categories: FAQCategory[] = [
    {
      icon: Video,
      title: "Live Shopping",
      color: "text-purple-600",
      items: [
        {
          question: "What is live shopping?",
          answer:
            "Live shopping combines live video streaming with e-commerce. Watch our hosts demonstrate products in real-time, ask questions via chat, and purchase items instantly with exclusive live-only pricing and deals.",
        },
        {
          question: "How do I participate in a live show?",
          answer:
            "Simply visit our homepage when a live show is active (indicated by the red 'LIVE' badge). You can watch the stream, interact via chat, and click 'Buy Now' on pinned products to purchase instantly at live prices.",
        },
        {
          question: "Are live show prices different from regular prices?",
          answer:
            "Yes! Products featured during live shows often have special live-only pricing, flash deals, and exclusive bundles that aren't available outside of the live session. These deals are time-sensitive and quantities are limited.",
        },
        {
          question: "Can I watch past live shows?",
          answer:
            "Yes, we save recordings of our live shows. You can browse past shows in our archive, but please note that live-only pricing and deals are only available during the actual live broadcast.",
        },
      ],
    },
    {
      icon: ShoppingBag,
      title: "Orders & Shopping",
      color: "text-blue-600",
      items: [
        {
          question: "How do I place an order?",
          answer:
            "Browse products on our site, add items to your cart, and proceed to checkout. You can pay securely with credit/debit cards via Stripe. During live shows, you can also use the 'Buy Now' button for instant checkout on featured products.",
        },
        {
          question: "Can I modify or cancel my order?",
          answer:
            "Orders can be modified or cancelled within 1 hour of placement, as long as they haven't entered the fulfillment process. Contact our support team immediately if you need to make changes.",
        },
        {
          question: "Do you offer refunds?",
          answer:
            "Yes, we offer a 30-day return policy for most items. Products must be unused and in original packaging. Refunds are processed within 5-7 business days after we receive your return. Some items (personalized, perishable) are non-returnable.",
        },
        {
          question: "How can I track my order?",
          answer:
            "After your order ships, you'll receive an email with a tracking number. You can also track your order by logging into your account and visiting the 'Orders' section, or by using the order tracking page.",
        },
      ],
    },
    {
      icon: Truck,
      title: "Shipping & Delivery",
      color: "text-green-600",
      items: [
        {
          question: "What are your shipping options?",
          answer:
            "We offer Standard Shipping (5-7 business days), Express Shipping (2-3 business days), and Next-Day Delivery (available in select areas). Shipping costs are calculated at checkout based on your location and order weight.",
        },
        {
          question: "Do you ship internationally?",
          answer:
            "Currently, we ship within the United States and Canada. International shipping to other countries is coming soon. Subscribe to our newsletter to be notified when we expand to your region.",
        },
        {
          question: "What if my package is lost or damaged?",
          answer:
            "If your package is lost in transit or arrives damaged, please contact our support team within 48 hours of the expected delivery date. We'll work with the carrier to locate your package or send a replacement at no additional cost.",
        },
        {
          question: "Can I change my shipping address after ordering?",
          answer:
            "Shipping addresses can only be changed within 1 hour of order placement. After that, orders enter our fulfillment system and addresses cannot be modified. Please double-check your address before completing checkout.",
        },
      ],
    },
    {
      icon: CreditCard,
      title: "Payment & Security",
      color: "text-orange-600",
      items: [
        {
          question: "What payment methods do you accept?",
          answer:
            "We accept all major credit and debit cards (Visa, Mastercard, American Express, Discover) processed securely through Stripe. We also support digital wallets like Apple Pay and Google Pay for faster checkout.",
        },
        {
          question: "Is my payment information secure?",
          answer:
            "Absolutely. We use Stripe for payment processing, which is PCI-DSS Level 1 certified (the highest level of security). We never store your full credit card information on our servers. All transactions are encrypted with industry-standard SSL.",
        },
        {
          question: "Why was my payment declined?",
          answer:
            "Payment declines can occur for several reasons: insufficient funds, incorrect card details, expired card, or your bank flagging the transaction. Please verify your information and try again, or contact your bank for more details.",
        },
        {
          question: "Do you offer payment plans?",
          answer:
            "For orders over $200, we offer installment payment plans through our payment processor. You can split your purchase into 4 interest-free payments. This option will be presented at checkout if your order qualifies.",
        },
      ],
    },
    {
      icon: MessageCircle,
      title: "Account & Support",
      color: "text-pink-600",
      items: [
        {
          question: "Do I need an account to shop?",
          answer:
            "You can browse products without an account, but you'll need to create one to complete a purchase. Having an account allows you to track orders, save items to your wishlist, earn rewards points, and get faster checkout.",
        },
        {
          question: "How do I reset my password?",
          answer:
            "Click 'Sign In' in the top right corner, then click 'Forgot Password'. Enter your email address and we'll send you a password reset link. The link expires after 1 hour for security reasons.",
        },
        {
          question: "How can I contact customer support?",
          answer:
            "You can reach our support team via email at support@liveshoppingnetwork.com, through our live chat feature (available during business hours), or by calling 1-800-LSN-SHOP. We typically respond within 24 hours.",
        },
        {
          question: "What is your rewards program?",
          answer:
            "Our rewards program has 4 tiers (Bronze, Silver, Gold, Platinum). Earn points on every purchase, product review, and referral. Points can be redeemed for discounts on future orders. Higher tiers unlock exclusive perks like early access to sales and free shipping.",
        },
      ],
    },
  ];

  const toggleAccordion = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setOpenIndex(openIndex === key ? null : key);
  };

  return (
    <div className="min-h-screen bg-background text-foreground dark:bg-background">
      {/* Hero Section */}
      <div className="bg-background text-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-background text-foreground/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-8 h-8 text-foreground" />
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Find answers to common questions about live shopping, orders, shipping,
            and more
          </p>
        </div>
      </div>

      {/* FAQ Categories */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">
          {categories.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-6">
                <div
                  className={`w-12 h-12 ${category.color} bg-opacity-10 rounded-xl flex items-center justify-center`}
                >
                  <category.icon className={`w-6 h-6 ${category.color}`} />
                </div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-foreground">
                  {category.title}
                </h2>
                <Badge className="bg-zinc-200 dark:bg-card text-zinc-900 dark:text-foreground">
                  {category.items.length} questions
                </Badge>
              </div>

              {/* FAQ Items */}
              <div className="space-y-4">
                {category.items.map((item, itemIndex) => {
                  const key = `${categoryIndex}-${itemIndex}`;
                  const isOpen = openIndex === key;

                  return (
                    <Card
                      key={itemIndex}
                      className="overflow-hidden bg-background dark:bg-background border-zinc-200 dark:border-border text-foreground"
                    >
                      <button
                        onClick={() => toggleAccordion(categoryIndex, itemIndex)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-background text-foreground dark:hover:bg-card/50 transition-colors text-card-foreground"
                      >
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-foreground text-left">
                          {item.question}
                        </h3>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-zinc-600 dark:text-zinc-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-zinc-600 dark:text-zinc-400 flex-shrink-0" />
                        )}
                      </button>

                      {isOpen && (
                        <div className="px-6 pb-4 border-t border-zinc-200 dark:border-border pt-4">
                          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            {item.answer}
                          </p>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Still Have Questions CTA */}
        <Card className="max-w-4xl mx-auto mt-16 p-12 bg-gradient-to-br from-purple-600 to-pink-600 border-0 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Still Have Questions?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Our support team is here to help you 24/7
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-background text-foreground text-purple-600 hover:bg-zinc-100"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Start Live Chat
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-foreground hover:bg-background/10"
            >
              Email Support
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
