import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Heart, ArrowLeft, Home } from "lucide-react";

export default function SupportSuccessPage() {
  useEffect(() => {
    // Confetti effect or celebration animation could go here
    document.title = "Thank you! - MobileToolsBox";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <Card>
            <CardHeader>
              <div className="mx-auto mb-4">
                <div className="relative">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                  <Heart className="h-6 w-6 text-red-500 absolute -top-1 -right-1 animate-pulse" />
                </div>
              </div>
              <CardTitle className="text-2xl">Thank You!</CardTitle>
              <CardDescription>
                Your support means the world to us and helps keep MobileToolsBox free for everyone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your payment has been processed successfully. You should receive a confirmation email shortly.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold">What happens next?</h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <span>Your support helps us maintain and improve MobileToolsBox</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <span>All tools remain completely free for everyone</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span>We'll continue adding new features and improvements</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Link href="/">
                  <Button className="w-full" size="lg">
                    <Home className="h-4 w-4 mr-2" />
                    Back to MobileToolsBox
                  </Button>
                </Link>
                
                <Link href="/achievements">
                  <Button variant="outline" className="w-full">
                    Check out your achievements
                  </Button>
                </Link>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Have questions? Feel free to reach out through our feedback tool.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}