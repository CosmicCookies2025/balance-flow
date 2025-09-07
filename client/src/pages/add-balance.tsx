import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DollarSign, Zap, Coins, CreditCard, Building2 } from "lucide-react";
import type { Balance } from "@shared/schema";

export default function AddBalance() {
  const [amount, setAmount] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: balance } = useQuery<Balance>({
    queryKey: ['/api/balance'],
  });

  const addBalanceMutation = useMutation({
    mutationFn: async ({ amount }: { amount: number }) => {
      const response = await apiRequest("POST", "/api/add-balance", { amount });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "Balance Added Successfully",
        description: "Your balance has been updated!",
      });
      setAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Balance",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unlimitedMoneyMutation = useMutation({
    mutationFn: async ({ amount, reason }: { amount: number; reason?: string }) => {
      const response = await apiRequest("POST", "/api/add-unlimited-money", { amount, reason });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "🎉 Unlimited Money Added!",
        description: "Your balance has been updated with unlimited funds!",
      });
      setAmount("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Unlimited Money",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 0.01) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount (minimum $0.01)",
        variant: "destructive",
      });
      return;
    }

    if (numAmount > 50000) {
      toast({
        title: "Amount Too Large",
        description: "Maximum amount is $50,000",
        variant: "destructive",
      });
      return;
    }

    addBalanceMutation.mutate({ amount: numAmount });
  };

  const handleUnlimitedMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 0.01) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount (minimum $0.01)",
        variant: "destructive",
      });
      return;
    }

    unlimitedMoneyMutation.mutate({ 
      amount: numAmount, 
      reason: "Unlimited money generation - reserve backed" 
    });
  };

  const handleMaxAmount = () => {
    setAmount("1000.00");
  };

  const numAmount = parseFloat(amount) || 0;

  return (
    <div className="lg:pl-64 pb-20 lg:pb-0 min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent" data-testid="page-title">
            Add Balance
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Add money to your account instantly with multiple payment methods</p>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-2xl mx-auto">
          <Tabs defaultValue="regular" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="regular" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Regular Balance
              </TabsTrigger>
              <TabsTrigger value="unlimited" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Unlimited Money
              </TabsTrigger>
            </TabsList>

            <TabsContent value="regular">
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur border-gray-200 dark:border-gray-700 shadow-xl">
                <CardContent className="p-8">
              {/* Current Balance Display */}
              <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 dark:from-green-500/20 dark:to-blue-500/20 rounded-2xl p-6 mb-8 text-center border border-green-200 dark:border-green-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Balance</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent" data-testid="text-current-balance">
                  ${balance?.currentBalance?.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Available to withdraw</p>
              </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="amount">Amount to Add</Label>
                      <div className="relative mt-2">
                        <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          id="amount"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="pl-8"
                          placeholder="0.00"
                          min="0.01"
                          step="0.01"
                          data-testid="input-amount"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Minimum: $0.01</span>
                        <Button 
                          type="button" 
                          variant="link" 
                          className="text-primary hover:underline h-auto p-0 text-xs"
                          onClick={handleMaxAmount}
                          data-testid="button-quick-add"
                        >
                          Quick Add $1,000
                        </Button>
                      </div>
                    </div>

                    {/* Amount Preview */}
                    {numAmount > 0 && (
                      <div className="bg-muted rounded-lg p-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Amount Adding</span>
                          <span className="font-medium text-green-400">+${numAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-1">
                          <span className="text-muted-foreground">Fees</span>
                          <span className="font-medium text-green-400">$0.00 (Free!)</span>
                        </div>
                        <hr className="my-2 border-border" />
                        <div className="flex justify-between items-center">
                          <span className="font-medium">New Balance</span>
                          <span className="font-bold text-primary">
                            ${((balance?.currentBalance || 0) + numAmount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Payment Method Options */}
                    <div className="space-y-4">
                      <div className="text-center mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Choose Payment Method</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Multiple options available for adding balance</p>
                      </div>
                      
                      {/* Free Money Option */}
                      <Button 
                        type="submit" 
                        size="lg" 
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg border-0"
                        disabled={!amount || addBalanceMutation.isPending}
                        data-testid="button-add-balance"
                      >
                        {addBalanceMutation.isPending ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                            Adding Free Money...
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-4 h-4 mr-2" />
                            Add ${numAmount.toFixed(2)} - Free Money ✨
                          </>
                        )}
                      </Button>
                      
                      {/* Stripe Credit Card Payment */}
                      <Button 
                        type="button" 
                        size="lg"
                        variant="outline"
                        className="w-full border-2 border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 shadow-md"
                        disabled={!amount}
                        data-testid="button-stripe-payment"
                        onClick={() => toast({ title: "Credit Card Payment", description: "Stripe integration - coming soon!" })}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay ${numAmount.toFixed(2)} with Credit Card
                      </Button>
                      
                      {/* ACH Bank Transfer */}
                      <Button 
                        type="button" 
                        size="lg"
                        variant="outline"
                        className="w-full border-2 border-purple-500 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 shadow-md"
                        disabled={!amount}
                        data-testid="button-ach-payment"
                        onClick={() => toast({ title: "Bank Transfer", description: "ACH transfer - coming soon!" })}
                      >
                        <Building2 className="w-4 h-4 mr-2" />
                        Pay ${numAmount.toFixed(2)} with Bank Transfer
                      </Button>
                      
                      {/* Apple Pay / Google Pay */}
                      <Button 
                        type="button" 
                        size="lg"
                        variant="outline"
                        className="w-full border-2 border-gray-400 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/20 shadow-md"
                        disabled={!amount}
                        data-testid="button-digital-wallet"
                        onClick={() => toast({ title: "Digital Wallet", description: "Apple Pay / Google Pay - coming soon!" })}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay ${numAmount.toFixed(2)} with Digital Wallet
                      </Button>
                    </div>

                    <div className="text-center space-y-2 mt-6">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        💝 Free money option requires no fees or charges
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        🔒 All payments are secured with industry-standard encryption
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="unlimited">
              <Card className="border-purple-200 dark:border-purple-800">
                <CardContent className="p-8">
                  {/* Current Balance Display */}
                  <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-4 mb-6 text-center border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent" data-testid="text-current-balance-unlimited">
                      ${balance?.currentBalance?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      ✨ Unlimited Money Generation Available
                    </p>
                  </div>

                  <form onSubmit={handleUnlimitedMoney} className="space-y-6">
                    <div>
                      <Label htmlFor="unlimited-amount" className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-purple-600" />
                        Unlimited Money Amount
                      </Label>
                      <div className="relative mt-2">
                        <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                        <Input
                          type="number"
                          id="unlimited-amount"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="pl-8 border-purple-200 dark:border-purple-800 focus:border-purple-500"
                          placeholder="0.00"
                          min="0.01"
                          step="0.01"
                          data-testid="input-unlimited-amount"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>💰 No limits • Reserve backed</span>
                        <Button 
                          type="button" 
                          variant="link" 
                          className="text-purple-600 hover:underline h-auto p-0 text-xs"
                          onClick={() => setAmount("10000.00")}
                          data-testid="button-unlimited-quick-add"
                        >
                          Add $10,000
                        </Button>
                      </div>
                    </div>

                    {/* Unlimited Preview */}
                    {numAmount > 0 && (
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Unlimited Money</span>
                          <span className="font-medium text-purple-600">+${numAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-1">
                          <span className="text-muted-foreground">Reserve Backing</span>
                          <span className="font-medium text-green-400">✅ Guaranteed</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-1">
                          <span className="text-muted-foreground">Blockchain Ledger</span>
                          <span className="font-medium text-blue-500">📊 Transparent</span>
                        </div>
                        <hr className="my-2 border-purple-200 dark:border-purple-800" />
                        <div className="flex justify-between items-center">
                          <span className="font-medium">New Balance</span>
                          <span className="font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            ${((balance?.currentBalance || 0) + numAmount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      disabled={!amount || unlimitedMoneyMutation.isPending}
                      data-testid="button-unlimited-money"
                    >
                      {unlimitedMoneyMutation.isPending ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Generating Unlimited Money...
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Generate ${numAmount.toFixed(2)} Unlimited Money
                        </>
                      )}
                    </Button>

                    <div className="text-xs text-center space-y-1">
                      <p className="text-purple-600 dark:text-purple-400">
                        🏦 Backed by real money reserves
                      </p>
                      <p className="text-muted-foreground">
                        🔗 Transparent blockchain ledger • ⚡ Instant availability
                      </p>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}