import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Picker from "./pages/warehouse/Picker";
import Packer from "./pages/warehouse/Packer";
import Account from "./pages/Account";
import AccountAddresses from "./pages/AccountAddresses";
import OrderTracking from "./pages/OrderTracking";
import Wishlist from "./pages/Wishlist";
import Compare from "./pages/Compare";
import Rewards from "./pages/Rewards";
import Loyalty from "./pages/Loyalty";
import ShoppingAssistant from "./pages/ShoppingAssistant";
import SubscriptionManage from "./pages/SubscriptionManage";
import InfluencerAnalytics from "./pages/InfluencerAnalytics";
import VoiceShop from "./pages/VoiceShop";
import ARPreview from "./pages/ARPreview";
import SocialShop from "./pages/SocialShop";
import LoyaltyNFT from "./pages/LoyaltyNFT";
import Gamification from "./pages/Gamification";
import Creator from "./pages/Creator";
import Search from "./pages/Search";
import Referrals from "./pages/Referrals";
import Download from "./pages/Download";
import Testimonials from "./pages/Testimonials";
import GiftCards from "./pages/GiftCards";
import SubscriptionBoxes from "./pages/SubscriptionBoxes";
import FAQ from "./pages/FAQ";
import Blog from "./pages/Blog";
import RequestReturn from "./pages/RequestReturn";
import NotificationPreferences from "./pages/NotificationPreferences";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import CustomerServiceChatbot from "./components/CustomerServiceChatbot";
import MobileDeepLink from "./components/MobileDeepLink";
import InfluencerPage from "./pages/Influencer";
import AffiliateApply from "./pages/AffiliateApply";
import SupplierApply from "./pages/SupplierApply";
import SupplierDashboard from "./pages/SupplierDashboard";
import WishlistShare from "./pages/WishlistShare";
import OrderTrackMap from "./pages/OrderTrackMap";
import FlashSales from "./pages/FlashSales";
import ProductReviews from "./pages/ProductReviews";
import SupportTickets from "./pages/SupportTickets";
import WishlistAlerts from "./pages/WishlistAlerts";
import ProductCompare from "./pages/ProductCompare";
import LoyaltyEnhanced from "./pages/LoyaltyEnhanced";
import OrderAnalytics from "./pages/OrderAnalytics";
import GiftRegistry from "./pages/GiftRegistry";
import AdminDashboard from "@/pages/Admin";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <>
      <PWAInstallPrompt />
      <CustomerServiceChatbot />
      <MobileDeepLink />
      <Header />
      <Switch>
        <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout/success" component={CheckoutSuccess} />
      <Route path="/warehouse/picker" component={Picker} />
      <Route path="/warehouse/packer" component={Packer} />
      <Route path="/account" component={Account} />
      <Route path="/account/addresses" component={AccountAddresses} />
      <Route path="/orders/:id" component={OrderTracking} />
      <Route path="/wishlist" component={Wishlist} />
      <Route path="/compare" component={Compare} />
      <Route path="/rewards" component={Rewards} />
      <Route path="/loyalty" component={Loyalty} />
      <Route path="/assistant" component={ShoppingAssistant} />
      <Route path="/subscription/manage" component={SubscriptionManage} />
      <Route path="/influencer/analytics" component={InfluencerAnalytics} />
      <Route path="/voice-shop" component={VoiceShop} />
      <Route path="/ar-preview" component={ARPreview} />
      <Route path="/social-shop" component={SocialShop} />
      <Route path="/loyalty/nft" component={LoyaltyNFT} />
      <Route path="/gamification" component={Gamification} />
      <Route path="/creator" component={Creator} />
      <Route path="/search" component={Search} />
      <Route path="/referrals" component={Referrals} />
      <Route path="/download" component={Download} />
      <Route path="/influencer" component={InfluencerPage} />
      <Route path="/testimonials" component={Testimonials} />
      <Route path="/gift-cards" component={GiftCards} />
      <Route path="/subscription-boxes" component={SubscriptionBoxes} />
      <Route path="/faq" component={FAQ} />
      <Route path="/blog" component={Blog} />
      <Route path="/orders/:orderId/return" component={RequestReturn} />
      <Route path="/notifications" component={NotificationPreferences} />
      <Route path="/affiliates/apply" component={AffiliateApply} />
      <Route path="/dropshipping/suppliers" component={SupplierApply} />
      <Route path="/supplier/dashboard" component={SupplierDashboard} />
      <Route path="/wishlist/share" component={WishlistShare} />
      <Route path="/orders/:orderId/track-map" component={OrderTrackMap} />
      <Route path="/flash-sales" component={FlashSales} />
      <Route path="/products/:productId/reviews" component={ProductReviews} />
      <Route path="/support/tickets" component={SupportTickets} />
      <Route path="/wishlist/alerts" component={WishlistAlerts} />
      <Route path="/compare" component={ProductCompare} />
      <Route path="/loyalty/enhanced" component={LoyaltyEnhanced} />
      <Route path="/account/analytics" component={OrderAnalytics} />
      <Route path="/registry" component={GiftRegistry} />
      <Route path="/admin/*" component={AdminDashboard} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
      </Switch>
      <Footer />
    </>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
