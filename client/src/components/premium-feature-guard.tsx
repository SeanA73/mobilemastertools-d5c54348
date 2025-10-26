interface PremiumFeatureGuardProps {
  toolName?: string;
  toolDescription?: string;
  isAccessible?: boolean;
  children: React.ReactNode;
}

export default function PremiumFeatureGuard({ 
  children 
}: PremiumFeatureGuardProps) {
  // All features are now free, always show the content
  return <>{children}</>;
}