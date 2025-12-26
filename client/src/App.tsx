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
import OrderTracking from "./pages/OrderTracking";
import Wishlist from "./pages/Wishlist";
import Compare from "./pages/Compare";
import Rewards from "./pages/Rewards";
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
      <Route path="/orders/:id" component={OrderTracking} />
      <Route path="/wishlist" component={Wishlist} />
      <Route path="/compare" component={Compare} />
      <Route path="/rewards" component={Rewards} />
      <Route path="/creator" component={Creator} />
      <Route path="/search" component={Search} />
      <Route path="/referrals" component={Referrals} />
      <Route path="/download" component={Download} />
      <Route path="/testimonials" component={Testimonials} />
      <Route path="/gift-cards" component={GiftCards} />
      <Route path="/subscription-boxes" component={SubscriptionBoxes} />
      <Route path="/faq" component={FAQ} />
      <Route path="/blog" component={Blog} />
      <Route path="/orders/:orderId/return" component={RequestReturn} />
      <Route path="/notifications" component={NotificationPreferences} />
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
