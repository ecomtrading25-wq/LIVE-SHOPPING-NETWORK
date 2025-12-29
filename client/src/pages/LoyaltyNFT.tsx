import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  Award,
  Lock,
  Unlock,
  ExternalLink,
  Copy,
  CheckCircle,
  TrendingUp,
  Zap,
  Gift,
  Crown,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Blockchain Loyalty & NFT Rewards
 * Crypto wallet integration, NFT badge minting, token-gated products
 */

interface NFTBadge {
  id: string;
  name: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  image: string;
  description: string;
  minted: boolean;
  mintDate?: string;
  tokenId?: string;
  benefits: string[];
  requiredPoints: number;
}

interface TokenGatedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  requiredTier: "bronze" | "silver" | "gold" | "platinum";
  stock: number;
  exclusive: boolean;
}

interface Transaction {
  id: string;
  type: "mint" | "transfer" | "reward";
  amount?: number;
  hash: string;
  timestamp: string;
  status: "pending" | "confirmed" | "failed";
}

export default function LoyaltyNFTPage() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [currentTier, setCurrentTier] = useState<"bronze" | "silver" | "gold" | "platinum">("gold");
  const [loyaltyPoints, setLoyaltyPoints] = useState(8450);

  // Mock NFT badges
  const nftBadges: NFTBadge[] = [
    {
      id: "1",
      name: "Bronze Member",
      tier: "bronze",
      image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400",
      description: "Welcome to the loyalty program! Your journey begins here.",
      minted: true,
      mintDate: "2025-01-15",
      tokenId: "0x1a2b3c",
      benefits: ["5% cashback", "Early access to sales", "Birthday rewards"],
      requiredPoints: 0,
    },
    {
      id: "2",
      name: "Silver Member",
      tier: "silver",
      image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=400",
      description: "You're making progress! Enjoy enhanced benefits.",
      minted: true,
      mintDate: "2025-03-20",
      tokenId: "0x4d5e6f",
      benefits: ["10% cashback", "Free shipping", "Priority support", "Exclusive products"],
      requiredPoints: 2500,
    },
    {
      id: "3",
      name: "Gold Member",
      tier: "gold",
      image: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=400",
      description: "Elite status achieved! Access premium perks.",
      minted: true,
      mintDate: "2025-08-10",
      tokenId: "0x7g8h9i",
      benefits: ["15% cashback", "Free express shipping", "VIP support", "Limited editions", "Event invites"],
      requiredPoints: 7500,
    },
    {
      id: "4",
      name: "Platinum Member",
      tier: "platinum",
      image: "https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=400",
      description: "The ultimate tier! Unlock everything.",
      minted: false,
      benefits: ["20% cashback", "Free overnight shipping", "Dedicated concierge", "All exclusives", "Private sales", "NFT airdrops"],
      requiredPoints: 15000,
    },
  ];

  // Mock token-gated products
  const tokenGatedProducts: TokenGatedProduct[] = [
    {
      id: "1",
      name: "Limited Edition Sneakers",
      price: 299.99,
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
      requiredTier: "gold",
      stock: 50,
      exclusive: true,
    },
    {
      id: "2",
      name: "Designer Watch Collection",
      price: 1499.99,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
      requiredTier: "platinum",
      stock: 25,
      exclusive: true,
    },
    {
      id: "3",
      name: "Exclusive Tech Bundle",
      price: 899.99,
      image: "https://images.unsplash.com/photo-1593642532842-98d0fd5ebc1a?w=400",
      requiredTier: "silver",
      stock: 100,
      exclusive: true,
    },
    {
      id: "4",
      name: "VIP Experience Package",
      price: 2999.99,
      image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400",
      requiredTier: "platinum",
      stock: 10,
      exclusive: true,
    },
  ];

  // Mock transactions
  const transactions: Transaction[] = [
    {
      id: "1",
      type: "mint",
      hash: "0x7g8h9i4j5k6l7m8n9o0p1q2r3s4t5u6v7w8x9y0z",
      timestamp: "2025-08-10T14:30:00Z",
      status: "confirmed",
    },
    {
      id: "2",
      type: "reward",
      amount: 500,
      hash: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t",
      timestamp: "2025-09-15T10:20:00Z",
      status: "confirmed",
    },
    {
      id: "3",
      type: "mint",
      hash: "0x4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w",
      timestamp: "2025-03-20T16:45:00Z",
      status: "confirmed",
    },
  ];

  const handleConnectWallet = async () => {
    // Mock wallet connection (in production, use Web3/ethers.js)
    toast.success("Connecting to MetaMask...");
    setTimeout(() => {
      setWalletConnected(true);
      setWalletAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
      toast.success("Wallet connected successfully!");
    }, 1500);
  };

  const handleDisconnectWallet = () => {
    setWalletConnected(false);
    setWalletAddress("");
    toast.success("Wallet disconnected");
  };

  const handleMintNFT = (badge: NFTBadge) => {
    if (!walletConnected) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (loyaltyPoints < badge.requiredPoints) {
      toast.error(`You need ${badge.requiredPoints - loyaltyPoints} more points to mint this NFT`);
      return;
    }

    toast.success(`Minting ${badge.name} NFT...`);
    setTimeout(() => {
      toast.success("NFT minted successfully! Check your wallet.");
    }, 2000);
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast.success("Address copied to clipboard");
  };

  const handleViewOnEtherscan = (hash: string) => {
    toast.success("Opening Etherscan...");
    window.open(`https://etherscan.io/tx/${hash}`, "_blank");
  };

  const canAccessProduct = (product: TokenGatedProduct) => {
    const tierOrder = ["bronze", "silver", "gold", "platinum"];
    return tierOrder.indexOf(currentTier) >= tierOrder.indexOf(product.requiredTier);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "bronze": return "from-amber-700 to-amber-900";
      case "silver": return "from-gray-400 to-gray-600";
      case "gold": return "from-yellow-400 to-yellow-600";
      case "platinum": return "from-red-400 to-pink-600";
      default: return "from-gray-500 to-gray-700";
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "bronze": return Award;
      case "silver": return Zap;
      case "gold": return Crown;
      case "platinum": return Sparkles;
      default: return Award;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">NFT Loyalty Rewards</h1>
          <p className="text-muted-foreground text-xl mb-8">
            Mint exclusive NFT badges and unlock token-gated products
          </p>

          {/* Wallet Connection */}
          {!walletConnected ? (
            <Button
              size="lg"
              onClick={handleConnectWallet}
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
            >
              <Wallet className="w-5 h-5 mr-2" />
              Connect Wallet
            </Button>
          ) : (
            <Card className="inline-flex items-center gap-4 p-4 bg-background text-foreground/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-foreground font-medium text-sm">Connected</p>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-400 text-xs">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
                    <button onClick={handleCopyAddress} className="text-gray-400 hover:text-foreground">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleDisconnectWallet}>
                Disconnect
              </Button>
            </Card>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 bg-gradient-to-br from-red-500/20 to-pink-500/20 border-red-500/30">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground text-sm">Loyalty Points</p>
              <TrendingUp className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-3xl font-bold text-foreground">{loyaltyPoints.toLocaleString()}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground text-sm">Current Tier</p>
              <Crown className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-3xl font-bold text-foreground capitalize">{currentTier}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground text-sm">NFTs Minted</p>
              <Award className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-foreground">{nftBadges.filter(b => b.minted).length}</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
            <div className="flex items-center justify-between mb-2">
              <p className="text-muted-foreground text-sm">Exclusive Access</p>
              <Unlock className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-foreground">{tokenGatedProducts.filter(p => canAccessProduct(p)).length}</p>
          </Card>
        </div>

        <Tabs defaultValue="badges" className="space-y-8">
          <TabsList className="bg-background text-foreground/5 border border-white/10">
            <TabsTrigger value="badges">
              <Award className="w-4 h-4 mr-2" />
              NFT Badges
            </TabsTrigger>
            <TabsTrigger value="products">
              <Lock className="w-4 h-4 mr-2" />
              Token-Gated Products
            </TabsTrigger>
            <TabsTrigger value="transactions">
              <ExternalLink className="w-4 h-4 mr-2" />
              Blockchain History
            </TabsTrigger>
          </TabsList>

          {/* NFT Badges */}
          <TabsContent value="badges">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {nftBadges.map((badge) => {
                const TierIcon = getTierIcon(badge.tier);
                return (
                  <Card key={badge.id} className="overflow-hidden bg-background text-foreground/5 border-white/10 hover:bg-background text-foreground/10 transition-all">
                    <div className={`h-48 bg-gradient-to-br ${getTierColor(badge.tier)} relative`}>
                      <img
                        src={badge.image}
                        alt={badge.name}
                        className="w-full h-full object-cover opacity-60"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <TierIcon className="w-24 h-24 text-white/80" />
                      </div>
                      {badge.minted && (
                        <Badge className="absolute top-3 right-3 bg-green-500/80 text-foreground">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Minted
                        </Badge>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="text-2xl font-bold text-foreground mb-2">{badge.name}</h3>
                      <p className="text-gray-400 text-sm mb-4">{badge.description}</p>

                      {badge.minted && badge.tokenId && (
                        <div className="mb-4 p-3 bg-background text-foreground/5 rounded-lg">
                          <p className="text-gray-400 text-xs mb-1">Token ID</p>
                          <p className="text-foreground text-sm font-mono">{badge.tokenId}</p>
                        </div>
                      )}

                      <div className="mb-4">
                        <p className="text-gray-400 text-xs mb-2">Benefits:</p>
                        <ul className="space-y-1">
                          {badge.benefits.map((benefit, index) => (
                            <li key={index} className="text-foreground text-sm flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-400" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {!badge.minted && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Required Points:</span>
                            <span className="text-foreground font-bold">{badge.requiredPoints.toLocaleString()}</span>
                          </div>
                          <Button
                            className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                            onClick={() => handleMintNFT(badge)}
                            disabled={loyaltyPoints < badge.requiredPoints}
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Mint NFT
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Token-Gated Products */}
          <TabsContent value="products">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {tokenGatedProducts.map((product) => {
                const hasAccess = canAccessProduct(product);
                return (
                  <Card key={product.id} className={`overflow-hidden ${hasAccess ? 'bg-background text-foreground/5 border-white/10' : 'bg-background text-foreground/5 border-red-500/30'}`}>
                    <div className="relative">
                      <img
                        src={product.image}
                        alt={product.name}
                        className={`w-full h-48 object-cover ${!hasAccess ? 'blur-sm' : ''}`}
                      />
                      {!hasAccess && (
                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center text-foreground">
                          <div className="text-center">
                            <Lock className="w-12 h-12 text-foreground mx-auto mb-2" />
                            <p className="text-foreground font-bold capitalize">
                              {product.requiredTier} Required
                            </p>
                          </div>
                        </div>
                      )}
                      {product.exclusive && (
                        <Badge className="absolute top-3 left-3 bg-red-500/80 text-foreground">
                          Exclusive
                        </Badge>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold text-foreground mb-2">{product.name}</h3>
                      <p className="text-3xl font-bold text-foreground mb-4">${product.price}</p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-400 text-sm">Stock:</span>
                        <span className="text-foreground font-medium">{product.stock} left</span>
                      </div>

                      <Button
                        className="w-full"
                        disabled={!hasAccess}
                        variant={hasAccess ? "default" : "outline"}
                      >
                        {hasAccess ? (
                          <>
                            <Gift className="w-4 h-4 mr-2" />
                            Purchase
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Locked
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Blockchain Transactions */}
          <TabsContent value="transactions">
            <Card className="p-6 bg-background text-foreground/5 border-white/10">
              <h2 className="text-2xl font-bold text-foreground mb-6">Transaction History</h2>
              <div className="space-y-4">
                {transactions.map((tx) => (
                  <Card key={tx.id} className="p-4 bg-background text-foreground/5 border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          tx.type === 'mint' ? 'bg-red-500/20' :
                          tx.type === 'reward' ? 'bg-green-500/20' :
                          'bg-blue-500/20'
                        }`}>
                          {tx.type === 'mint' && <Award className="w-5 h-5 text-red-400" />}
                          {tx.type === 'reward' && <Gift className="w-5 h-5 text-green-400" />}
                          {tx.type === 'transfer' && <ExternalLink className="w-5 h-5 text-blue-400" />}
                        </div>
                        <div>
                          <p className="text-foreground font-medium capitalize">{tx.type}</p>
                          {tx.amount && (
                            <p className="text-green-400 text-sm">+{tx.amount} points</p>
                          )}
                          <p className="text-gray-400 text-xs">{new Date(tx.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={
                          tx.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                          tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }>
                          {tx.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOnEtherscan(tx.hash)}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-background text-foreground/30 rounded font-mono text-xs text-gray-400 break-all">
                      {tx.hash}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
