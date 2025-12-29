import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import OpsConsole from "./pages/OpsConsole";
import Products from "./pages/Products";
import ProductsEnhanced from "./pages/ProductsEnhanced";
import CartEnhanced from "./pages/CartEnhanced";
import CheckoutEnhanced from "./pages/CheckoutEnhanced";
import OrderConfirmationEnhanced from "./pages/OrderConfirmationEnhanced";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import Picker from "./pages/warehouse/Picker";
import Packer from "./pages/warehouse/Packer";
import Account from "./pages/Account";
import AccountAddresses from "./pages/AccountAddresses";
import AccountSubscription from "./pages/AccountSubscription";
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
import AIShoppingChatbot from "./components/AIShoppingChatbot";
import VoiceShoppingAssistant from "./components/VoiceShoppingAssistant";
import TikTokArbitrageDashboard from "./pages/TikTokArbitrageDashboard";
import LiveShowManagement from "./pages/LiveShowManagement";
import AutomationWorkflows from "./pages/AutomationWorkflows";
import ProfitAnalyticsDashboard from "./pages/ProfitAnalyticsDashboard";
import SavedSearches from "./pages/SavedSearches";
import Subscriptions from "./pages/Subscriptions";
import BackInStockAlerts from "./pages/BackInStockAlerts";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import InventoryManagement from "./pages/InventoryManagement";
import EmailCampaigns from "./pages/EmailCampaigns";
import SupplierPortal from "./pages/SupplierPortal";
import OperationsCenter from "./pages/OperationsCenter";
import LiveSessionManagement from "./pages/LiveSessionManagement";
import ReferralDashboard from "./pages/ReferralDashboard";
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
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import LiveShows from "./pages/LiveShows";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import OrderHistory from "./pages/OrderHistory";
import Categories from "./pages/Categories";
import SearchResults from "./pages/SearchResults";
import AdminDashboard from "@/pages/Admin";
import DemandForecastDashboard from "@/pages/admin/DemandForecastDashboard";
import ChurnRiskDashboard from "@/pages/admin/ChurnRiskDashboard";
import PricingOptimizationDashboard from "@/pages/admin/PricingOptimizationDashboard";
import SentimentAnalysisDashboard from "@/pages/admin/SentimentAnalysisDashboard";
import RevenueForecastDashboard from "@/pages/admin/RevenueForecastDashboard";
import RFMSegmentationDashboard from "@/pages/admin/RFMSegmentationDashboard";
import LiveShowViewer from "@/pages/LiveShowViewer";
import LiveShowPage from "@/pages/LiveShowPage";
import HostDashboard from "@/pages/HostDashboard";
import BrowseShows from '@/pages/BrowseShows';
import Wallet from '@/pages/Wallet';
import ModerationDashboard from '@/pages/ModerationDashboard';
import AffiliateDashboard from '@/pages/AffiliateDashboard';
import LiveStudio from '@/pages/LiveStudio';
import UserProfile from '@/pages/UserProfile';
import MarketingDashboard from '@/pages/MarketingDashboard';
import ExecutiveDashboard from '@/pages/ExecutiveDashboard';
import FraudConsole from '@/pages/FraudConsole';
import PurchasingDashboard from '@/pages/PurchasingDashboard';
import CreatorDashboard from '@/pages/CreatorDashboard';
import LiveShowsBrowse from '@/pages/LiveShowsBrowse';
import CreatorDashboardEnhanced from '@/pages/CreatorDashboardEnhanced';
import LSNHomepage from '@/pages/LSNHomepage';
import LSNLiveShowViewer from '@/pages/LSNLiveShowViewer';
import LSNBrowseShows from '@/pages/LSNBrowseShows';
import LSNOperationsDashboard from '@/pages/LSNOperationsDashboard';
import OperationsConsole from '@/pages/admin/OperationsConsole';

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <>
      <PWAInstallPrompt />
      {/* Consolidated AI Assistant - combines customer service, shopping help, and voice */}
      <AIShoppingChatbot />
      <MobileDeepLink />
      <Header />
      <Switch>
        <Route path="/" component={LSNHomepage} />
        <Route path="/home-old" component={Home} />
      <Route path="/products-enhanced" component={ProductsEnhanced} />
      <Route path="/cart-enhanced" component={CartEnhanced} />
      <Route path="/checkout-enhanced" component={CheckoutEnhanced} />
      <Route path="/order-confirmation-enhanced/:orderId" component={OrderConfirmationEnhanced} />
      <Route path="/products" component={Products} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout/success" component={CheckoutSuccess} />
      <Route path="/warehouse/picker" component={Picker} />
      <Route path="/warehouse/packer" component={Packer} />
      <Route path="/account" component={Account} />
      <Route path="/account/addresses" component={AccountAddresses} />
      <Route path="/account/subscription" component={AccountSubscription} />
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
      <Route path="/account/notifications" component={NotificationPreferences} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order-confirmation" component={OrderConfirmation} />
        <Route path="/live" component={LSNBrowseShows} />
        <Route path="/live-old" component={LiveShowsBrowse} />
        <Route path="/live/:showId" component={LSNLiveShowViewer} />
        <Route path="/live-old/:showId" component={LiveShowViewer} />
      <Route path="/show/:id" component={LiveShowPage} />
      <Route path="/host/dashboard" component={HostDashboard} />
      <Route path="/browse-shows" component={BrowseShows} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/moderation" component={ModerationDashboard} />
      <Route path="/affiliate/dashboard" component={AffiliateDashboard} />
      <Route path="/live/studio" component={LiveStudio} />
      <Route path="/user/:userId" component={UserProfile} />
      <Route path="/marketing-dashboard" component={MarketingDashboard} />
      <Route path="/executive-dashboard" component={ExecutiveDashboard} />
      <Route path="/fraud-console" component={FraudConsole} />
      <Route path="/purchasing-dashboard" component={PurchasingDashboard} />
      <Route path="/creator-dashboard" component={CreatorDashboard} />
      <Route path="/creator/dashboard" component={CreatorDashboardEnhanced} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/profile" component={Profile} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password/:token" component={ResetPassword} />
      <Route path="/orders" component={OrderHistory} />
      <Route path="/categories" component={Categories} />
      <Route path="/search" component={SearchResults} />
      <Route path="/saved-searches" component={SavedSearches} />
      <Route path="/subscriptions" component={Subscriptions} />
      <Route path="/alerts" component={BackInStockAlerts} />
      <Route path="/analytics" component={AnalyticsDashboard} />
      <Route path="/inventory" component={InventoryManagement} />
      <Route path="/email-campaigns" component={EmailCampaigns} />
      <Route path="/supplier-portal" component={SupplierPortal} />
        <Route path="/operations-center" component={LSNOperationsDashboard} />
        <Route path="/operations-center-old" component={OperationsCenter} />
      <Route path="/live-sessions" component={LiveSessionManagement} />
      <Route path="/referral-dashboard" component={ReferralDashboard} />
      <Route path="/admin/demand-forecast" component={DemandForecastDashboard} />
      <Route path="/admin/churn-risk" component={ChurnRiskDashboard} />
      <Route path="/admin/pricing-optimization" component={PricingOptimizationDashboard} />
      <Route path="/admin/sentiment-analysis" component={SentimentAnalysisDashboard} />
      <Route path="/admin/revenue-forecast" component={RevenueForecastDashboard} />
      <Route path="/admin/rfm-segmentation" component={RFMSegmentationDashboard} />
      <Route path="/admin/operations-console" component={OperationsConsole} />
      <Route path="/tiktok-arbitrage" component={TikTokArbitrageDashboard} />
      <Route path="/live-show-management" component={LiveShowManagement} />
      <Route path="/automation-workflows" component={AutomationWorkflows} />
      <Route path="/profit-analytics" component={ProfitAnalyticsDashboard} />
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
