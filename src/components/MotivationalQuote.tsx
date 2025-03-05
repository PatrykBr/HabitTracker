import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Quote, Flame } from 'lucide-react';

const QUOTES = [
  {
    text: "The streak that continues is worth more than the one you have to restart.",
    author: "Habit Tracker Wisdom"
  },
  {
    text: "Every day without a reset is a victory worth celebrating.",
    author: "Habit Tracker Wisdom"
  },
  {
    text: "Consistency is not about perfection, but about never giving up.",
    author: "James Clear"
  },
  {
    text: "The power of a streak lies in its unbroken chain.",
    author: "Jerry Seinfeld"
  },
  {
    text: "Don't break the chain. Your future self will thank you.",
    author: "Habit Tracker Wisdom"
  },
  {
    text: "The chains of habit are too weak to be felt until they are too strong to be broken.",
    author: "Samuel Johnson"
  },
  {
    text: "Every day you maintain your streak, you strengthen your identity.",
    author: "James Clear"
  },
  {
    text: "First we make our habits, then our habits make us.",
    author: "Charles C. Noble"
  },
  {
    text: "The only way to build a lasting streak is to show up, especially when you don't feel like it.",
    author: "Habit Tracker Wisdom"
  },
  {
    text: "Your streak is a testament to your commitment to yourself.",
    author: "Habit Tracker Wisdom"
  },
  {
    text: "Excellence is not a singular act but a habit maintained without interruption.",
    author: "Shaquille O'Neal"
  },
  {
    text: "Successful people maintain their habits without resets.",
    author: "Brian Tracy"
  },
  {
    text: "Discipline is choosing your streak over momentary comfort.",
    author: "Habit Tracker Wisdom"
  },
  {
    text: "Small habits maintained consistently have a surprising impact.",
    author: "James Clear"
  },
  {
    text: "The longest journey begins with a single step, but continues with an unbroken path.",
    author: "Habit Tracker Wisdom"
  }
];

export function MotivationalQuote() {
  const [quote, setQuote] = useState<typeof QUOTES[0] | null>(null);
  
  useEffect(() => {
    // Get a deterministic quote based on the day of the year
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    const quoteIndex = dayOfYear % QUOTES.length;
    setQuote(QUOTES[quoteIndex]);
  }, []);
  
  if (!quote) return null;
  
  return (
    <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-1">
          <Flame className="h-5 w-5 text-orange-500" />
          <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400">Your Goal: Maintain Your Streak, Avoid Resets</h3>
        </div>
        <div className="flex gap-3">
          <Quote className="h-8 w-8 text-purple-300 dark:text-purple-500 flex-shrink-0 mt-1" />
          <div className="space-y-2">
            <p className="text-gray-700 dark:text-gray-300 italic">{quote.text}</p>
            <p className="text-sm text-right text-gray-500 dark:text-gray-400">— {quote.author}</p>
          </div>
        </div>
      </div>
    </Card>
  );
} 