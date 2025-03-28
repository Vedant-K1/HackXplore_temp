import { memo, useEffect, useState } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { AudioRecorder } from "../../lib/audio-recorder";
import cn from "classnames";
import "./control-tray.scss";

interface ControlTrayProps {
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
}

function ControlTray({ isRecording, startRecording, stopRecording }: ControlTrayProps) {
  const [muted, setMuted] = useState(false);
  const [inVolume, setInVolume] = useState(0);
  const [audioRecorder] = useState(() => new AudioRecorder());
  const { client, connected, connect, disconnect } = useLiveAPIContext();

  const toggleMute = () => {
    setMuted(!muted);
  };

  const handleStreamingToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
    if (connected) {
      disconnect();
    } else {
      connect();
    }
  };


  // Use getUserMedia to capture microphone and prevent audio feedback
  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: "audio/pcm;rate=16000",
          data: base64,
        },
      ]);
    };
    if (connected && !muted && audioRecorder) {
      audioRecorder.on("data", onData).on("volume", setInVolume).start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off("data", onData).off("volume", setInVolume);
    };
  }, [connected, client, muted, audioRecorder]);

  return (
    <section className="control-tray">
      <nav className={cn("actions-nav", { disabled: !connected })}>
        <button
          className={cn("action-button mic-button")}
          onClick={toggleMute}
        >
          {!muted ? (
            <span className="material-symbols-outlined filled">mic</span>
          ) : (
            <span className="material-symbols-outlined filled">mic_off</span>
          )}
        </button>
      </nav>

      <div className={cn("connection-container", { connected })}>
        <div className="connection-button-container">
          <button
            className={cn("action-button connect-toggle", { connected })}
            onClick={handleStreamingToggle}
            style={{width: "8vw", textTransform: "capitalize", fontSize: "1.20rem", lineHeight: "0"}}
          >
            {connected ? "Stop Test" : "Start Test"}
            <span className="material-symbols-outlined filled">
              {connected ? "pause" : "play_arrow"}
            </span>
          </button>
        </div>
        <span className="text-indicator">Streaming</span>
      </div>
    </section>
  );
}

export default memo(ControlTray);
