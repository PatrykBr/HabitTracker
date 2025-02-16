
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Home, Sparkles } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[linear-gradient(109.6deg,rgba(223,234,247,1)_11.2%,rgba(244,248,252,1)_91.1%)] overflow-hidden">
      {/* Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" 
             style={{ transform: 'translate(20%, -20%)' }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse delay-700"
             style={{ transform: 'translate(-20%, 20%)' }} />
      </div>

      <div className="text-center space-y-6 bg-white/90 backdrop-blur-sm p-8 rounded-xl border border-purple-100 shadow-lg shadow-purple-100/20 animate-fade-in">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-primary to-blue-600">404</h1>
          <Sparkles className="h-6 w-6 text-primary animate-pulse" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-700">Page Not Found</h2>
        <p className="text-purple-400 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button
          onClick={() => navigate("/")}
          className="bg-gradient-to-r from-primary via-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-white shadow-md hover:shadow-lg transition-all duration-300"
        >
          <Home className="h-4 w-4 mr-2" />
          Return Home
        </Button>
      </div>
    </div>
  );
}
