import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Pause, Play, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { StudyText } from "@/lib/store";

interface OralSimulationProps {
  text: StudyText;
  open: boolean;
  onClose: () => void;
}

const DURATION_OPTIONS = [
  { label: "5 min", seconds: 5 * 60 },
  { label: "8 min", seconds: 8 * 60 },
  { label: "10 min", seconds: 10 * 60 },
  { label: "12 min", seconds: 12 * 60 },
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export function OralSimulation({ text, open, onClose }: OralSimulationProps) {
  const [duration, setDuration] = useState(DURATION_OPTIONS[0].seconds);
  const [remaining, setRemaining] = useState(duration);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const renderedText = useMemo(() => {
    const regex = /\[(.*?)\]/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let i = 0;
    while ((match = regex.exec(text.rawText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`t-${lastIndex}`}>
            {text.rawText.slice(lastIndex, match.index)}
          </span>,
        );
      }
      parts.push(
        <span
          key={`h-${i}`}
          className="bg-accent text-accent-foreground rounded-md px-1.5 py-0.5 mx-[1px] font-medium"
        >
          {match[1]}
        </span>,
      );
      i++;
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.rawText.length) {
      parts.push(<span key={`t-${lastIndex}`}>{text.rawText.slice(lastIndex)}</span>);
    }
    return parts;
  }, [text.rawText]);

  // Reset state when (re)opened
  useEffect(() => {
    if (open) {
      setRemaining(duration);
      setRunning(false);
      setFinished(false);
    }
  }, [open, duration]);

  // Countdown
  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (intervalRef.current) window.clearInterval(intervalRef.current);
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        if (!finished) setRunning((r) => !r);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, finished]);

  const reset = () => {
    setRemaining(duration);
    setRunning(false);
    setFinished(false);
  };

  const progressPct = duration > 0 ? ((duration - remaining) / duration) * 100 : 0;
  const isLowTime = remaining <= 30 && remaining > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col"
        >
          {/* Header */}
          <div className="border-b bg-card/60 backdrop-blur px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Mic className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-base sm:text-lg truncate">
                  Simulation orale
                </h2>
                <p className="text-xs text-muted-foreground truncate">
                  {text.title} — parle sans tes notes
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Fermer la simulation"
              className="hover-elevate shrink-0"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 max-w-4xl w-full mx-auto px-4 sm:px-8 py-6 flex flex-col gap-6">
            {/* Timer card */}
            <div className="rounded-2xl border bg-card shadow-sm p-6 flex flex-col items-center gap-5">
              <motion.div
                key={isLowTime ? "low" : "normal"}
                animate={
                  isLowTime
                    ? { scale: [1, 1.04, 1] }
                    : { scale: 1 }
                }
                transition={
                  isLowTime
                    ? { duration: 1, repeat: Infinity }
                    : { duration: 0.2 }
                }
                className={cn(
                  "font-mono font-bold tabular-nums text-6xl sm:text-7xl tracking-tight",
                  finished
                    ? "text-destructive"
                    : isLowTime
                      ? "text-destructive"
                      : "text-foreground",
                )}
              >
                {formatTime(remaining)}
              </motion.div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    finished || isLowTime ? "bg-destructive" : "bg-primary",
                  )}
                  initial={false}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {!finished ? (
                  <Button
                    size="lg"
                    onClick={() => setRunning((r) => !r)}
                    className="hover-elevate min-w-[140px]"
                  >
                    {running ? (
                      <>
                        <Pause className="w-5 h-5 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        {remaining === duration ? "Démarrer" : "Reprendre"}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={reset}
                    className="hover-elevate min-w-[140px]"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Recommencer
                  </Button>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  onClick={reset}
                  disabled={remaining === duration && !running}
                  className="hover-elevate"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Réinitialiser
                </Button>
              </div>

              {/* Duration selector */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium mr-1">
                  Durée
                </span>
                {DURATION_OPTIONS.map((opt) => {
                  const active = duration === opt.seconds;
                  return (
                    <button
                      key={opt.seconds}
                      onClick={() => {
                        setDuration(opt.seconds);
                        setRemaining(opt.seconds);
                        setRunning(false);
                        setFinished(false);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors hover-elevate",
                        active
                          ? "bg-primary text-primary-foreground border-transparent"
                          : "bg-card text-foreground/80 border-border",
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {finished && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm font-medium text-destructive"
                >
                  Temps écoulé. Comment ça s'est passé ?
                </motion.p>
              )}
              {!finished && (
                <p className="text-xs text-muted-foreground">
                  Appuie sur{" "}
                  <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">
                    Espace
                  </kbd>{" "}
                  pour démarrer / mettre en pause,{" "}
                  <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">
                    Échap
                  </kbd>{" "}
                  pour quitter
                </p>
              )}
            </div>

            {/* Text card — read-only, notes hidden */}
            <div className="flex-1 min-h-0 rounded-2xl border bg-card shadow-sm flex flex-col overflow-hidden">
              <div className="px-5 py-3 border-b bg-muted/30 text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Texte affiché — tes notes sont cachées
              </div>
              <ScrollArea className="flex-1">
                <div className="p-6 sm:p-8 leading-loose text-foreground/90 whitespace-pre-wrap text-base sm:text-lg">
                  {renderedText}
                </div>
              </ScrollArea>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
