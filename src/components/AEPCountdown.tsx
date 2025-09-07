import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock } from "lucide-react";

const AEPCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const aepDate = new Date('2025-10-15T00:00:00').getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = aepDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-primary">
          <Calendar className="h-5 w-5" />
          <span>AEP Countdown</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Annual Enrollment Period starts in:
          </p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="text-center">
              <div className="bg-primary text-primary-foreground rounded-lg py-2 px-1 font-bold text-lg">
                {timeLeft.days}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Days</p>
            </div>
            <div className="text-center">
              <div className="bg-primary text-primary-foreground rounded-lg py-2 px-1 font-bold text-lg">
                {timeLeft.hours}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Hours</p>
            </div>
            <div className="text-center">
              <div className="bg-primary text-primary-foreground rounded-lg py-2 px-1 font-bold text-lg">
                {timeLeft.minutes}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Min</p>
            </div>
            <div className="text-center">
              <div className="bg-primary text-primary-foreground rounded-lg py-2 px-1 font-bold text-lg">
                {timeLeft.seconds}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Sec</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            October 15, 2025 - December 7, 2025
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AEPCountdown;