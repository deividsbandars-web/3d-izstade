import { useEffect } from "react";

/**
 * useAmbientSound
 * Atskaņo pilsētas fona trokšņus (vai mūziku).
 * Piezīme: Pārlūkprogrammas prasa lietotāja interakciju (klikšķi), lai sāktu audio.
 */
export function useAmbientSound(url: string = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3") {
  useEffect(() => {
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = 0.2;

    const startAudio = () => {
      audio.play().catch(() => console.log("Audio waiting for interaction..."));
      window.removeEventListener('click', startAudio);
    };

    window.addEventListener('click', startAudio);

    return () => {
      audio.pause();
      window.removeEventListener('click', startAudio);
    };
  }, [url]);
}
