
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Home, Sparkles } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="min-h-screen w-full flex items-center justify-center p-4">
        <div className="text-center space-y-6 card-glass p-8 rounded-xl animate-fade-in">
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
    </div>
  );
}
