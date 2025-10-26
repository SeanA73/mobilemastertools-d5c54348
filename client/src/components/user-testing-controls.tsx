import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TestTube, Users, DollarSign, TrendingUp } from "lucide-react";

interface TestGroup {
  id: string;
  name: string;
  description: string;
  features: string[];
  pricing: {
    starter: number;
    pro: number;
    premium: number;
  };
}

interface TestStats {
  totalUsers: number;
  revenueToday: number;
  conversionRate: number;
  groupStats: {
    [groupId: string]: {
      users: number;
      revenue: number;
      conversion: number;
    };
  };
}

const TEST_GROUPS: TestGroup[] = [
  {
    id: "control",
    name: "Control Group",
    description: "Standard pricing and features",
    features: ["Standard feature set", "Normal onboarding", "Regular pricing"],
    pricing: { starter: 2.99, pro: 4.99, premium: 9.99 }
  },
  {
    id: "variant_a",
    name: "Lower Pricing",
    description: "Reduced prices to test price sensitivity",
    features: ["20% lower pricing", "Extended trial", "Value messaging"],
    pricing: { starter: 1.99, pro: 3.99, premium: 7.99 }
  },
  {
    id: "variant_b",
    name: "Premium Focus",
    description: "Higher prices with premium positioning",
    features: ["Premium branding", "Advanced features highlighted", "Professional messaging"],
    pricing: { starter: 3.99, pro: 6.99, premium: 12.99 }
  },
  {
    id: "pricing_test",
    name: "Dynamic Pricing",
    description: "Personalized pricing based on usage",
    features: ["Usage-based pricing", "Personalized offers", "Behavioral triggers"],
    pricing: { starter: 2.49, pro: 5.49, premium: 10.99 }
  }
];

const SUBSCRIPTION_TIERS = [
  "free", "starter", "pro", "premium", "lifetime"
];

export default function UserTestingControls() {
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedTier, setSelectedTier] = useState<string>("");
  const { toast } = useToast();

  const { data: testStats } = useQuery<TestStats>({
    queryKey: ["/api/test-statistics"],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: { userId: string; testGroup?: string; subscriptionTier?: string }) =>
      apiRequest("POST", "/api/update-user-test-status", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User test status updated successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user test status",
        variant: "destructive"
      });
    }
  });

  const createTestUserMutation = useMutation({
    mutationFn: (data: { email: string; testGroup: string; subscriptionTier: string }) =>
      apiRequest("POST", "/api/create-test-user", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Test user created successfully"
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create test user",
        variant: "destructive"
      });
    }
  });

  const handleUpdateUser = () => {
    if (!selectedUser) return;
    
    updateUserMutation.mutate({
      userId: selectedUser,
      testGroup: selectedGroup || undefined,
      subscriptionTier: selectedTier || undefined
    });
  };

  const handleCreateTestUser = (testGroup: string, tier: string) => {
    const email = `test-${testGroup}-${tier}@example.com`;
    createTestUserMutation.mutate({
      email,
      testGroup,
      subscriptionTier: tier
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          User Testing Dashboard
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Manage A/B tests and user segments to optimize monetization
        </p>
      </div>

      {/* Test Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-2xl font-bold">{testStats?.totalUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue Today</p>
                <p className="text-2xl font-bold">${testStats?.revenueToday || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Conversion Rate</p>
                <p className="text-2xl font-bold">{testStats?.conversionRate || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <TestTube className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Tests</p>
                <p className="text-2xl font-bold">{TEST_GROUPS.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Groups Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {TEST_GROUPS.map((group) => (
          <Card key={group.id} className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{group.name}</CardTitle>
                <Badge variant={group.id === "control" ? "default" : "secondary"}>
                  {group.id === "control" ? "Control" : "Test"}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {group.description}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium">Pricing:</p>
                <div className="text-xs space-y-1">
                  <div>Starter: ${group.pricing.starter}/mo</div>
                  <div>Pro: ${group.pricing.pro}/mo</div>
                  <div>Premium: ${group.pricing.premium}/mo</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Quick Test Users:</p>
                <div className="flex gap-1 flex-wrap">
                  {["free", "starter", "pro"].map((tier) => (
                    <Button
                      key={tier}
                      size="sm"
                      variant="outline"
                      className="text-xs px-2 py-1 h-auto"
                      onClick={() => handleCreateTestUser(group.id, tier)}
                      disabled={createTestUserMutation.isPending}
                    >
                      {tier}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Manual User Management */}
      <Card>
        <CardHeader>
          <CardTitle>Manual User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">User ID/Email</label>
              <input
                type="text"
                placeholder="Enter user ID or email"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Test Group</label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select test group" />
                </SelectTrigger>
                <SelectContent>
                  {TEST_GROUPS.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Subscription Tier</label>
              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  {SUBSCRIPTION_TIERS.map((tier) => (
                    <SelectItem key={tier} value={tier}>
                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleUpdateUser}
                disabled={!selectedUser || updateUserMutation.isPending}
                className="w-full"
              >
                {updateUserMutation.isPending ? "Updating..." : "Update User"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Tracking */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown by Test Group</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {TEST_GROUPS.map((group) => (
              <div key={group.id} className="text-center p-4 border rounded-lg">
                <h4 className="font-medium mb-2">{group.name}</h4>
                <div className="space-y-1 text-sm">
                  <div>Users: {testStats?.groupStats?.[group.id]?.users || 0}</div>
                  <div>Revenue: ${testStats?.groupStats?.[group.id]?.revenue || 0}</div>
                  <div>Conversion: {testStats?.groupStats?.[group.id]?.conversion || 0}%</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}