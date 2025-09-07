import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, 
  Star, 
  Award, 
  Target, 
  Zap, 
  Crown, 
  Medal,
  Flame,
  BookOpen,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Achievement {
  id: string;
  achievement_type: string;
  achievement_data: any;
  points_earned: number;
  earned_at: string;
  course_id?: string;
}

interface UserPoints {
  total_points: number;
  level_name: string;
  streak_days: number;
}

interface ProgressBadgesProps {
  userId?: string;
  courseId?: string;
  showOnlyRecent?: boolean;
  compact?: boolean;
}

const ACHIEVEMENT_TYPES = {
  lesson_completed: {
    icon: CheckCircle,
    title: 'Lesson Master',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  course_completed: {
    icon: Trophy,
    title: 'Course Champion',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  streak_7: {
    icon: Flame,
    title: 'Week Warrior',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  streak_30: {
    icon: Crown,
    title: 'Month Master',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  points_milestone: {
    icon: Star,
    title: 'Point Collector',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  quiz_perfect: {
    icon: Target,
    title: 'Perfect Score',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100'
  },
  fast_learner: {
    icon: Zap,
    title: 'Speed Learner',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100'
  },
  difficulty_master: {
    icon: Award,
    title: 'Difficulty Master',
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  }
};

const LEVEL_THRESHOLDS = [
  { name: 'Beginner', points: 0, color: 'text-gray-600' },
  { name: 'Learner', points: 100, color: 'text-green-600' },
  { name: 'Scholar', points: 500, color: 'text-blue-600' },
  { name: 'Expert', points: 1500, color: 'text-purple-600' },
  { name: 'Master', points: 5000, color: 'text-orange-600' },
  { name: 'Grandmaster', points: 10000, color: 'text-red-600' }
];

const ProgressBadges = ({ 
  userId, 
  courseId, 
  showOnlyRecent = false, 
  compact = false 
}: ProgressBadgesProps) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUserProgress();
  }, [userId, courseId]);

  const loadUserProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = userId || user?.id;
      
      if (!currentUserId) return;

      // Load achievements
      let achievementsQuery = supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', currentUserId)
        .order('earned_at', { ascending: false });

      if (courseId) {
        achievementsQuery = achievementsQuery.eq('course_id', courseId);
      }

      if (showOnlyRecent) {
        achievementsQuery = achievementsQuery.limit(5);
      }

      const { data: achievementsData, error: achievementsError } = await achievementsQuery;
      
      if (achievementsError) throw achievementsError;
      setAchievements(achievementsData || []);

      // Load user points
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', currentUserId)
        .single();

      if (pointsError && pointsError.code !== 'PGRST116') throw pointsError;
      setUserPoints(pointsData);

    } catch (error: any) {
      console.error('Error loading user progress:', error);
      toast({
        title: "Error",
        description: "Failed to load progress data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLevel = (points: number) => {
    let currentLevel = LEVEL_THRESHOLDS[0];
    for (const level of LEVEL_THRESHOLDS) {
      if (points >= level.points) {
        currentLevel = level;
      } else {
        break;
      }
    }
    return currentLevel;
  };

  const getNextLevel = (points: number) => {
    return LEVEL_THRESHOLDS.find(level => level.points > points) || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  };

  const calculateLevelProgress = (points: number) => {
    const currentLevel = getCurrentLevel(points);
    const nextLevel = getNextLevel(points);
    
    if (currentLevel === nextLevel) return 100;
    
    const pointsInCurrentLevel = points - currentLevel.points;
    const pointsNeededForNextLevel = nextLevel.points - currentLevel.points;
    
    return Math.round((pointsInCurrentLevel / pointsNeededForNextLevel) * 100);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-muted rounded-lg mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const totalPoints = userPoints?.total_points || 0;
  const currentLevel = getCurrentLevel(totalPoints);
  const nextLevel = getNextLevel(totalPoints);
  const levelProgress = calculateLevelProgress(totalPoints);

  if (compact) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Medal className="h-5 w-5 text-primary" />
          <span className="font-medium">{totalPoints} pts</span>
        </div>
        
        <Badge className={currentLevel.color}>
          {currentLevel.name}
        </Badge>
        
        {userPoints?.streak_days && userPoints.streak_days > 0 && (
          <div className="flex items-center space-x-1">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm">{userPoints.streak_days}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Level Progress Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crown className={`h-5 w-5 ${currentLevel.color}`} />
              <span>Learning Progress</span>
            </div>
            <Badge variant="outline" className={currentLevel.color}>
              {currentLevel.name}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{totalPoints}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-orange-500">{userPoints?.streak_days || 0}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-green-500">{achievements.length}</div>
              <div className="text-sm text-muted-foreground">Achievements</div>
            </div>
          </div>

          {currentLevel !== nextLevel && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress to {nextLevel.name}</span>
                <span>{levelProgress}%</span>
              </div>
              <Progress value={levelProgress} className="h-2" />
              <div className="text-xs text-muted-foreground text-center">
                {nextLevel.points - totalPoints} points to next level
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <span>{showOnlyRecent ? 'Recent Achievements' : 'All Achievements'}</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {achievements.map((achievement, index) => {
                const achievementType = ACHIEVEMENT_TYPES[achievement.achievement_type as keyof typeof ACHIEVEMENT_TYPES] || {
                  icon: Award,
                  title: 'Achievement',
                  color: 'text-gray-600',
                  bgColor: 'bg-gray-100'
                };
                
                const IconComponent = achievementType.icon;
                
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center space-x-3 p-3 rounded-lg ${achievementType.bgColor}`}
                  >
                    <IconComponent className={`h-6 w-6 ${achievementType.color}`} />
                    
                    <div className="flex-1">
                      <div className="font-medium">{achievementType.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(achievement.earned_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <Badge variant="outline">
                      +{achievement.points_earned} pts
                    </Badge>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievement Goals (Future Achievements) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span>Achievement Goals</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Streak Goals */}
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <Flame className="h-5 w-5 text-orange-500" />
              <div className="flex-1">
                <div className="font-medium">Weekly Streak</div>
                <div className="text-sm text-muted-foreground">
                  {userPoints?.streak_days || 0}/7 days
                </div>
              </div>
              <Progress 
                value={((userPoints?.streak_days || 0) / 7) * 100} 
                className="w-16 h-2" 
              />
            </div>

            {/* Points Milestone */}
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <Star className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <div className="font-medium">Point Milestone</div>
                <div className="text-sm text-muted-foreground">
                  {totalPoints}/{nextLevel.points} points
                </div>
              </div>
              <Progress 
                value={levelProgress} 
                className="w-16 h-2" 
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressBadges;