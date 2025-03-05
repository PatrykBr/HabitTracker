import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Award, Star, Medal, Flame, Calendar } from 'lucide-react';

interface MilestoneConfettiProps {
  streak: number;
  habitName: string;
}

export function MilestoneConfetti({ streak, habitName }: MilestoneConfettiProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const { width, height } = useWindowSize();
  
  // Define milestone thresholds
  const milestones = [7, 14, 30, 60, 90, 180, 365];
  
  useEffect(() => {
    // Check if current streak is exactly at a milestone
    const isMilestone = milestones.includes(streak);
    
    if (isMilestone) {
      // Show confetti and dialog
      setShowConfetti(true);
      setShowDialog(true);
      
      // Stop confetti after 5 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [streak]);
  
  const getMilestoneIcon = () => {
    if (streak >= 180) return <Trophy className="h-12 w-12 text-yellow-500" />;
    if (streak >= 90) return <Medal className="h-12 w-12 text-yellow-500" />;
    if (streak >= 30) return <Award className="h-12 w-12 text-purple-500" />;
    return <Star className="h-12 w-12 text-blue-500" />;
  };
  
  const getMilestoneTitle = () => {
    if (streak >= 365) return "One Year Without Resets!";
    if (streak >= 180) return "Six Months Without Resets!";
    if (streak >= 90) return "Three Months Without Resets!";
    if (streak >= 60) return "Two Months Without Resets!";
    if (streak >= 30) return "One Month Without Resets!";
    if (streak >= 14) return "Two Weeks Without Resets!";
    return "One Week Without Resets!";
  };
  
  const getMilestoneMessage = () => {
    if (streak >= 180) {
      return "Incredible dedication! You've maintained your habit for half a year without a single reset. This level of consistency is truly remarkable.";
    }
    if (streak >= 90) {
      return "Amazing achievement! Three months without any resets shows your exceptional commitment to maintaining an unbroken chain.";
    }
    if (streak >= 30) {
      return "Congratulations! A full month without resets means your habit is becoming deeply ingrained in your routine.";
    }
    if (streak >= 14) {
      return "Great work! Two weeks without any resets shows you're serious about maintaining your streak and avoiding interruptions.";
    }
    return "Well done! One full week without resets is a significant first milestone in building a lasting habit.";
  };
  
  return (
    <>
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.15}
        />
      )}
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <div className="flex flex-col items-center text-center gap-4 py-4">
              {getMilestoneIcon()}
              <DialogTitle className="text-xl dark:text-white">{getMilestoneTitle()}</DialogTitle>
              <DialogDescription className="text-center dark:text-gray-300">
                {getMilestoneMessage()}
              </DialogDescription>
              
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 mt-2 w-full">
                <p className="text-purple-800 dark:text-purple-300 font-medium text-center">
                  {habitName}: {streak} day unbroken streak
                </p>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <Flame className="h-5 w-5 text-orange-500" />
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                  Remember: Every reset breaks your chain!
                </p>
              </div>
              
              <div className="flex gap-3 mt-3">
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                  onClick={() => setShowDialog(false)}
                >
                  Keep the Streak Alive!
                </Button>
              </div>
              
              <div className="flex items-center gap-2 mt-4 text-xs text-gray-500 dark:text-gray-400">
                <Calendar className="h-3 w-3" />
                <p>Next milestone: {streak < 14 ? 14 : streak < 30 ? 30 : streak < 60 ? 60 : streak < 90 ? 90 : streak < 180 ? 180 : streak < 365 ? 365 : 730} days</p>
              </div>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
} 