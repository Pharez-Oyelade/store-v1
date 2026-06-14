import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, CreditCard, Loader2, Calendar } from "lucide-react";
import { useInitializeUpgrade, useVerifyUpgrade, useCurrentSubscription } from "@/hooks/useSubscription";
import { usePaystackInline } from "@/hooks/usePaystackInline";
import { SubscriptionPlan, SubscriptionStatus } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const PLANS = [
  { id: "free", name: "Free", price: "₦0/mo", features: ["5 Products", "5 Orders/mo", "Standard Theme"] },
  { id: "stitch", name: "The Stitch", price: "₦4,900/mo", features: ["15 Products", "10 Orders/mo", "Basic Customer List"] },
  { id: "drape", name: "The Drape", price: "₦14,900/mo", features: ["200 Products", "500 Orders/mo", "3 Staff Accounts", "Public Storefront"] },
  { id: "atelier", name: "The Atelier", price: "₦34,900/mo", features: ["Unlimited Products", "Unlimited Orders", "10 Staff Accounts", "Custom WhatsApp Templates"] },
];

export function BillingPanel() {
  const vendor = useAuthStore((state) => state.vendor);
  const setVendor = useAuthStore((state) => state.setVendor);
  const currentPlan = vendor?.subscriptionPlan || "free";
  const queryClient = useQueryClient();
  
  const { data: subscription } = useCurrentSubscription();
  const { initializePayment, isLoaded } = usePaystackInline();
  const initUpgradeMutation = useInitializeUpgrade();
  const verifyUpgradeMutation = useVerifyUpgrade();
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    if (planId === currentPlan) return;
    
    setSelectedPlan(planId);
    try {
      const data = (await initUpgradeMutation.mutateAsync({ plan: planId })) as any;
      
      if (data.isFree) {
        toast.success(`Successfully changed to ${PLANS.find(p => p.id === planId)?.name} plan`);
        queryClient.invalidateQueries({ queryKey: ["subscription", "current"] });
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        if (vendor) {
          setVendor({ ...vendor, subscriptionPlan: planId as SubscriptionPlan, subscriptionStatus: SubscriptionStatus.Active });
        }
        setSelectedPlan(null);
        return;
      }

      initializePayment({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder",
        email: vendor?.email || `vendor-${vendor?._id}@sabistore.com`,
        amount: parseInt(PLANS.find(p => p.id === planId)!.price.replace(/\D/g, "") + "00", 10),
        metadata: {
          vendorId: vendor?._id,
          plan: planId,
        },
        onSuccess: (response: any) => {
          verifyUpgradeMutation.mutate({ reference: response.reference });
        },
        onClose: () => {
          toast.error("Payment window closed");
          setSelectedPlan(null);
        }
      });
    } catch (error) {
      console.error(error);
      setSelectedPlan(null);
    }
  };

  const isProcessing = initUpgradeMutation.isPending || verifyUpgradeMutation.isPending;

  return (
    <div className="space-y-6 mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <CreditCard className="h-6 w-6 text-brand-purple" />
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Subscription & Billing</h2>
        </div>
        
        {(subscription as any)?.currentPeriodEnd && currentPlan !== "free" && (
          <div className="flex items-center space-x-2 bg-brand-50 dark:bg-brand-900/10 text-brand-700 dark:text-brand-300 px-4 py-2 rounded-lg text-sm font-medium border border-brand-100 dark:border-brand-800/50">
            <Calendar className="w-4 h-4" />
            <span>Next billing date: {new Date((subscription as any).currentPeriodEnd).toLocaleDateString()}</span>
          </div>
        )}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const currentPlanIndex = PLANS.findIndex(p => p.id === currentPlan);
          const thisPlanIndex = PLANS.findIndex(p => p.id === plan.id);
          const isDowngrade = thisPlanIndex < currentPlanIndex;
          
          return (
            <div 
              key={plan.id}
              className={`relative flex flex-col p-6 rounded-2xl border ${isCurrent ? 'border-brand-purple bg-brand-purple/5 ring-1 ring-brand-purple' : 'border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800'}`}
            >
              {isCurrent && (
                <div className="absolute -top-3 right-6">
                  <span className="bg-brand-purple text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm">
                    Current Plan
                  </span>
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <div className="mt-2 flex items-baseline text-2xl font-bold text-brand-purple">
                  {plan.price}
                </div>
              </div>
              
              <ul className="mb-6 space-y-3 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button
                variant={isCurrent ? "outline" : isDowngrade ? "ghost" : "default"}
                className={`w-full ${isDowngrade ? 'border border-gray-200 dark:border-gray-700' : ''}`}
                disabled={isCurrent || !isLoaded || (isProcessing && selectedPlan === plan.id)}
                onClick={() => handleUpgrade(plan.id)}
              >
                {isProcessing && selectedPlan === plan.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isCurrent ? "Active Plan" : isDowngrade ? "Downgrade" : "Upgrade"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
