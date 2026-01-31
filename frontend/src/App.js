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

// Asset URLs - use local files for reliability
const BELL_IMAGE = "https://customer-assets.emergentagent.com/job_0a2d9433-7faf-4a43-8fda-0d77d0443851/artifacts/cd26ldzp_image.png";
const BELL_SOUND = "/bell-sound.mp3";
const BELL_SOUND_FALLBACK = "/bell-sound.mp4";

// Shake detection threshold
const SHAKE_THRESHOLD = 12;
const SHAKE_STOP_DELAY = 150; // ms to wait before stopping sound

function App() {
  const [isShaking, setIsShaking] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [hasMotionPermission, setHasMotionPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ringCount, setRingCount] = useState(0);
  const [showRipple, setShowRipple] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  
  const videoRef = useRef(null);
  const lastAcceleration = useRef({ x: 0, y: 0, z: 0 });
  const shakeTimeout = useRef(null);
  const isPlayingRef = useRef(false);
  
  // Initialize audio/video element
  useEffect(() => {
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
    setIsLoading(false);
    
    return () => {
      if (shakeTimeout.current) {
        clearTimeout(shakeTimeout.current);
      }
    };
  }, []);

  // Handle video can play
  const handleCanPlay = () => {
    setAudioReady(true);
    setIsLoading(false);
  };
  
  // Start playing sound (while shaking)
  const startSound = useCallback(() => {
    if (videoRef.current && !isPlayingRef.current) {
      isPlayingRef.current = true;
      setIsShaking(true);
      setShowRipple(true);
      setRingCount(prev => prev + 1);
      
      videoRef.current.loop = true; // Loop while shaking
      videoRef.current.play().catch((err) => {
        console.log("Audio play failed:", err);
        isPlayingRef.current = false;
      });
    }
  }, []);
  
  // Stop playing sound (when shaking stops)
  const stopSound = useCallback(() => {
    if (videoRef.current && isPlayingRef.current) {
      videoRef.current.pause();
      videoRef.current.loop = false;
      isPlayingRef.current = false;
      setIsShaking(false);
      setShowRipple(false);
    }
  }, []);
  
  // Handle device motion (shake detection) - continuous shake detection
  const handleDeviceMotion = useCallback((event) => {
    const { accelerationIncludingGravity } = event;
    
    if (!accelerationIncludingGravity) return;
    
    const { x, y, z } = accelerationIncludingGravity;
    
    // Calculate acceleration delta
    const deltaX = Math.abs(x - lastAcceleration.current.x);
    const deltaY = Math.abs(y - lastAcceleration.current.y);
    const deltaZ = Math.abs(z - lastAcceleration.current.z);
    
    // Update last acceleration
    lastAcceleration.current = { x, y, z };
    
    // Check if shake detected
    const totalDelta = deltaX + deltaY + deltaZ;
    
    if (totalDelta > SHAKE_THRESHOLD) {
      // Device is shaking - start/continue sound
      startSound();
      
      // Clear any pending stop timeout
      if (shakeTimeout.current) {
        clearTimeout(shakeTimeout.current);
      }
      
      // Set timeout to stop sound if no shake detected
      shakeTimeout.current = setTimeout(() => {
        stopSound();
      }, SHAKE_STOP_DELAY);
    }
  }, [startSound, stopSound]);
  
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
  
  // Handle click/tap on bell - toggle sound for desktop/click testing
  const handleBellClick = () => {
    if (isPlayingRef.current) {
      stopSound();
    } else {
      startSound();
      // Auto-stop after a short duration for click
      setTimeout(() => {
        stopSound();
      }, 1500);
    }
  };
  
  return (
    <div className="app-container bg-background">
      {/* Hidden audio element for sound playback */}
      <audio 
        ref={videoRef}
        preload="auto"
        onCanPlay={handleCanPlay}
        onError={(e) => {
          console.log("Audio source error, trying fallback");
        }}
      >
        <source src={BELL_SOUND} type="audio/mpeg" />
        <source src={BELL_SOUND_FALLBACK} type="video/mp4" />
      </audio>
      
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
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-foreground text-shadow tracking-wider">
            ABKI BAR BALEN SARKAR
          </h1>
          <p className="mt-2 text-foreground/80 text-lg sm:text-xl font-body">
            Shake your device or tap the bell
          </p>
        </div>
        
        {/* Bell container */}
        <div 
          className={`bell-wrapper relative no-select ${isShaking ? 'animate-bell-shake' : 'animate-float'}`}
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
