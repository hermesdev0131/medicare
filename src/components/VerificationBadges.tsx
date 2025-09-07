import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, Mail, Phone, Award, User, Camera, Shield } from 'lucide-react';

interface VerificationBadgesProps {
  profile: any;
  compact?: boolean;
}

const VerificationBadges = ({ profile, compact = false }: VerificationBadgesProps) => {
  const badges = [
    {
      id: 'npn_verified',
      label: 'Agent Verified',
      icon: Award,
      active: profile?.npn_verified,
      color: 'bg-green-100 text-green-700 border-green-200'
    },
    {
      id: 'profile_completed',
      label: 'Profile Complete',
      icon: User,
      active: profile?.profile_completed,
      color: 'bg-blue-100 text-blue-700 border-blue-200'
    },
    {
      id: 'avatar_uploaded',
      label: 'Photo Added',
      icon: Camera,
      active: !!profile?.avatar_url,
      color: 'bg-purple-100 text-purple-700 border-purple-200'
    }
  ];

  const activeBadges = badges.filter(badge => badge.active);
  
  if (activeBadges.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <TooltipProvider>
          {activeBadges.slice(0, 3).map((badge) => (
            <Tooltip key={badge.id}>
              <TooltipTrigger>
                <div className={`p-1 rounded-full ${badge.color}`}>
                  <badge.icon className="h-3 w-3" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{badge.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
          {activeBadges.length > 3 && (
            <Tooltip>
              <TooltipTrigger>
                <div className="p-1 rounded-full bg-gray-100 text-gray-600">
                  <span className="text-xs font-medium">+{activeBadges.length - 3}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  {activeBadges.slice(3).map(badge => (
                    <p key={badge.id}>{badge.label}</p>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {activeBadges.map((badge) => (
        <Badge 
          key={badge.id} 
          variant="outline" 
          className={`${badge.color} flex items-center gap-1`}
        >
          <badge.icon className="h-3 w-3" />
          {badge.label}
        </Badge>
      ))}
      
      {/* Special badge for fully verified accounts */}
      {activeBadges.length === badges.length && (
        <Badge variant="outline" className="bg-gradient-to-r from-green-100 to-blue-100 text-green-700 border-green-200 flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Fully Verified
        </Badge>
      )}
    </div>
  );
};

export default VerificationBadges;