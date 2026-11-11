"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  User,
} from "lucide-react";
import { toast } from "sonner";

export default function VideoCall({ sessionId, token }) {
  const [isLoading, setIsLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isPublisherReady, setIsPublisherReady] = useState(false);
  const [hasRemoteStream, setHasRemoteStream] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const sessionRef = useRef(null);
  const publisherRef = useRef(null);
  const initializedRef = useRef(false);

  const router = useRouter();
  const appId = process.env.NEXT_PUBLIC_VONAGE_APPLICATION_ID;

  const cleanupSession = useCallback(() => {
    if (publisherRef.current) {
      try {
        publisherRef.current.destroy();
      } catch {
        // Ignore cleanup errors on unmount
      }
      publisherRef.current = null;
    }
    if (sessionRef.current) {
      try {
        sessionRef.current.disconnect();
      } catch {
        // Ignore cleanup errors on unmount
      }
      sessionRef.current = null;
    }
    initializedRef.current = false;
  }, []);

  const initializeSession = useCallback(() => {
    if (initializedRef.current) return;
    if (!appId || !sessionId || !token) {
      toast.error("Missing required video call parameters");
      setIsLoading(false);
      return;
    }
    if (typeof window === "undefined" || !window.OT) {
      return;
    }

    initializedRef.current = true;

    try {
      const session = window.OT.initSession(appId, sessionId);
      sessionRef.current = session;

      session.on("streamCreated", (event) => {
        setHasRemoteStream(true);
        session.subscribe(
          event.stream,
          "subscriber",
          {
            insertMode: "append",
            width: "100%",
            height: "100%",
          },
          (error) => {
            if (error) {
              toast.error("Error connecting to other participant's stream");
            }
          }
        );
      });

      session.on("streamDestroyed", () => {
        setHasRemoteStream(false);
      });

      session.on("sessionDisconnected", () => {
        setIsConnected(false);
        setIsPublisherReady(false);
        setHasRemoteStream(false);
      });

      session.connect(token, (connectError) => {
        if (connectError) {
          console.error("Session connect error:", connectError);
          toast.error("Error connecting to video session");
          setIsLoading(false);
          return;
        }

        setIsConnected(true);
        setIsLoading(false);

        const publisher = window.OT.initPublisher(
          "publisher",
          {
            insertMode: "append",
            width: "100%",
            height: "100%",
            publishAudio: true,
            publishVideo: true,
          },
          (pubInitErr) => {
            if (pubInitErr) {
              console.error("Publisher init error:", pubInitErr);
              toast.error("Unable to access camera or microphone. Please check browser permissions.");
              return;
            }

            publisherRef.current = publisher;
            setIsPublisherReady(true);

            if (sessionRef.current) {
              sessionRef.current.publish(publisher, (publishErr) => {
                if (publishErr) {
                  console.error("Publish error:", publishErr);
                  toast.error("Error publishing your video stream");
                }
              });
            }
          }
        );
      });
    } catch (error) {
      console.error("Video init error:", error);
      toast.error("Failed to initialize video call");
      setIsLoading(false);
      initializedRef.current = false;
    }
  }, [appId, sessionId, token]);

  const handleScriptLoad = () => {
    setScriptLoaded(true);
    if (!window.OT) {
      toast.error("Failed to load Vonage Video API");
      setIsLoading(false);
      return;
    }
    initializeSession();
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.OT) {
      setScriptLoaded(true);
      initializeSession();
    }
    return () => {
      cleanupSession();
    };
  }, [initializeSession, cleanupSession]);

  const toggleVideo = () => {
    if (publisherRef.current) {
      const next = !isVideoEnabled;
      publisherRef.current.publishVideo(next);
      setIsVideoEnabled(next);
    }
  };

  const toggleAudio = () => {
    if (publisherRef.current) {
      const next = !isAudioEnabled;
      publisherRef.current.publishAudio(next);
      setIsAudioEnabled(next);
    }
  };

  const endCall = () => {
    cleanupSession();
    router.push("/appointments");
  };

  if (!sessionId || !token || !appId) {
    return (
      <div className="container mx-auto px-4 py-14 text-center max-w-lg">
        <div className="bg-white border border-slate-200 rounded-lg p-8 space-y-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold italic tracking-tight bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-transparent inline-block px-1">
            Invalid Video Call
          </h1>
          <div className="mx-auto h-1 w-20 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600" />
          <p className="text-sm text-slate-600">
            Missing required video call parameters or Vonage configuration.
          </p>
          <Button
            onClick={() => router.push("/appointments")}
            className="bg-black hover:bg-neutral-900 text-white rounded-md font-semibold h-10 px-5 text-sm shadow-none cursor-pointer"
          >
            Back to Appointments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://unpkg.com/@vonage/client-sdk-video@latest/dist/js/opentok.js"
        onLoad={handleScriptLoad}
        onError={() => {
          toast.error("Failed to load video call script");
          setIsLoading(false);
        }}
      />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-extrabold italic tracking-tight bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-transparent inline-block px-1">
            Video Consultation
          </h1>
          <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600" />
          <p className="text-sm text-slate-600 mt-2.5 font-medium">
            {isConnected
              ? "Connected"
              : isLoading
              ? "Connecting to session..."
              : "Connection failed"}
          </p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 text-black text-sm font-bold flex items-center justify-between">
                <span>You</span>
                <span className="text-xs font-medium text-slate-500">
                  {isPublisherReady ? "Live" : "Starting camera..."}
                </span>
              </div>
              <div
                id="publisher"
                className="relative w-full h-[300px] md:h-[400px] bg-slate-950"
              >
                {(!scriptLoaded || !isPublisherReady) && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 pointer-events-none">
                    <div className="bg-slate-800/80 border border-slate-700 rounded-full p-6 mb-2">
                      {isLoading ? (
                        <Loader2 className="h-10 w-10 animate-spin text-white" />
                      ) : (
                        <User className="h-10 w-10 text-slate-300" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {isLoading ? "Preparing camera..." : "Camera inactive"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 text-black text-sm font-bold flex items-center justify-between">
                <span>Other Participant</span>
                <span className="text-xs font-medium text-slate-500">
                  {hasRemoteStream ? "Connected" : "Waiting..."}
                </span>
              </div>
              <div
                id="subscriber"
                className="relative w-full h-[300px] md:h-[400px] bg-slate-950"
              >
                {!hasRemoteStream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 pointer-events-none">
                    <div className="bg-slate-800/80 border border-slate-700 rounded-full p-6 mb-2">
                      <User className="h-10 w-10 text-slate-300" />
                    </div>
                    <p className="text-xs text-slate-400">
                      Waiting for the other participant to join...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center items-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={toggleVideo}
              className={`rounded-full p-4 h-13 w-13 cursor-pointer shadow-none ${
                isVideoEnabled
                  ? "bg-white border-slate-300 text-black hover:bg-slate-100"
                  : "bg-slate-100 border-slate-300 text-rose-600 hover:bg-slate-200"
              }`}
              disabled={!isPublisherReady}
              title={isVideoEnabled ? "Turn camera off" : "Turn camera on"}
            >
              {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={toggleAudio}
              className={`rounded-full p-4 h-13 w-13 cursor-pointer shadow-none ${
                isAudioEnabled
                  ? "bg-white border-slate-300 text-black hover:bg-slate-100"
                  : "bg-slate-100 border-slate-300 text-rose-600 hover:bg-slate-200"
              }`}
              disabled={!isPublisherReady}
              title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
            >
              {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>

            <Button
              variant="destructive"
              size="lg"
              onClick={endCall}
              className="rounded-full p-4 h-13 w-13 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-none"
              title="End call"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>

          <div className="text-center space-y-1">
            <p className="text-slate-700 text-sm font-medium">
              {isVideoEnabled ? "Camera on" : "Camera off"} •{" "}
              {isAudioEnabled ? "Microphone on" : "Microphone off"}
            </p>
            <p className="text-slate-500 text-xs">
              Click the red phone button when you finish your consultation
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
