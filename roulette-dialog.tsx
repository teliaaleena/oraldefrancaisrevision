import { useEffect, useRef, useState } from "react";
import { useSessionStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shuffle, Sparkles, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Phase = "idle" | "spinning" | "landed";

export function RouletteDialog() {
  const texts = useSessionStore((s) => s.texts);
  const openText = useSessionStore((s) => s.openText);

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [displayedTitle, setDisplayedTitle] = useState<string>("");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopAll = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  useEffect(() => () => stopAll(), []);

  const startSpin = () => {
    if (texts.length === 0) return;
    stopAll();
    setPhase("spinning");
    setPickedId(null);

    let tick = 0;
    intervalRef.current = setInterval(() => {
      const idx = Math.floor(Math.random() * texts.length);
      setDisplayedTitle(texts[idx].title);
      tick++;
    }, 90);

    const finalIdx = Math.floor(Math.random() * texts.length);
    timeoutRef.current = setTimeout(() => {
      stopAll();
      const final = texts[finalIdx];
      setDisplayedTitle(final.title);
      setPickedId(final.id);
      setPhase("landed");
    }, 1500 + Math.random() * 600);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setPhase("idle");
      setPickedId(null);
      setDisplayedTitle("");
      stopAll();
    } else {
      stopAll();
    }
  };

  const handleGo = () => {
    if (!pickedId) return;
    setOpen(false);
    openText(pickedId);
  };

  const disabled = texts.length === 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          disabled={disabled}
          className="font-semibold text-base px-5 h-12 hover-elevate"
          aria-label="Lancer la roue"
        >
          <Shuffle className="mr-2 w-5 h-5" />
          Roulette
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-2xl">
            <Sparkles className="w-5 h-5 text-primary" />
            Roulette des textes
          </DialogTitle>
          <DialogDescription>
            Laisse le hasard choisir ton prochain texte à travailler.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 min-h-[140px] flex flex-col items-center justify-center rounded-xl border bg-muted/30 px-4 py-8 overflow-hidden">
          <AnimatePresence mode="wait">
            {phase === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-muted-foreground"
              >
                <Shuffle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  Clique sur <strong>Lancer la roue</strong> pour tirer un
                  texte au hasard.
                </p>
              </motion.div>
            )}

            {phase === "spinning" && (
              <motion.div
                key={`spin-${displayedTitle}`}
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -14, opacity: 0 }}
                transition={{ duration: 0.08 }}
                className="text-center"
              >
                <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
                  En cours…
                </p>
                <p className="font-serif text-xl font-semibold text-foreground/80">
                  {displayedTitle || "…"}
                </p>
              </motion.div>
            )}

            {phase === "landed" && (
              <motion.div
                key="landed"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="text-center"
              >
                <p className="text-[10px] uppercase tracking-wider font-bold text-primary mb-2">
                  C'est tombé sur
                </p>
                <p className="font-serif text-2xl font-bold text-primary leading-tight">
                  {displayedTitle}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
          <Button
            variant="outline"
            onClick={startSpin}
            disabled={phase === "spinning" || disabled}
            className="hover-elevate"
          >
            <Shuffle className="w-4 h-4 mr-2" />
            {phase === "landed" ? "Relancer" : "Lancer la roue"}
          </Button>
          <Button
            onClick={handleGo}
            disabled={phase !== "landed" || !pickedId}
            className="hover-elevate shadow-sm"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Ouvrir ce texte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
