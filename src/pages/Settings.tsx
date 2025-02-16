
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useHabits } from '@/hooks/use-habits';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings2, Trash2, LogOut, Palette } from 'lucide-react';

const ACCENT_COLORS = [
  { name: 'Purple', value: '#9b87f5' },
  { name: 'Blue', value: '#0EA5E9' },
  { name: 'Green', value: '#10B981' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Pink', value: '#EC4899' },
];

export default function Settings() {
  const { habits, deleteHabit } = useHabits();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedColor, setSelectedColor] = useState('#9b87f5');

  const handleDeleteHabit = (id: string, name: string) => {
    deleteHabit(id);
    toast({
      title: "Habit deleted",
      description: `${name} has been removed from your habits.`,
    });
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    document.documentElement.style.setProperty('--accent', color);
    toast({
      title: "Theme updated",
      description: "The accent color has been updated.",
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-br from-secondary to-white">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-3 mb-6">
          <Settings2 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        {/* Theme Section */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Accent Color</h2>
          </div>
          <div className="flex gap-3">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => handleColorChange(color.value)}
                className={`w-10 h-10 rounded-full transition-all duration-200 ${
                  selectedColor === color.value ? 'ring-2 ring-offset-2 ring-black' : ''
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Habits Management Section */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Manage Habits</h2>
          </div>
          <div className="space-y-2">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className="flex items-center justify-between p-3 bg-white/50 rounded-lg"
              >
                <span>{habit.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteHabit(habit.id, habit.name)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Account Section */}
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate('/')}
        >
          Back to Habits
        </Button>
      </div>
    </div>
  );
}
