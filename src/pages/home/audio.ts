import { useState, useEffect } from "react";

export const useAudio = (url: string): any => {
    const [audio] = useState(new Audio(url));
    const [playing, setPlaying] = useState(false);
  
    const toggle = (status?: boolean) => setPlaying(status ?? !playing);
  
    useEffect(() => {
        if (playing) {
          audio.play()
        } else {
          audio.pause()
          audio.currentTime = 0
        }
      },
      [playing]
    );
  
    useEffect(() => {
      audio.addEventListener('ended', () => setPlaying(false));
      return () => {
        audio.removeEventListener('ended', () => setPlaying(false));
      };
    }, []);
  
    return [playing, toggle];
};