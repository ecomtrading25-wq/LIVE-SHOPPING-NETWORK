import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Wallet as WalletIcon,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  CreditCard,
  History,
  TrendingUp,
  Gift,
  Download
} from 'lucide-react';

export default function Wallet() {
  const { toast } = useToast();
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Fetch wallet data
  const { data: wallet, refetch } = trpc.wallet.getBalance.useQuery();
  const { data: transactions = [] } = trpc.wallet.getTransactions.useQuery({ limit: 20 });
  const { data: stats } = trpc.wallet.getStats.useQuery();

  // Mutations
  const addFunds = trpc.wallet.addFunds.useMutation({
    onSuccess: () => {
      toast({
        title: '💰 Funds Added!',
        description: 'Your wallet has been credited',
      });
      setShowAddFunds(false);
      setAddAmount('');
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const withdraw = trpc.wallet.withdraw.useMutation({
    onSuccess: () => {
      toast({
        title: '✅ Withdrawal Requested',
        description: 'Your withdrawal will be processed in 3-5 business days',
      });
      setShowWithdraw(false);
      setWithdrawAmount('');
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAddFunds = () => {
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }
    addFunds.mutate({ amount });
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }
    if (wallet && amount > wallet.availableForWithdrawal) {
      toast({
        title: 'Insufficient Funds',
        description: 'You do not have enough available balance',
        variant: 'destructive',
      });
      return;
    }
    withdraw.mutate({ amount });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownRight className="w-4 h-4 text-green-500" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case 'purchase':
        return <Gift className="w-4 h-4 text-red-500" />;
      case 'earning':
        return <DollarSign className="w-4 h-4 text-blue-500" />;
      default:
        return <History className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      completed: { variant: 'default', className: 'bg-green-500' },
      pending: { variant: 'secondary', className: 'bg-yellow-500' },
      failed: { variant: 'destructive', className: 'bg-red-500' },
      cancelled: { variant: 'secondary', className: 'bg-gray-500' },
    };
    return variants[status] || variants.pending;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <WalletIcon className="w-10 h-10 text-red-600" />
            My Wallet
          </h1>
          <p className="text-gray-600">Manage your balance and transactions</p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-red-600 to-orange-600 text-foreground border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80">Total Balance</span>
                <WalletIcon className="w-6 h-6 text-white/80" />
              </div>
              <p className="text-4xl font-bold mb-1">${wallet?.balance.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-white/60">Available funds</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Pending</span>
                <History className="w-6 h-6 text-yellow-500" />
              </div>
              <p className="text-3xl font-bold mb-1">${wallet?.pendingBalance.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-gray-500">Processing</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Lifetime Earnings</span>
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-3xl font-bold mb-1">${stats?.lifetimeEarnings.toFixed(2) || '0.00'}</p>
              <p className="text-sm text-gray-500">Total earned</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <Dialog open={showAddFunds} onOpenChange={setShowAddFunds}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Funds
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Funds to Wallet</DialogTitle>
                <DialogDescription>
                  Enter the amount you want to add to your wallet
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Amount (USD)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    min="1"
                    step="0.01"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setAddAmount('10')}
                    className="flex-1"
                  >
                    $10
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setAddAmount('25')}
                    className="flex-1"
                  >
                    $25
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setAddAmount('50')}
                    className="flex-1"
                  >
                    $50
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setAddAmount('100')}
                    className="flex-1"
                  >
                    $100
                  </Button>
                </div>
                <Button
                  onClick={handleAddFunds}
                  disabled={addFunds.isPending}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {addFunds.isPending ? 'Processing...' : 'Add Funds'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Withdraw
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Withdraw Funds</DialogTitle>
                <DialogDescription>
                  Withdraw funds to your bank account (3-5 business days)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    Available for withdrawal: <span className="font-bold">${wallet?.availableForWithdrawal.toFixed(2) || '0.00'}</span>
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Minimum withdrawal: $10.00
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Amount (USD)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min="10"
                    step="0.01"
                  />
                </div>
                <Button
                  onClick={handleWithdraw}
                  disabled={withdraw.isPending}
                  className="w-full"
                >
                  {withdraw.isPending ? 'Processing...' : 'Request Withdrawal'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No transactions yet</p>
                <p className="text-sm text-gray-500">Your transaction history will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction: any) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-background text-foreground rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-background text-foreground flex items-center justify-center">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-semibold capitalize">{transaction.type.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.createdAt).toLocaleString()}
                        </p>
                        {transaction.metadata && (
                          <p className="text-xs text-gray-400 mt-1">
                            {transaction.metadata.giftName && `Gift: ${transaction.metadata.giftName}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                      </p>
                      <Badge {...getStatusBadge(transaction.status)} className="text-xs">
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
