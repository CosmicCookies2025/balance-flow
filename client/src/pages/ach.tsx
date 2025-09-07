import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, ArrowRight, DollarSign, Building2, CreditCard } from "lucide-react";
import type { Balance } from "@shared/schema";

export default function ACH() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Deposit form state
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [routingNumber, setRoutingNumber] = useState<string>("");
  const [accountType, setAccountType] = useState<string>("checking");
  
  // Withdraw form state
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawBankName, setWithdrawBankName] = useState<string>("");
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState<string>("");
  const [withdrawRoutingNumber, setWithdrawRoutingNumber] = useState<string>("");
  const [withdrawAccountType, setWithdrawAccountType] = useState<string>("checking");

  // Get balance
  const { data: balance } = useQuery<Balance>({
    queryKey: ['/api/balance'],
  });

  // ACH Deposit Mutation
  const depositMutation = useMutation({
    mutationFn: async (data: {
      amount: number;
      bankName: string;
      accountNumber: string;
      routingNumber: string;
      accountType: string;
    }) => {
      const response = await apiRequest("POST", "/api/ach-deposit", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "✅ ACH Deposit Successful!",
        description: data.message,
      });
      // Reset form
      setDepositAmount("");
      setBankName("");
      setAccountNumber("");
      setRoutingNumber("");
      setAccountType("checking");
    },
    onError: (error: any) => {
      toast({
        title: "❌ ACH Deposit Failed", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // ACH Withdrawal Mutation
  const withdrawMutation = useMutation({
    mutationFn: async (data: {
      amount: number;
      bankName: string;
      accountNumber: string;
      routingNumber: string;
      accountType: string;
    }) => {
      const response = await apiRequest("POST", "/api/ach-withdraw", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      toast({
        title: "✅ ACH Withdrawal Successful!",
        description: data.message,
      });
      // Reset form
      setWithdrawAmount("");
      setWithdrawBankName("");
      setWithdrawAccountNumber("");
      setWithdrawRoutingNumber("");
      setWithdrawAccountType("checking");
    },
    onError: (error: any) => {
      toast({
        title: "❌ ACH Withdrawal Failed", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    
    if (!amount || amount < 1) {
      toast({
        title: "Invalid amount",
        description: "Please enter an amount of $1 or more",
        variant: "destructive",
      });
      return;
    }

    if (!bankName || !accountNumber || !routingNumber) {
      toast({
        title: "Missing information",
        description: "Please fill in all bank account details",
        variant: "destructive",
      });
      return;
    }

    depositMutation.mutate({
      amount,
      bankName,
      accountNumber,
      routingNumber,
      accountType,
    });
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount < 1) {
      toast({
        title: "Invalid amount",
        description: "Please enter an amount of $1 or more",
        variant: "destructive",
      });
      return;
    }

    if (!balance || amount > balance.currentBalance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough balance for this withdrawal",
        variant: "destructive",
      });
      return;
    }

    if (!withdrawBankName || !withdrawAccountNumber || !withdrawRoutingNumber) {
      toast({
        title: "Missing information",
        description: "Please fill in all bank account details",
        variant: "destructive",
      });
      return;
    }

    withdrawMutation.mutate({
      amount,
      bankName: withdrawBankName,
      accountNumber: withdrawAccountNumber,
      routingNumber: withdrawRoutingNumber,
      accountType: withdrawAccountType,
    });
  };

  const depositFee = 0; // ACH deposits typically free
  const withdrawFee = 1.00; // Small fee for ACH withdrawals
  const depositNetAmount = parseFloat(depositAmount) || 0;
  const withdrawNetAmount = Math.max(0, (parseFloat(withdrawAmount) || 0) - withdrawFee);

  return (
    <div className="lg:ml-64">
      <div className="min-h-screen p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground" data-testid="ach-title">
              ACH Bank Transfers
            </h1>
            <p className="text-muted-foreground">
              Add money from your bank account or send money to your bank account
            </p>
          </div>

          {/* Balance Display */}
          <Card className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 dark:text-green-300">Current Balance</p>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200" data-testid="current-balance">
                    ${balance?.currentBalance?.toFixed(2) || "0.00"}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="deposit" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="deposit" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Money (Deposit)
              </TabsTrigger>
              <TabsTrigger value="withdraw" className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                Send Money (Withdraw)
              </TabsTrigger>
            </TabsList>

            {/* ACH DEPOSIT TAB */}
            <TabsContent value="deposit">
              <Card className="backdrop-blur-sm bg-card/50 border border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <Building2 className="w-5 h-5" />
                    Deposit from Bank Account
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    🏦 Add money from your bank account via ACH transfer (3-5 business days)
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleDepositSubmit} className="space-y-6">
                    {/* Amount */}
                    <div className="space-y-2">
                      <Label htmlFor="deposit-amount">Amount to Deposit</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="deposit-amount"
                          type="number"
                          step="0.01"
                          min="1"
                          placeholder="0.00"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="pl-10"
                          data-testid="input-deposit-amount"
                        />
                      </div>
                    </div>

                    {/* Bank Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bank-name">Bank Name</Label>
                        <Input
                          id="bank-name"
                          placeholder="Chase, Wells Fargo, etc."
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          data-testid="input-bank-name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="account-type">Account Type</Label>
                        <Select value={accountType} onValueChange={setAccountType}>
                          <SelectTrigger data-testid="select-account-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="checking">Checking</SelectItem>
                            <SelectItem value="savings">Savings</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="routing-number">Routing Number</Label>
                        <Input
                          id="routing-number"
                          placeholder="9 digit routing number"
                          value={routingNumber}
                          onChange={(e) => setRoutingNumber(e.target.value)}
                          data-testid="input-routing-number"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="account-number">Account Number</Label>
                        <Input
                          id="account-number"
                          placeholder="Your account number"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          data-testid="input-account-number"
                        />
                      </div>
                    </div>

                    {/* Deposit Summary */}
                    {depositAmount && (
                      <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-700 dark:text-green-300">From Bank Account</span>
                          <span className="font-medium text-red-400">-${depositNetAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-1">
                          <span className="text-green-700 dark:text-green-300">ACH Fee</span>
                          <span className="font-medium text-green-600">FREE</span>
                        </div>
                        <hr className="my-2 border-green-200 dark:border-green-800" />
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-green-700 dark:text-green-300">Added to Balance</span>
                          <span className="font-bold text-green-600 dark:text-green-400">+${depositNetAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={depositMutation.isPending}
                      data-testid="button-ach-deposit"
                    >
                      {depositMutation.isPending ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Processing ACH Deposit...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Deposit ${depositNetAmount.toFixed(2)} via ACH
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ACH WITHDRAWAL TAB */}
            <TabsContent value="withdraw">
              <Card className="backdrop-blur-sm bg-card/50 border border-border shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <CreditCard className="w-5 h-5" />
                    Withdraw to Bank Account
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    🏦 Send money to your bank account via ACH transfer (3-5 business days)
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleWithdrawSubmit} className="space-y-6">
                    {/* Amount */}
                    <div className="space-y-2">
                      <Label htmlFor="withdraw-amount">Amount to Withdraw</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="withdraw-amount"
                          type="number"
                          step="0.01"
                          min="1"
                          placeholder="0.00"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="pl-10"
                          data-testid="input-withdraw-amount"
                        />
                      </div>
                    </div>

                    {/* Bank Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="withdraw-bank-name">Bank Name</Label>
                        <Input
                          id="withdraw-bank-name"
                          placeholder="Chase, Wells Fargo, etc."
                          value={withdrawBankName}
                          onChange={(e) => setWithdrawBankName(e.target.value)}
                          data-testid="input-withdraw-bank-name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="withdraw-account-type">Account Type</Label>
                        <Select value={withdrawAccountType} onValueChange={setWithdrawAccountType}>
                          <SelectTrigger data-testid="select-withdraw-account-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="checking">Checking</SelectItem>
                            <SelectItem value="savings">Savings</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="withdraw-routing-number">Routing Number</Label>
                        <Input
                          id="withdraw-routing-number"
                          placeholder="9 digit routing number"
                          value={withdrawRoutingNumber}
                          onChange={(e) => setWithdrawRoutingNumber(e.target.value)}
                          data-testid="input-withdraw-routing-number"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="withdraw-account-number">Account Number</Label>
                        <Input
                          id="withdraw-account-number"
                          placeholder="Your account number"
                          value={withdrawAccountNumber}
                          onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                          data-testid="input-withdraw-account-number"
                        />
                      </div>
                    </div>

                    {/* Withdrawal Summary */}
                    {withdrawAmount && (
                      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-blue-700 dark:text-blue-300">From Balance</span>
                          <span className="font-medium text-red-400">-${parseFloat(withdrawAmount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm mt-1">
                          <span className="text-blue-700 dark:text-blue-300">ACH Fee</span>
                          <span className="font-medium">$1.00</span>
                        </div>
                        <hr className="my-2 border-blue-200 dark:border-blue-800" />
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-blue-700 dark:text-blue-300">You'll Receive</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">${withdrawNetAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={withdrawMutation.isPending}
                      data-testid="button-ach-withdraw"
                    >
                      {withdrawMutation.isPending ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Processing ACH Withdrawal...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Withdraw ${withdrawNetAmount.toFixed(2)} via ACH
                        </>
                      )}
                    </Button>
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