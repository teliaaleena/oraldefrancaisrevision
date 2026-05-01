import { useEffect, useRef, useMemo, useState } from "react";
import {
  useSessionStore,
  countCommentaryFilled,
  COMMENTARY_FIELD_COUNT,
} from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Copy,
  BookOpen,
  ListChecks,
  Mic,
  AlertCircle,
  Lock,
  Check,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { CommentaryPlan } from "./commentary-plan";
import { Switch } from "@/components/ui/switch";
import { OralSimulation } from "./oral-simulation";

export function StudyMode() {
  const texts = useSessionStore((s) => s.texts);
  const activeTextId = useSessionStore((s) => s.activeTextId);
  const activeHighlightId = useSessionStore((s) => s.activeHighlightId);
  const openLibrary = useSessionStore((s) => s.openLibrary);
  const updateNote = useSessionStore((s) => s.updateNote);
  const setActiveHighlight = useSessionStore((s) => s.setActiveHighlight);
  const markCompletedAndNext = useSessionStore((s) => s.markCompletedAndNext);
  const goPrev = useSessionStore((s) => s.goPrev);
  const goNext = useSessionStore((s) => s.goNext);
  const getMissing = useSessionStore((s) => s.getMissing);

  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [missingOpen, setMissingOpen] = useState(false);
  const [simOpen, setSimOpen] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [ghostMode, setGhostMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("oral-revision-ghost-mode") === "1";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("oral-revision-ghost-mode", ghostMode ? "1" : "0");
  }, [ghostMode]);

  const text = texts.find((t) => t.id === activeTextId);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // When user opens a different text, reset step to where they left off
  useEffect(() => {
    if (!text) return;
    const c = text.commentary;
    const cadreDone = !!(
      c.problematique.trim() &&
      c.mouvements.trim() &&
      c.introduction.trim()
    );
    const phrasesDone =
      text.highlights.length > 0 &&
      text.highlights.every((h) => h.note.trim().length > 0);
    setStep(phrasesDone ? 3 : cadreDone ? 2 : 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTextId]);

  // Focus textarea when active highlight changes (only in step 2)
  useEffect(() => {
    if (activeHighlightId && textareaRef.current && step === 2) {
      textareaRef.current.focus();
    }
    setShowCorrection(false);
  }, [activeHighlightId, step]);

  const handleHighlightClick = (id: string) => {
    if (step < 2) {
      toast({
        title: "Termine d'abord l'étape 1",
        description:
          "Remplis problématique, mouvements et introduction avant d'analyser les phrases.",
      });
      return;
    }
    setActiveHighlight(id);
  };

  // Keyboard shortcuts (only active in step 2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (step !== 2) return;
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        markCompletedAndNext();
      } else if (e.key === "ArrowUp" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowDown" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [markCompletedAndNext, goPrev, goNext, step]);

  const renderedText = useMemo(() => {
    if (!text) return null;
    const regex = /\[(.*?)\]/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let highlightIndex = 0;
    let match;

    while ((match = regex.exec(text.rawText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {text.rawText.slice(lastIndex, match.index)}
          </span>,
        );
      }
      const h = text.highlights[highlightIndex];
      if (h) {
        const isActive = h.id === activeHighlightId;
        const isCompleted = h.note.trim().length > 0;
        parts.push(
          <span
            key={`highlight-${h.id}`}
            onClick={() => handleHighlightClick(h.id)}
            className={cn(
              "text-highlight",
              !isActive && !isCompleted && "text-highlight-untouched",
              isActive && "text-highlight-active",
              !isActive && isCompleted && "text-highlight-completed",
            )}
          >
            {h.text}
          </span>,
        );
      }
      highlightIndex++;
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.rawText.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>{text.rawText.slice(lastIndex)}</span>,
      );
    }
    return parts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, activeHighlightId]);

  if (!text) {
    return (
      <div className="max-w-4xl mx-auto w-full p-12 text-center">
        <p className="text-muted-foreground mb-4">Ce texte n'est plus disponible.</p>
        <Button onClick={openLibrary}>Retour à la bibliothèque</Button>
      </div>
    );
  }

  const completedHighlights = text.highlights.filter((h) =>
    h.note.trim(),
  ).length;
  const totalHighlights = text.highlights.length;
  const filledCommentary = countCommentaryFilled(text.commentary);
  const totalUnits = totalHighlights + COMMENTARY_FIELD_COUNT;
  const completedUnits = completedHighlights + filledCommentary;
  const progress = totalUnits > 0 ? (completedUnits / totalUnits) * 100 : 0;
  const isAllComplete = totalUnits > 0 && completedUnits === totalUnits;

  const wordsWritten = (() => {
    let n = text.highlights.reduce(
      (acc, h) => acc + h.note.trim().split(/\s+/).filter(Boolean).length,
      0,
    );
    const c = text.commentary;
    const all: string[] = [
      c.problematique,
      c.mouvements,
      c.introduction,
      c.conclusion,
      c.part1.intro,
      c.part1.transition,
      c.part1.miniConclusion,
      c.part2.intro,
      c.part2.transition,
      c.part2.miniConclusion,
      c.part3.intro,
      c.part3.transition,
      c.part3.miniConclusion,
    ];
    for (const v of all) {
      n += v.trim().split(/\s+/).filter(Boolean).length;
    }
    return n;
  })();

  const activeHighlight = text.highlights.find((h) => h.id === activeHighlightId);
  const activeIndex = text.highlights.findIndex(
    (h) => h.id === activeHighlightId,
  );

  const cadre = text.commentary;
  const step1Done = !!(
    cadre.problematique.trim() &&
    cadre.mouvements.trim() &&
    cadre.introduction.trim()
  );
  const step2Done =
    totalHighlights > 0 && completedHighlights === totalHighlights;
  const maxStep: 1 | 2 | 3 = step2Done ? 3 : step1Done ? 2 : 1;

  const goToStep = (target: 1 | 2 | 3) => {
    if (target > maxStep) {
      toast({
        title: `Termine d'abord l'étape ${target - 1}`,
        description:
          target === 2
            ? "Remplis problématique, mouvements et introduction."
            : "Termine l'analyse de toutes les phrases entre crochets.",
      });
      return;
    }
    setStep(target);
  };

  const STEP_META: { n: 1 | 2 | 3; label: string; sub: string }[] = [
    { n: 1, label: "Cadre", sub: "Problématique, mouvements, intro" },
    { n: 2, label: "Phrases", sub: "Analyse des passages [entre crochets]" },
    { n: 3, label: "Synthèse", sub: "Parties et conclusion" },
  ];

  const copyToClipboard = () => {
    const c = text.commentary;
    const lines: string[] = [];
    lines.push(`# ${text.title}`);
    lines.push("");
    lines.push("## Phrases");
    text.highlights.forEach((h, i) => {
      lines.push(`${i + 1}. "${h.text}"`);
      lines.push(h.note || "(pas d'analyse)");
      lines.push("");
    });
    lines.push("## Plan d'oral");
    lines.push("");
    lines.push("### Problématique");
    lines.push(c.problematique || "(vide)");
    lines.push("");
    lines.push("### Mouvements");
    lines.push(c.mouvements || "(vide)");
    lines.push("");
    lines.push("### Introduction");
    lines.push(c.introduction || "(vide)");
    lines.push("");
    const partLabels: [keyof typeof c & ("part1" | "part2" | "part3"), string][] = [
      ["part1", "Mouvement 1"],
      ["part2", "Mouvement 2"],
      ["part3", "Mouvement 3"],
    ];
    for (const [k, label] of partLabels) {
      const p = c[k];
      lines.push(`### ${label}`);
      lines.push(`Analyse : ${p.intro || "(vide)"}`);
      lines.push(`Mini-conclusion : ${p.miniConclusion || "(vide)"}`);
      lines.push(`Transition : ${p.transition || "(vide)"}`);
      lines.push("");
    }
    lines.push("### Conclusion");
    lines.push(c.conclusion || "(vide)");
    navigator.clipboard.writeText(lines.join("\n"));
    toast({
      title: "Copié dans le presse-papiers",
      description: "Ton plan complet est prêt à être collé.",
    });
  };

  const handleCheckMissing = () => {
    setMissingOpen(true);
  };

  const missing = getMissing(text.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto w-full h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="hover-elevate shrink-0"
            onClick={openLibrary}
            aria-label="Retour à la bibliothèque"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h2 className="font-serif text-xl font-semibold text-primary truncate">
              {text.title}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">
              {completedHighlights}/{totalHighlights} phrases ·{" "}
              {filledCommentary}/{COMMENTARY_FIELD_COUNT} champs du plan ·{" "}
              {wordsWritten} mots écrits
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-3 flex-1 sm:flex-none max-w-[260px] sm:max-w-none">
            <div className="text-sm font-medium text-muted-foreground w-12 text-right">
              {Math.round(progress)}%
            </div>
            <div className="w-full sm:w-40">
              <Progress value={progress} className="h-2" />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckMissing}
            className="hover-elevate font-medium shrink-0"
          >
            <ListChecks className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Vérifier les oublis</span>
            <span className="sm:hidden">Oublis</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSimOpen(true)}
            className="hover-elevate font-medium shrink-0"
          >
            <Mic className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Simulation</span>
          </Button>
          <Button
            variant={isAllComplete ? "default" : "outline"}
            size="sm"
            onClick={copyToClipboard}
            className="hover-elevate font-medium shrink-0"
          >
            <Copy className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Exporter</span>
          </Button>
        </div>
      </div>

      <OralSimulation text={text} open={simOpen} onClose={() => setSimOpen(false)} />

      {/* Stepper */}
      <div className="mb-6">
        <ol className="flex items-stretch gap-2 sm:gap-3">
          {STEP_META.map((s, i) => {
            const isCurrent = s.n === step;
            const isDone = s.n < maxStep;
            const isLocked = s.n > maxStep;
            return (
              <li key={s.n} className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => goToStep(s.n)}
                  className={cn(
                    "w-full text-left rounded-xl border p-3 sm:p-4 transition shadow-sm hover-elevate",
                    isCurrent
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card",
                    isLocked && "opacity-60",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
                        isCurrent &&
                          "bg-primary text-primary-foreground",
                        isDone &&
                          !isCurrent &&
                          "bg-emerald-100 text-emerald-700",
                        isLocked && "bg-muted text-muted-foreground",
                        !isCurrent &&
                          !isDone &&
                          !isLocked &&
                          "bg-muted text-foreground",
                      )}
                    >
                      {isLocked ? (
                        <Lock className="w-4 h-4" />
                      ) : isDone ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                        Étape {s.n}
                      </div>
                      <div className="text-sm sm:text-base font-semibold truncate">
                        {s.label}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate hidden sm:block">
                        {s.sub}
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Step content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {step === 1 && (
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="mb-4 rounded-xl border bg-accent/20 p-4 text-sm text-foreground/80">
              Commence par poser le cadre : ta problématique, les mouvements
              du texte et ton introduction. Ces trois champs débloqueront
              l'analyse des phrases.
            </div>
            <CommentaryPlan text={text} view="cadre" />
            <div className="sticky bottom-0 -mx-1 mt-4 px-1 py-3 bg-gradient-to-t from-background via-background to-transparent flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {step1Done
                  ? "Étape 1 terminée."
                  : "Remplis problématique, mouvements et introduction pour continuer."}
              </span>
              <Button
                onClick={() => goToStep(2)}
                disabled={!step1Done}
                className="hover-elevate shadow-sm"
              >
                Passer à l'étape 2
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 h-full">
              {/* Left: Text Viewer + live analysis banner */}
              <div className="flex-1 flex flex-col gap-3 min-w-0 min-h-[400px]">
                <Card className="flex-1 flex flex-col bg-card border shadow-sm rounded-xl overflow-hidden relative">
                  <ScrollArea className="flex-1 p-8">
                    <div className="prose prose-lg dark:prose-invert max-w-none font-serif leading-loose text-foreground/90 whitespace-pre-wrap">
                      {renderedText}
                    </div>
                  </ScrollArea>
                </Card>

                {activeHighlight && (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] uppercase tracking-wider font-bold text-primary/80 mb-1">
                          Analyse en cours
                        </div>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                          {activeHighlight.note.trim() || (
                            <span className="italic text-muted-foreground">
                              Commence à écrire à droite pour voir ton analyse
                              s'afficher ici.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Answer Panel */}
              <Card className="w-full lg:w-[400px] xl:w-[450px] flex flex-col bg-card border shadow-sm rounded-xl overflow-hidden shrink-0 min-h-[400px]">
                {activeHighlight ? (
                  <div className="flex flex-col h-full">
                    <div className="p-5 border-b bg-muted/30">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Phrase {activeIndex + 1} sur {totalHighlights}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={goPrev}
                            disabled={activeIndex === 0}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={goNext}
                            disabled={activeIndex === totalHighlights - 1}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="font-serif text-lg font-medium italic text-primary leading-tight">
                        "{activeHighlight.text}"
                      </p>
                    </div>

                    <div className="flex-1 p-5 flex flex-col relative min-h-0">
                      <div className="flex-1 relative min-h-[120px]">
                        {ghostMode && activeHighlight.model && (
                          <div
                            aria-hidden
                            className="absolute inset-0 pointer-events-none select-none whitespace-pre-wrap text-base leading-relaxed font-sans text-foreground/20 overflow-hidden"
                          >
                            {activeHighlight.model}
                          </div>
                        )}
                        <Textarea
                          ref={textareaRef}
                          value={activeHighlight.note}
                          onChange={(e) =>
                            updateNote(
                              text.id,
                              activeHighlight.id,
                              e.target.value,
                            )
                          }
                          placeholder={
                            ghostMode && activeHighlight.model
                              ? ""
                              : "Que révèle cette phrase ? Pourquoi l'auteur a-t-il choisi ces mots ?"
                          }
                          className="absolute inset-0 w-full h-full resize-none border-none shadow-none focus-visible:ring-0 p-0 text-base leading-relaxed placeholder:text-muted-foreground/60 bg-transparent font-sans"
                        />
                      </div>

                      {activeHighlight.model && (
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setShowCorrection((v) => !v)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent-foreground/80 hover:text-accent-foreground transition-colors"
                            >
                              {showCorrection ? (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  Masquer la correction
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  Voir la correction
                                </>
                              )}
                            </button>
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Mode fantôme
                              </span>
                              <Switch
                                checked={ghostMode}
                                onCheckedChange={setGhostMode}
                                aria-label="Activer le mode fantôme"
                              />
                            </label>
                          </div>
                          {showCorrection && (
                            <div className="rounded-lg border border-accent/40 bg-accent/15 px-3 py-2.5">
                              <div className="text-[10px] uppercase tracking-wider font-bold text-accent-foreground/70 mb-1">
                                Correction modèle
                              </div>
                              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                {activeHighlight.model}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                          <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">
                            ⌘
                          </kbd>{" "}
                          +{" "}
                          <kbd className="px-1.5 py-0.5 bg-muted rounded border text-[10px]">
                            Enter
                          </kbd>
                        </span>
                        <Button
                          onClick={markCompletedAndNext}
                          disabled={!activeHighlight.note.trim()}
                          className="hover-elevate shadow-sm"
                        >
                          Enregistrer et suivant
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                    {totalHighlights === 0 ? (
                      <>
                        <BookOpen className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-medium text-lg">
                          Aucune phrase marquée
                        </p>
                        <p className="text-sm mt-2 max-w-[260px]">
                          Modifie ce texte et utilise des [crochets] autour
                          des phrases clés pour les travailler.
                        </p>
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-medium text-lg">
                          Choisis une phrase à analyser
                        </p>
                        <p className="text-sm mt-2 max-w-[200px]">
                          Clique sur une phrase surlignée à gauche pour
                          commencer ton commentaire.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </Card>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => goToStep(1)}
                className="hover-elevate"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Étape 1
              </Button>
              <span className="text-xs text-muted-foreground hidden sm:block">
                {step2Done
                  ? "Étape 2 terminée."
                  : `${completedHighlights}/${totalHighlights} phrases analysées.`}
              </span>
              <Button
                onClick={() => goToStep(3)}
                disabled={!step2Done}
                className="hover-elevate shadow-sm"
              >
                Passer à l'étape 3
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 min-h-0 overflow-auto">
            <div className="mb-4 rounded-xl border bg-accent/20 p-4 text-sm text-foreground/80">
              Dernière étape : développe chaque partie de ton plan et rédige
              ta conclusion avec une ouverture.
            </div>
            <CommentaryPlan text={text} view="synthese" />
            <div className="mt-4 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => goToStep(2)}
                className="hover-elevate"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Étape 2
              </Button>
              {isAllComplete ? (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-2 text-sm font-medium text-emerald-700"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Tu es prêt(e) pour l'oral
                </motion.div>
              ) : (
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {filledCommentary}/{COMMENTARY_FIELD_COUNT} champs du plan
                  remplis.
                </span>
              )}
              <Button
                onClick={copyToClipboard}
                className="hover-elevate shadow-sm"
              >
                <Copy className="w-4 h-4 mr-2" />
                Exporter le plan
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={missingOpen} onOpenChange={setMissingOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              {missing.highlights.length === 0 &&
              missing.commentary.length === 0 ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Tout est rempli
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  Il manque encore
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {missing.highlights.length === 0 &&
              missing.commentary.length === 0
                ? "Tes phrases et tout ton plan d'oral sont complets. À toi de répéter."
                : "Voici ce qui est encore vide. Clique pour y aller directement."}
            </DialogDescription>
          </DialogHeader>

          {(missing.highlights.length > 0 || missing.commentary.length > 0) && (
            <div className="space-y-4 max-h-[50vh] overflow-auto pr-2">
              {missing.highlights.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Phrases ({missing.highlights.length})
                  </h4>
                  <ul className="space-y-1.5">
                    {missing.highlights.map((h) => (
                      <li key={h.id}>
                        <button
                          onClick={() => {
                            if (maxStep < 2) {
                              toast({
                                title: "Termine d'abord l'étape 1",
                                description:
                                  "Remplis problématique, mouvements et introduction.",
                              });
                              return;
                            }
                            setActiveHighlight(h.id);
                            setStep(2);
                            setMissingOpen(false);
                          }}
                          className="w-full text-left text-sm font-serif italic text-foreground/90 hover-elevate rounded-md px-3 py-2 border bg-card"
                        >
                          "{h.text}"
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {missing.commentary.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Plan d'oral ({missing.commentary.length})
                  </h4>
                  <ul className="space-y-1.5">
                    {missing.commentary.map((m, i) => (
                      <li key={i}>
                        <button
                          onClick={() => {
                            const isCadre =
                              m.label === "Problématique" ||
                              m.label === "Mouvements" ||
                              m.label === "Introduction";
                            goToStep(isCadre ? 1 : 3);
                            setMissingOpen(false);
                          }}
                          className="w-full text-left text-sm text-foreground/90 hover-elevate rounded-md px-3 py-2 border bg-card"
                        >
                          {m.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setMissingOpen(false)} className="hover-elevate">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
