import { useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { stripePromise } from "@/lib/stripe";
import { apiRequest } from "@/lib/queryClient";
import { DollarSign, ArrowRight, CreditCard } from "lucide-react";
import type { Balance } from "@shared/schema";

function StripePayoutForm({ clientSecret, amount, onSuccess }: { 
  clientSecret: string; 
  amount: number; 
  onSuccess: () => void; 
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!stripePromise) {
    return (
      <Card className="mt-6 border-red-200 dark:border-red-800">
        <CardContent className="p-6">
          <div className="text-center text-red-600 dark:text-red-400">
            <p className="font-medium">Stripe Configuration Error</p>
            <p className="text-sm mt-2">Please check Stripe API keys configuration</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const withdrawMutation = useMutation({
    mutationFn: async ({ amount, paymentMethodId }: { amount: number; paymentMethodId: string }) => {
      const response = await apiRequest("POST", "/api/withdraw", { amount, paymentMethodId, method: "stripe" });
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "✅ Stripe Payout Sent!", description: data.message });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ title: "❌ Stripe Payout Failed", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    const { error, paymentMethod } = await stripe.createPaymentMethod({ elements });

    if (error) {
      toast({ title: "Card Error", description: error.message, variant: "destructive" });
      setIsProcessing(false);
    } else if (paymentMethod) {
      withdrawMutation.mutate({ amount, paymentMethodId: paymentMethod.id });
      setIsProcessing(false);
    }
  };

  const fee = 1.5;
  const netAmount = Math.max(0, amount - fee);

  return (
    <Card className="mt-6 border-purple-200 dark:border-purple-800">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="text-base font-medium">Enter Card Details</Label>
            <p className="text-sm text-muted-foreground mb-4">💳 Real Stripe payout to your debit card (instant transfer)</p>
            <div className="p-4 border border-border rounded-lg">
              <PaymentElement />
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <div className="flex justify-between items-center text-sm">
              <span className="text-purple-700 dark:text-purple-300">From Balance</span>
              <span className="font-medium text-red-400">-${amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span className="text-purple-700 dark:text-purple-300">Stripe Fee</span>
              <span className="font-medium">$1.50</span>
            </div>
            <hr className="my-2 border-purple-200 dark:border-purple-800" />
            <div className="flex justify-between items-center">
              <span className="font-medium text-purple-700 dark:text-purple-300">You'll Receive</span>
              <span className="font-bold text-green-600 dark:text-green-400">${netAmount.toFixed(2)}</span>
            </div>
          </div>

          <Button 
            type="submit" size="lg" className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={!stripe || isProcessing || withdrawMutation.isPending}
          >
            {isProcessing || withdrawMutation.isPending ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Processing Real Stripe Payout...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Send ${netAmount.toFixed(2)} via Stripe Payout
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function WithdrawPage() {
  const [amount, setAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("stripe");
  const [clientSecret, setClientSecret] = useState("");
  const [cashAppTag, setCashAppTag] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: balance } = useQuery<Balance>({ queryKey: ['/api/balance'] });

  const createStripeSetupMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest("POST", "/api/create-payout-setup", { amount });
      return response.json();
    },
    onSuccess: (data) => setClientSecret(data.clientSecret),
    onError: (error: any) => toast({ title: "Setup Error", description: error.message, variant: "destructive" }),
  });

  const withdrawMutation = useMutation({
    mutationFn: async ({ amount, method, destination, paymentMethodId }: { amount: number; method: string; destination: string; paymentMethodId?: string }) => {
      const response = await apiRequest("POST", "/api/withdraw", { amount, method, destination, paymentMethodId });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({ title: "✅ Payout Sent!", description: data.message });
      setAmount(""); setCashAppTag(""); setPaypalEmail(""); setClientSecret("");
    },
    onError: (error: any) => toast({ title: "❌ Payout Failed", description: error.message, variant: "destructive" }),
  });

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 1) return toast({ title: "Invalid Amount", description: "Minimum $1.00", variant: "destructive" });
    if (balance && numAmount > balance.currentBalance) return toast({ title: "Insufficient Balance", description: "Not enough funds", variant: "destructive" });

    if (payoutMethod === "stripe") {
      createStripeSetupMutation.mutate(numAmount);
    } else if (payoutMethod === "cashapp") {
      if (!cashAppTag.trim()) return toast({ title: "CashApp Tag Required", description: "Enter your $cashtag", variant: "destructive" });
      withdrawMutation.mutate({ amount: numAmount, method: "cashapp", destination: cashAppTag.trim().replace(/^@/, "") });
    } else if (payoutMethod === "paypal") {
      if (!paypalEmail.trim()) return toast({ title: "PayPal Email Required", description: "Enter your PayPal email", variant: "destructive" });
      withdrawMutation.mutate({ amount: numAmount, method: "paypal", destination: paypalEmail.trim() });
    }
  };

  const handleMaxAmount = () => balance && setAmount(balance.currentBalance.toFixed(2));
  const numAmount = parseFloat(amount) || 0;
  const fee = payoutMethod === "stripe" ? 1.5 : payoutMethod === "cashapp" ? 0.25 : payoutMethod === "paypal" ? 0.99 : 0;
  const netAmount = Math.max(0, numAmount - fee);

  return (
    <div className="lg:pl-64 pb-20 lg:pb-0 min-h-screen bg-gradient-to-br from-purple-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      {/* header, balance, form stay identical */}
      {/* ... */}
      {clientSecret && payoutMethod === "stripe" && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <StripePayoutForm 
            clientSecret={clientSecret} 
            amount={parseFloat(amount)} 
            onSuccess={() => {
              setAmount("");
              setClientSecret("");
              queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
              queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
            }}
          />
        </Elements>
      )}
    </div>
  );
}
