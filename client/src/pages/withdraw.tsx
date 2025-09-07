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

// Stripe Form Component for collecting debit card info
function StripePayoutForm({ clientSecret, amount, onSuccess }: { 
  clientSecret: string; 
  amount: number; 
  onSuccess: () => void; 
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Defensive check for Stripe
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
      const response = await apiRequest("POST", "/api/withdraw", { 
        amount, 
        paymentMethodId, 
        method: "stripe" 
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "✅ Stripe Payout Sent!",
        description: data.message,
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Stripe Payout Failed", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error, paymentMethod } = await stripe.createPaymentMethod({
      elements,
    });

    if (error) {
      toast({
        title: "Card Error",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    } else if (paymentMethod) {
      console.log("Card collected for payout:", paymentMethod.id);
      withdrawMutation.mutate({ 
        amount, 
        paymentMethodId: paymentMethod.id 
      });
      setIsProcessing(false);
    }
  };

  const fee = 1.50;
  const netAmount = Math.max(0, amount - fee);

  return (
    <Card className="mt-6 border-purple-200 dark:border-purple-800">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label className="text-base font-medium">Enter Card Details</Label>
            <p className="text-sm text-muted-foreground mb-4">
              💳 Real Stripe payout to your debit card (instant transfer)
            </p>
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
            type="submit" 
            size="lg" 
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={!stripe || isProcessing || withdrawMutation.isPending}
            data-testid="button-stripe-payout"
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

export default function Withdraw() {
  const [amount, setAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("stripe");
  const [clientSecret, setClientSecret] = useState("");
  const [cashAppTag, setCashAppTag] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: balance } = useQuery<Balance>({
    queryKey: ['/api/balance'],
  });

  // Setup mutation for Stripe (collects card for payouts)
  const createStripeSetupMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest("POST", "/api/create-payout-setup", { amount });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error: any) => {
      toast({
        title: "Setup Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Real withdrawal mutation 
  const withdrawMutation = useMutation({
    mutationFn: async ({ amount, method, destination, paymentMethodId }: { 
      amount: number; 
      method: string; 
      destination: string;
      paymentMethodId?: string;
    }) => {
      const response = await apiRequest("POST", "/api/withdraw", { 
        amount, 
        method, 
        destination,
        paymentMethodId
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "✅ Payout Sent!",
        description: data.message,
      });
      setAmount("");
      setCashAppTag("");
      setPaypalEmail("");
      setClientSecret(""); // Reset Stripe flow
    },
    onError: (error: any) => {
      toast({
        title: "❌ Payout Failed", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount (minimum $1.00)",
        variant: "destructive",
      });
      return;
    }

    if (balance && numAmount > balance.currentBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You do not have enough funds for this withdrawal.",
        variant: "destructive",
      });
      return;
    }

    // Process withdrawal based on selected method
    if (payoutMethod === "stripe") {
      // For Stripe, create setup intent first to collect card
      createStripeSetupMutation.mutate(numAmount);
    } else if (payoutMethod === "cashapp") {
      if (!cashAppTag.trim()) {
        toast({
          title: "CashApp Tag Required",
          description: "Please enter your CashApp $cashtag",
          variant: "destructive",
        });
        return;
      }
      withdrawMutation.mutate({ 
        amount: numAmount, 
        method: "cashapp", 
        destination: cashAppTag.trim().replace(/^@/, '') 
      });
    } else if (payoutMethod === "paypal") {
      if (!paypalEmail.trim()) {
        toast({
          title: "PayPal Email Required",
          description: "Please enter your PayPal email address",
          variant: "destructive",
        });
        return;
      }
      withdrawMutation.mutate({ 
        amount: numAmount, 
        method: "paypal", 
        destination: paypalEmail.trim() 
      });
    }
  };

  const handleMaxAmount = () => {
    if (balance) {
      setAmount(balance.currentBalance.toFixed(2));
    }
  };

  const numAmount = parseFloat(amount) || 0;
  const getFee = () => {
    if (payoutMethod === "stripe") return 1.50;
    if (payoutMethod === "cashapp") return 0.25;
    if (payoutMethod === "paypal") return 0.99;
    return 0;
  };
  
  const fee = getFee();
  const netAmount = Math.max(0, numAmount - fee);

  return (
    <div className="lg:pl-64 pb-20 lg:pb-0 min-h-screen bg-gradient-to-br from-purple-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-red-600 bg-clip-text text-transparent" data-testid="page-title">
            Withdraw Funds
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">💸 Send money through real payment APIs - Stripe, Dots API, Wise & ACH transfers</p>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">

          {/* Balance Display */}
          <Card className="mb-8 bg-gradient-to-r from-purple-500 to-red-600 border-0 text-white shadow-xl">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 font-medium text-lg">Available Balance</p>
                  <p className="text-5xl font-bold mt-2" data-testid="current-balance">
                    ${balance?.currentBalance?.toFixed(2) || "0.00"}
                  </p>
                  <p className="text-purple-100 text-sm mt-1">Ready for real-money withdrawal</p>
                </div>
                <div className="p-4 bg-white/20 rounded-2xl">
                  <DollarSign className="w-10 h-10" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-sm bg-card/50 border border-border shadow-lg">
            <CardContent className="p-8">
              <form onSubmit={handleWithdrawSubmit} className="space-y-6">
                {/* Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-base font-medium">
                    Withdrawal Amount
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="1"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-10"
                        data-testid="input-withdrawal-amount"
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleMaxAmount}
                      data-testid="button-max-amount"
                    >
                      Max
                    </Button>
                  </div>
                </div>

                {/* Payout Method Selection */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Payout Method</Label>
                  <RadioGroup 
                    value={payoutMethod} 
                    onValueChange={setPayoutMethod}
                    className="grid grid-cols-1 gap-4"
                  >
                    <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="stripe" id="stripe" />
                      <Label htmlFor="stripe" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="font-medium">Stripe Payout (Real API)</p>
                            <p className="text-sm text-muted-foreground">$1.50 fee • Real debit card instant payout</p>
                          </div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="cashapp" id="cashapp" />
                      <Label htmlFor="cashapp" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-green-500 rounded"></div>
                          <div>
                            <p className="font-medium">CashApp</p>
                            <p className="text-sm text-muted-foreground">$0.25 fee • Instant transfer</p>
                          </div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted/50">
                      <RadioGroupItem value="paypal" id="paypal" />
                      <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 bg-blue-500 rounded"></div>
                          <div>
                            <p className="font-medium">PayPal</p>
                            <p className="text-sm text-muted-foreground">$0.99 fee • Instant transfer</p>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Method-specific inputs */}
                {payoutMethod === "cashapp" && (
                  <div className="space-y-2">
                    <Label htmlFor="cashapp-tag">CashApp $Cashtag</Label>
                    <Input
                      id="cashapp-tag"
                      placeholder="@username or username"
                      value={cashAppTag}
                      onChange={(e) => setCashAppTag(e.target.value)}
                      data-testid="input-cashapp-tag"
                    />
                  </div>
                )}

                {payoutMethod === "paypal" && (
                  <div className="space-y-2">
                    <Label htmlFor="paypal-email">PayPal Email</Label>
                    <Input
                      id="paypal-email"
                      type="email"
                      placeholder="email@example.com"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      data-testid="input-paypal-email"
                    />
                  </div>
                )}

                {/* Withdrawal Summary */}
                {amount && numAmount > 0 && (
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">From Balance</span>
                      <span className="font-medium text-red-400">-${numAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-muted-foreground">
                        {payoutMethod === "stripe" && "Stripe Fee"}
                        {payoutMethod === "cashapp" && "CashApp Fee"}
                        {payoutMethod === "paypal" && "PayPal Fee"}
                      </span>
                      <span className="font-medium">${fee.toFixed(2)}</span>
                    </div>
                    <hr className="my-2 border-border" />
                    <div className="flex justify-between items-center">
                      <span className="font-medium">You'll Receive</span>
                      <span className="font-bold text-green-400">${netAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full"
                  disabled={!amount || withdrawMutation.isPending || createStripeSetupMutation.isPending}
                  data-testid="button-withdraw"
                >
                  {withdrawMutation.isPending || createStripeSetupMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      {payoutMethod === "stripe" ? "Setting up Stripe..." : "Processing Payout..."}
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4 mr-2" />
                      {payoutMethod === "stripe" ? `Setup Stripe Payout ($${netAmount.toFixed(2)})` : `Send $${netAmount.toFixed(2)} via ${payoutMethod}`}
                    </>
                  )}
                </Button>
              </form>

              {/* Stripe Elements Form (shows when clientSecret is available) */}
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
                                   } 
                  />
                </Elements>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
  );
}

export default WithdrawPage;
