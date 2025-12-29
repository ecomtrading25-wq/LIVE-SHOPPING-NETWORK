import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import {
  CreditCard,
  Check,
  X,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * Account Subscription Management Page
 * Allows users to manage their subscription, billing, and payment methods
 */

export default function AccountSubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const { data: subscription, refetch: refetchSubscription } =
    trpc.subscriptions.getMySubscription.useQuery();

  const { data: plans } = trpc.subscriptions.getPlans.useQuery();

  const { data: billingHistory } =
    trpc.subscriptions.getBillingHistory.useQuery({ limit: 12 });

  const createCheckoutMutation =
    trpc.subscriptions.createCheckout.useMutation({
      onSuccess: (data) => {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    });

  const cancelMutation = trpc.subscriptions.cancel.useMutation({
    onSuccess: () => {
      toast({
        title: "Subscription Canceled",
        description:
          "Your subscription will remain active until the end of the billing period.",
      });
      refetchSubscription();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reactivateMutation = trpc.subscriptions.reactivate.useMutation({
    onSuccess: () => {
      toast({
        title: "Subscription Reactivated",
        description: "Your subscription has been reactivated successfully.",
      });
      refetchSubscription();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const changePlanMutation = trpc.subscriptions.changePlan.useMutation({
    onSuccess: () => {
      toast({
        title: "Plan Changed",
        description: "Your subscription plan has been updated successfully.",
      });
      refetchSubscription();
      setSelectedPlanId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createPortalMutation = trpc.subscriptions.createPortalSession.useMutation({
    onSuccess: (data) => {
      // Redirect to Stripe customer portal
      window.location.href = data.url;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubscribe = (planId: string) => {
    createCheckoutMutation.mutate({
      planId,
      successUrl: `${window.location.origin}/account/subscription?success=true`,
      cancelUrl: `${window.location.origin}/account/subscription?canceled=true`,
    });
  };

  const handleCancel = () => {
    if (!subscription) return;
    if (
      confirm(
        "Are you sure you want to cancel your subscription? You'll retain access until the end of your billing period."
      )
    ) {
      cancelMutation.mutate({
        subscriptionId: subscription.id,
        cancelAtPeriodEnd: true,
      });
    }
  };

  const handleReactivate = () => {
    if (!subscription) return;
    reactivateMutation.mutate({
      subscriptionId: subscription.id,
    });
  };

  const handleChangePlan = (newPlanId: string) => {
    if (!subscription) return;
    if (
      confirm(
        "Are you sure you want to change your plan? You'll be charged a prorated amount."
      )
    ) {
      changePlanMutation.mutate({
        subscriptionId: subscription.id,
        newPlanId,
      });
    }
  };

  const handleManagePaymentMethods = () => {
    createPortalMutation.mutate({
      returnUrl: `${window.location.origin}/account/subscription`,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      trialing: "bg-blue-100 text-blue-800",
      past_due: "bg-yellow-100 text-yellow-800",
      canceled: "bg-red-100 text-red-800",
      incomplete: "bg-gray-100 text-gray-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 bg-background text-foreground/5 border-white/10 text-center">
          <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Sign In Required
          </h2>
          <p className="text-muted-foreground mb-6">
            Please sign in to manage your subscription
          </p>
          <Link href="/">
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              Go to Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-background/30 border-b border-white/10 backdrop-blur-sm sticky top-0 z-10 text-foreground">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/account">
              <Button variant="ghost" className="text-foreground">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Account
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">
              Subscription Management
            </h1>
            <div className="w-32" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Current Subscription */}
        {subscription && (
          <Card className="p-6 bg-background text-foreground/5 border-white/10 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-foreground">
                Current Subscription
              </h2>
              <Badge className={getStatusBadge(subscription.status)}>
                {subscription.status}
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-400 text-sm mb-1">Plan</p>
                <p className="text-foreground text-lg font-semibold">
                  {subscription.planName}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">Amount</p>
                <p className="text-foreground text-lg font-semibold">
                  {subscription.currency} ${subscription.amount} /{" "}
                  {subscription.interval}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">Current Period</p>
                <p className="text-foreground">
                  {new Date(subscription.currentPeriodStart).toLocaleDateString()}{" "}
                  - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">Next Billing Date</p>
                <p className="text-foreground">
                  {subscription.cancelAtPeriodEnd ? (
                    <span className="text-yellow-400">
                      Cancels on{" "}
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </span>
                  ) : (
                    new Date(subscription.currentPeriodEnd).toLocaleDateString()
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              {subscription.cancelAtPeriodEnd ? (
                <Button
                  onClick={handleReactivate}
                  disabled={reactivateMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Reactivate Subscription
                </Button>
              ) : (
                <Button
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                  variant="destructive"
                >
                  Cancel Subscription
                </Button>
              )}

              <Button
                onClick={handleManagePaymentMethods}
                disabled={createPortalMutation.isPending}
                variant="outline"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Manage Payment Methods
              </Button>
            </div>

            {subscription.cancelAtPeriodEnd && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-yellow-200 text-sm">
                  Your subscription will be canceled at the end of the current
                  billing period. You'll retain access until{" "}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}.
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Available Plans */}
        {(!subscription || selectedPlanId) && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {subscription ? "Change Plan" : "Choose a Plan"}
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {plans?.map((plan) => (
                <Card
                  key={plan.id}
                  className={`p-6 bg-background text-foreground/5 border-white/10 hover:border-purple-500/50 transition-all ${
                    subscription?.planId === plan.id
                      ? "border-purple-500 ring-2 ring-purple-500/20"
                      : ""
                  }`}
                >
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {plan.description}
                  </p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-foreground">
                      ${plan.amount}
                    </span>
                    <span className="text-gray-400">
                      {" "}
                      / {plan.interval}
                    </span>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {subscription ? (
                    subscription.planId === plan.id ? (
                      <Badge className="w-full justify-center bg-purple-600 text-foreground">
                        Current Plan
                      </Badge>
                    ) : (
                      <Button
                        onClick={() => handleChangePlan(plan.id)}
                        disabled={changePlanMutation.isPending}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        Change to This Plan
                      </Button>
                    )
                  ) : (
                    <Button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={createCheckoutMutation.isPending}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      Subscribe Now
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Billing History */}
        {billingHistory && billingHistory.length > 0 && (
          <Card className="p-6 bg-background text-foreground/5 border-white/10">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Billing History
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-gray-400 font-medium pb-3">
                      Date
                    </th>
                    <th className="text-left text-gray-400 font-medium pb-3">
                      Amount
                    </th>
                    <th className="text-left text-gray-400 font-medium pb-3">
                      Status
                    </th>
                    <th className="text-right text-gray-400 font-medium pb-3">
                      Invoice
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {billingHistory.map((item) => (
                    <tr key={item.id} className="border-b border-white/5">
                      <td className="py-4 text-foreground">
                        {new Date(item.invoiceDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-foreground">
                        {item.currency} ${item.amount}
                      </td>
                      <td className="py-4">
                        <Badge className={getStatusBadge(item.status)}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-4 text-right">
                        {item.hostedInvoiceUrl && (
                          <a
                            href={item.hostedInvoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 inline-flex items-center gap-1"
                          >
                            View
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
