import { useState } from "react";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  CreditCard, 
  Plus, 
  Trash2,
  ArrowRight,
  Shield,
  Clock,
  DollarSign
} from "lucide-react";
import type { Balance, UserCard } from "@shared/schema";

interface CardFormData {
  cardNumber: string;
  expirationDate: string;
  cvv: string;
  zipCode: string;
  cardName: string;
}

function AddCardForm({ onAdd }: { onAdd: () => void }) {
  const [formData, setFormData] = useState<CardFormData>({
    cardNumber: '',
    expirationDate: '',
    cvv: '',
    zipCode: '',
    cardName: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addCardMutation = useMutation({
    mutationFn: async (cardData: { cardName: string; cardLast4: string; cardBrand: string; stripeCardId?: string }) => {
      const response = await apiRequest("POST", "/api/user-cards", cardData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-cards'] });
      toast({
        title: "Card Added",
        description: "Your card has been added successfully.",
      });
      onAdd();
      // Reset form
      setFormData({
        cardNumber: '',
        expirationDate: '',
        cvv: '',
        zipCode: '',
        cardName: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add card.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cardNumber || !formData.expirationDate || !formData.cvv || !formData.zipCode || !formData.cardName) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    // Extract card info
    const cardLast4 = formData.cardNumber.replace(/\s/g, '').slice(-4);
    const cardBrand = getCardBrand(formData.cardNumber);
    
    addCardMutation.mutate({
      cardName: formData.cardName,
      cardLast4,
      cardBrand,
      stripeCardId: `card_test_${Date.now()}`
    });
  };

  const getCardBrand = (cardNumber: string): string => {
    const number = cardNumber.replace(/\s/g, '');
    if (number.startsWith('4')) return 'visa';
    if (number.startsWith('5') || number.startsWith('2')) return 'mastercard';
    if (number.startsWith('3')) return 'amex';
    return 'card';
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiration = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="cardName">Card Name</Label>
        <Input
          id="cardName"
          value={formData.cardName}
          onChange={(e) => setFormData(prev => ({ ...prev, cardName: e.target.value }))}
          placeholder="e.g., Main Visa, Business Card"
          className="mt-2"
          required
        />
      </div>

      <div>
        <Label htmlFor="cardNumber">Card Number</Label>
        <Input
          id="cardNumber"
          value={formData.cardNumber}
          onChange={(e) => setFormData(prev => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))}
          placeholder="1234 5678 9012 3456"
          className="mt-2"
          maxLength={19}
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="expirationDate">Expiration</Label>
          <Input
            id="expirationDate"
            value={formData.expirationDate}
            onChange={(e) => setFormData(prev => ({ ...prev, expirationDate: formatExpiration(e.target.value) }))}
            placeholder="MM/YY"
            className="mt-2"
            maxLength={5}
            required
          />
        </div>
        <div>
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            value={formData.cvv}
            onChange={(e) => setFormData(prev => ({ ...prev, cvv: e.target.value.replace(/[^0-9]/g, '') }))}
            placeholder="123"
            className="mt-2"
            maxLength={4}
            required
          />
        </div>
        <div>
          <Label htmlFor="zipCode">ZIP</Label>
          <Input
            id="zipCode"
            value={formData.zipCode}
            onChange={(e) => setFormData(prev => ({ ...prev, zipCode: e.target.value }))}
            placeholder="12345"
            className="mt-2"
            maxLength={10}
            required
          />
        </div>
      </div>

      <div className="flex space-x-2 pt-4">
        <Button 
          type="submit" 
          className="flex-1"
          disabled={addCardMutation.isPending}
        >
          {addCardMutation.isPending ? "Adding..." : "Add Card"}
        </Button>
      </div>
    </form>
  );
}

export default function DepositToCard() {
  const [amount, setAmount] = useState<string>("");
  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const [showAddCard, setShowAddCard] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: balance, isLoading } = useQuery<Balance>({
    queryKey: ['/api/balance'],
  });

  const { data: cardsData, isLoading: cardsLoading } = useQuery<{ cards: UserCard[] }>({
    queryKey: ['/api/user-cards']
  });

  const cards = cardsData?.cards || [];

  // Set default card when data is loaded
  React.useEffect(() => {
    if (cards.length > 0 && !selectedCardId) {
      const defaultCard = cards.find(c => c.isDefault === 'true') || cards[0];
      setSelectedCardId(defaultCard.id);
    }
  }, [cards, selectedCardId]);

  const depositMutation = useMutation({
    mutationFn: async ({ amount, cardId }: { amount: number; cardId: string }) => {
      const response = await apiRequest("POST", "/api/deposit-to-card", { amount, cardId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/balance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      setAmount("");
      toast({
        title: "Deposit Successful",
        description: "Funds have been sent to your card.",
      });
    },
    onError: (error: any) => {
      const isStripeKeyError = error.message.includes("Live Stripe keys detected");
      toast({
        title: isStripeKeyError ? "Development Setup Required" : "Withdrawal Failed",
        description: isStripeKeyError 
          ? "This app requires Stripe test keys for development. Please update your keys."
          : error.message,
        variant: "destructive",
      });
    },
  });

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    
    const numAmount = parseFloat(amount);
    
    if (!numAmount || numAmount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount of at least $1.00",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCardId) {
      toast({
        title: "No Card Selected",
        description: "Please select a card for withdrawal",
        variant: "destructive",
      });
      return;
    }

    if (balance && numAmount > balance.currentBalance) {
      toast({
        title: "Insufficient Funds",
        description: "You don't have enough balance for this withdrawal",
        variant: "destructive",
      });
      return;
    }

    depositMutation.mutate({ amount: numAmount, cardId: selectedCardId });
  };

  const numAmount = parseFloat(amount) || 0;
  const fee = 0; // No fees for deposits
  const netAmount = Math.max(0, numAmount - fee);

  if (isLoading || cardsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="lg:pl-64 pb-20 lg:pb-0">
      {/* Header */}
      <header className="bg-card/50 backdrop-blur-sm border-b border-border sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">
            Withdraw to Card
          </h1>
          <p className="text-sm text-muted-foreground">
            Withdraw funds directly to your debit or credit card
          </p>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-2xl mx-auto space-y-8">

          {/* Current Balance */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
                <p className="text-3xl font-bold text-foreground" data-testid="balance-amount">
                  ${balance?.currentBalance.toFixed(2) || "0.00"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Saved Cards */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Your Cards
                </CardTitle>
                <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Card
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Card</DialogTitle>
                    </DialogHeader>
                    <AddCardForm onAdd={() => setShowAddCard(false)} />
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {cards.length > 0 ? (
                <div className="grid gap-3">
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedCardId === card.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedCardId(card.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium">{card.cardName}</p>
                            <p className="text-sm text-muted-foreground">
                              {card.cardBrand.toUpperCase()} ••••{card.cardLast4}
                            </p>
                          </div>
                        </div>
                        {card.isDefault === 'true' && (
                          <Badge variant="secondary" className="text-xs">Default</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium mb-2">No cards added yet</p>
                  <p className="text-sm mb-4">Add a card to start withdrawing funds</p>
                  <Button onClick={() => setShowAddCard(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Card
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Withdrawal Form */}
          {cards.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Withdraw Funds</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleWithdraw} className="space-y-6">
                  <div>
                    <Label htmlFor="amount">Withdrawal Amount</Label>
                    <div className="relative mt-2">
                      <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-8"
                        placeholder="0.00"
                        min="1"
                        max={balance?.currentBalance || 0}
                        step="0.01"
                        data-testid="input-amount"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Available: ${balance?.currentBalance.toFixed(2) || "0.00"}
                    </p>
                  </div>

                  {/* Fee Information */}
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Instant Transfer Fee</span>
                      <span className="text-foreground" data-testid="text-fee">$1.75</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-foreground">You'll receive</span>
                      <span className="font-bold text-primary" data-testid="text-net-amount">
                        ${netAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Transfer Info */}
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="space-y-2">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100">
                          Instant Transfer
                        </h4>
                        <div className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>Funds arrive within minutes</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4" />
                            <span>$1.75 fee per transfer</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={!selectedCardId || !numAmount || numAmount < 0.01 || depositMutation.isPending}
                    data-testid="button-withdraw"
                  >
                    {depositMutation.isPending ? "Processing..." : (
                      <>
                        Withdraw ${numAmount.toFixed(2)}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}