import { useState, useEffect, useRef, useCallback } from "react";
import "@/App.css";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Asset URLs
const BELL_IMAGE = "https://customer-assets.emergentagent.com/job_0a2d9433-7faf-4a43-8fda-0d77d0443851/artifacts/cd26ldzp_image.png";
const BELL_SOUND = "https://customer-assets.emergentagent.com/job_0a2d9433-7faf-4a43-8fda-0d77d0443851/artifacts/qsx4zf71_Purifying_Auspicious_Worship_Bell_Sound_Effect_Hindu_Religious_Bell_Sound_Ghanti_Sound_Effect_128KBPS.mp4";

// Shake detection threshold
const SHAKE_THRESHOLD = 15;
const SHAKE_COOLDOWN = 300; // ms between shakes

function App() {
  const [isRinging, setIsRinging] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [hasMotionPermission, setHasMotionPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ringCount, setRingCount] = useState(0);
  const [showRipple, setShowRipple] = useState(false);
  
  const audioRef = useRef(null);
  const lastShakeTime = useRef(0);
  const lastAcceleration = useRef({ x: 0, y: 0, z: 0 });
  
  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio(BELL_SOUND);
    audioRef.current.preload = "auto";
    
    audioRef.current.addEventListener("canplaythrough", () => {
      setIsLoading(false);
    });
    
    audioRef.current.addEventListener("error", () => {
      setIsLoading(false);
    });
    
    // Check if device motion is available
    if (typeof DeviceMotionEvent !== "undefined") {
      // iOS 13+ requires permission
      if (typeof DeviceMotionEvent.requestPermission === "function") {
        setShowPermissionDialog(true);
      } else {
        // Android and older iOS - permission not required
        setHasMotionPermission(true);
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  // Play bell sound
  const playBellSound = useCallback(() => {
    if (audioRef.current && !isRinging) {
      setIsRinging(true);
      setShowRipple(true);
      setRingCount(prev => prev + 1);
      
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
      
      // Reset animation after it completes
      setTimeout(() => {
        setIsRinging(false);
      }, 500);
      
      setTimeout(() => {
        setShowRipple(false);
      }, 600);
    }
  }, [isRinging]);
  
  // Handle device motion (shake detection)
  const handleDeviceMotion = useCallback((event) => {
    const { accelerationIncludingGravity } = event;
    
    if (!accelerationIncludingGravity) return;
    
    const { x, y, z } = accelerationIncludingGravity;
    const currentTime = Date.now();
    
    // Calculate acceleration delta
    const deltaX = Math.abs(x - lastAcceleration.current.x);
    const deltaY = Math.abs(y - lastAcceleration.current.y);
    const deltaZ = Math.abs(z - lastAcceleration.current.z);
    
    // Update last acceleration
    lastAcceleration.current = { x, y, z };
    
    // Check if shake detected
    const totalDelta = deltaX + deltaY + deltaZ;
    
    if (totalDelta > SHAKE_THRESHOLD && currentTime - lastShakeTime.current > SHAKE_COOLDOWN) {
      lastShakeTime.current = currentTime;
      playBellSound();
    }
  }, [playBellSound]);
  
  // Add device motion listener
  useEffect(() => {
    if (hasMotionPermission) {
      window.addEventListener("devicemotion", handleDeviceMotion);
      
      return () => {
        window.removeEventListener("devicemotion", handleDeviceMotion);
      };
    }
  }, [hasMotionPermission, handleDeviceMotion]);
  
  // Request motion permission (iOS)
  const requestMotionPermission = async () => {
    try {
      if (typeof DeviceMotionEvent.requestPermission === "function") {
        const permission = await DeviceMotionEvent.requestPermission();
        if (permission === "granted") {
          setHasMotionPermission(true);
          setShowPermissionDialog(false);
        }
      }
    } catch (error) {
      console.error("Error requesting motion permission:", error);
    }
  };
  
  // Handle click/tap on bell
  const handleBellClick = () => {
    playBellSound();
  };
  
  return (
    <div className="app-container bg-background">
      {/* Background Image */}
      <img 
        src={BELL_IMAGE}
        alt="Background"
        className="background-image opacity-30"
      />
      
      {/* Wave overlay for depth */}
      <div className="wave-overlay" />
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 safe-area-top safe-area-bottom">
        
        {/* Header text */}
        <div className="animate-fade-in mb-8 text-center">
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl text-foreground text-shadow tracking-wider">
            BAJAO GHANTI
          </h1>
          <p className="mt-2 text-foreground/80 text-lg sm:text-xl font-body">
            Shake your device or tap the bell
          </p>
        </div>
        
        {/* Bell container */}
        <div 
          className={`bell-wrapper relative no-select ${isRinging ? 'animate-bell-shake' : 'animate-float'}`}
          onClick={handleBellClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && handleBellClick()}
          aria-label="Ring the bell"
        >
          {/* Glow effect behind bell */}
          <div className="absolute inset-0 rounded-full bg-secondary/20 blur-3xl scale-110 animate-glow" />
          
          {/* Bell image */}
          <img 
            src={BELL_IMAGE}
            alt="Campaign Bell"
            className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 object-contain drop-shadow-2xl"
            draggable="false"
          />
          
          {/* Ripple effect when ringing */}
          {showRipple && (
            <div className="ripple-container">
              <div className="ripple animate-ring-ripple" />
            </div>
          )}
        </div>
        
        {/* Ring counter */}
        <div className="mt-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="glass-card rounded-full px-6 py-3 text-center">
            <p className="text-foreground text-lg font-medium font-body">
              {ringCount === 0 ? (
                <>
                  <span className="animate-bounce-slow inline-block">👆</span>
                  {" "}Tap to ring
                </>
              ) : (
                <>
                  Rang <span className="font-display text-2xl">{ringCount}</span> {ringCount === 1 ? 'time' : 'times'}
                </>
              )}
            </p>
          </div>
        </div>
        
        {/* Instructions for mobile */}
        {!hasMotionPermission && typeof DeviceMotionEvent !== "undefined" && (
          <div className="mt-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button 
              onClick={() => setShowPermissionDialog(true)}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body font-semibold px-6 py-3 rounded-full shadow-lg"
            >
              Enable Shake to Ring
            </Button>
          </div>
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <p className="text-foreground/70 text-sm font-body animate-pulse">
              Loading sound...
            </p>
          </div>
        )}
      </div>
      
      {/* Permission Dialog */}
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent className="glass-card border-foreground/20 text-foreground max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="text-foreground font-display text-2xl tracking-wide">
              Enable Motion
            </DialogTitle>
            <DialogDescription className="text-foreground/80 font-body">
              Allow motion access to ring the bell by shaking your device
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button 
              onClick={requestMotionPermission}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body font-semibold w-full"
            >
              Allow Motion
            </Button>
            <Button 
              variant="ghost"
              onClick={() => setShowPermissionDialog(false)}
              className="text-foreground/70 hover:text-foreground hover:bg-foreground/10 font-body w-full"
            >
              Maybe Later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
