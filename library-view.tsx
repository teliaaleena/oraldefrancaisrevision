import { useSessionStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Library as LibraryIcon,
  ScrollText,
} from "lucide-react";
import { motion } from "framer-motion";
import { RouletteDialog } from "./roulette-dialog";

function formatRelative(ts: number) {
  const diff = Date.now() - ts;
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return "à l'instant";
  if (diff < hour) return `il y a ${Math.floor(diff / min)} min`;
  if (diff < day) return `il y a ${Math.floor(diff / hour)} h`;
  if (diff < 7 * day) return `il y a ${Math.floor(diff / day)} j`;
  return new Date(ts).toLocaleDateString("fr-FR");
}

export function LibraryView() {
  const texts = useSessionStore((s) => s.texts);
  const newText = useSessionStore((s) => s.newText);
  const editText = useSessionStore((s) => s.editText);
  const openText = useSessionStore((s) => s.openText);
  const deleteText = useSessionStore((s) => s.deleteText);

  const sorted = [...texts].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-5xl mx-auto w-full space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <LibraryIcon className="w-7 h-7 text-primary" />
            <h1 className="text-4xl font-serif font-bold text-primary">
              Ma bibliothèque
            </h1>
          </div>
          <p className="text-muted-foreground font-medium">
            Tes passages, problématiques et plans d'oral — tout au même endroit.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RouletteDialog />
          <Button
            onClick={newText}
            size="lg"
            className="font-semibold text-base px-6 h-12 shadow-sm hover-elevate"
          >
            <Plus className="mr-2 w-5 h-5" />
            Nouveau texte
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <Card className="border-dashed bg-card/50 p-12 text-center">
          <ScrollText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">
            Aucun texte pour l'instant
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Ajoute ton premier passage pour commencer ta bibliothèque de
            commentaires oraux.
          </p>
          <Button onClick={newText} className="hover-elevate">
            <Plus className="mr-2 w-4 h-4" />
            Ajouter mon premier texte
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((t, idx) => {
            const completed = t.highlights.filter((h) =>
              h.note.trim(),
            ).length;
            const total = t.highlights.length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const preview = t.rawText
              .replace(/\[(.*?)\]/g, "$1")
              .slice(0, 140)
              .trim();
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card
                  onClick={() => openText(t.id)}
                  className="group relative cursor-pointer p-6 flex flex-col h-full bg-card border shadow-sm hover-elevate transition-shadow hover:shadow-md rounded-xl overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-serif text-xl font-semibold text-foreground leading-tight line-clamp-2">
                      {t.title}
                    </h3>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          editText(t.id);
                        }}
                        aria-label="Modifier le texte"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Supprimer le texte"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent
                          onClick={(e) => e.stopPropagation()}
                        >
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Supprimer « {t.title} » ?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Ce texte et toutes les notes associées seront
                              supprimés définitivement. Cette action est
                              irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteText(t.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground font-serif italic leading-relaxed line-clamp-3 mb-5 flex-1">
                    {preview || "Aucun contenu"}
                    {t.rawText.length > 140 ? "…" : ""}
                  </p>

                  <div className="space-y-3 mt-auto">
                    <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-muted-foreground">
                      <span>
                        {completed}/{total} phrases
                      </span>
                      <span>{formatRelative(t.updatedAt)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary font-semibold pt-1">
                      <BookOpen className="w-4 h-4" />
                      Ouvrir
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
