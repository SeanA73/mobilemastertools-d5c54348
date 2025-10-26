import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Coffee, Heart } from "lucide-react";

export default function DonationButton() {
  return (
    <Link href="/pricing">
      <Button 
        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        size="sm"
      >
        <Coffee className="w-4 h-4 mr-2" />
        Buy me a coffee
        <Heart className="w-3 h-3 ml-1 text-red-200" />
      </Button>
    </Link>
  );
}