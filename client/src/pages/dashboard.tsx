import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Clock,
  CreditCard,
  Building2,
  Zap
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Balance, Transaction } from "@shared/schema";

export default function Dashboard() {
  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useQuery<Balance>({
    queryKey: ['/api/balance'],
    refetchInterval: false,
  });

  const { data: transactions, isLoading: transactionsLoading, refetch: refetchTransactions } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    refetchInterval: false,
  });

  const handleRefresh = () => {
    refetchBalance();
    refetchTransactions();
  };

  if (balanceLoading || transactionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="lg:pl-64 pb-20 lg:pb-0 min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-40 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" data-testid="page-title">
                Financial Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your balance and transactions with ease</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="bg-white/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800"
                data-testid="button-refresh"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Refresh
              </Button>
              <div className="text-right bg-white/50 dark:bg-gray-800/50 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">Last updated</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300" data-testid="text-last-updated">
                  {balance?.lastUpdated ? formatDistanceToNow(new Date(balance.lastUpdated), { addSuffix: true }) : 'Just now'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 font-medium">Current Balance</p>
                  <p className="text-4xl font-bold mt-2" data-testid="text-current-balance">
                    ${balance?.currentBalance?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-blue-100 text-sm mt-1">Available to withdraw</p>
                </div>
                <div className="p-4 bg-white/20 rounded-2xl">
                  <DollarSign className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 border-0 text-white shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 font-medium">Total Added</p>
                  <p className="text-4xl font-bold mt-2" data-testid="text-total-added">
                    ${balance?.totalAdded?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-green-100 text-sm mt-1">Lifetime deposits</p>
                </div>
                <div className="p-4 bg-white/20 rounded-2xl">
                  <TrendingUp className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-pink-600 border-0 text-white shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 font-medium">Total Withdrawn</p>
                  <p className="text-4xl font-bold mt-2" data-testid="text-total-withdrawn">
                    ${balance?.totalWithdrawn?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-purple-100 text-sm mt-1">Lifetime withdrawals</p>
                </div>
                <div className="p-4 bg-white/20 rounded-2xl">
                  <TrendingDown className="w-8 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle data-testid="transactions-title">Recent Transactions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
              {transactions && transactions.length > 0 ? (
                transactions.map((transaction: Transaction) => (
                  <div 
                    key={transaction.id} 
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-primary/5 transition-colors"
                    data-testid={`transaction-${transaction.id}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${
                        transaction.type === 'deposit' 
                          ? 'bg-green-500/10' 
                          : 'bg-red-500/10'
                      }`}>
                        {transaction.type === 'deposit' ? (
                          <TrendingUp className="w-5 h-5 text-green-400" />
                        ) : transaction.paymentMethodName && (transaction.paymentMethodName.includes('••••') || transaction.paymentMethodName.includes('VISA') || transaction.paymentMethodName.includes('MASTERCARD') || transaction.paymentMethodName.includes('AMEX')) ? (
                          <CreditCard className="w-5 h-5 text-red-400" />
                        ) : (
                          <Building2 className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {transaction.type === 'deposit' 
                            ? 'Card Deposit' 
                            : transaction.paymentMethodName && (transaction.paymentMethodName.includes('••••') || transaction.paymentMethodName.includes('VISA') || transaction.paymentMethodName.includes('MASTERCARD') || transaction.paymentMethodName.includes('AMEX'))
                              ? 'Instant Card Transfer'
                              : 'Standard Transfer'
                          }
                        </p>
                        {transaction.type === 'withdrawal' && transaction.paymentMethodName && (
                          <div>
                            <p className="text-sm text-muted-foreground">
                              To: {transaction.paymentMethodName}
                            </p>
                            {transaction.paymentMethodName.includes('••••') || transaction.paymentMethodName.includes('VISA') || transaction.paymentMethodName.includes('MASTERCARD') || transaction.paymentMethodName.includes('AMEX') ? (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Zap className="w-3 h-3 mr-1" />
                                <span>Instant transfer</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="w-3 h-3 mr-1" />
                                <span>1-3 business days</span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Net: ${transaction.netAmount.toFixed(2)}
                      </p>
                      {transaction.fee > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Fee: ${transaction.fee.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8" data-testid="no-transactions">
                  <p className="text-muted-foreground">No transactions yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Your transaction history will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
