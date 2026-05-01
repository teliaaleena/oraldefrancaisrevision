import { useEffect, useState } from "react";
import { useSessionStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Info, Save, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export function ComposeMode() {
  const editingTextId = useSessionStore((s) => s.editingTextId);
  const texts = useSessionStore((s) => s.texts);
  const saveText = useSessionStore((s) => s.saveText);
  const cancelCompose = useSessionStore((s) => s.cancelCompose);
  const openText = useSessionStore((s) => s.openText);

  const editing = editingTextId
    ? texts.find((t) => t.id === editingTextId) || null
    : null;

  const [title, setTitle] = useState(editing?.title ?? "");
  const [rawText, setRawText] = useState(editing?.rawText ?? "");

  useEffect(() => {
    setTitle(editing?.title ?? "");
    setRawText(editing?.rawText ?? "");
  }, [editingTextId]);

  const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length;
  const highlightCount = (rawText.match(/\[(.*?)\]/g) || []).length;

  const canSave = title.trim().length > 0 && rawText.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    saveText(title, rawText);
  };

  const handleSaveAndStudy = () => {
    if (!canSave) return;
    const id = saveText(title, rawText);
    openText(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto w-full space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={cancelCompose}
            className="hover-elevate mt-1"
            aria-label="Retour à la bibliothèque"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-serif font-bold text-primary mb-2">
              {editing ? "Modifier le texte" : "Nouveau texte"}
            </h1>
            <p className="text-muted-foreground font-medium">
              Donne un titre à ton passage et entoure les phrases clés avec des
              [crochets].
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm font-mono bg-card px-4 py-2 rounded-md shadow-sm border">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">
              Mots
            </span>
            <span className="font-semibold text-foreground">{wordCount}</span>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">
              Phrases
            </span>
            <span className="font-semibold text-accent-foreground">
              {highlightCount}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6 shadow-sm space-y-5">
        <div>
          <label
            htmlFor="text-title"
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2"
          >
            Titre
          </label>
          <Input
            id="text-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex. Baudelaire — L'Albatros"
            className="font-serif text-lg h-12"
          />
        </div>

        <div className="flex items-start gap-3 text-sm bg-accent/20 text-accent-foreground p-4 rounded-md border border-accent/30">
          <Info className="w-5 h-5 mt-0.5 text-accent-foreground flex-shrink-0" />
          <div className="space-y-1.5">
            <p>
              Colle le passage ci-dessous. Utilise des{" "}
              <strong>[crochets]</strong> autour des phrases que tu veux
              analyser. Par exemple :{" "}
              <span className="font-mono text-xs bg-background px-1.5 py-0.5 rounded border border-border">
                C'était le [meilleur des temps], c'était le [pire des temps].
              </span>
            </p>
            <p>
              Tu peux aussi noter une correction modèle après une barre{" "}
              <strong>|</strong> :{" "}
              <span className="font-mono text-xs bg-background px-1.5 py-0.5 rounded border border-border">
                [meilleur des temps | antithèse, hyperbole, registre épique]
              </span>
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="text-content"
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-2"
          >
            Passage
          </label>
          <Textarea
            id="text-content"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Colle ton texte ici…"
            className="min-h-[340px] font-serif text-lg leading-relaxed resize-y bg-background border-input focus-visible:ring-primary shadow-inner"
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={!canSave}
            size="lg"
            className="font-medium hover-elevate"
          >
            <Save className="mr-2 w-4 h-4" />
            Enregistrer dans la bibliothèque
          </Button>
          <Button
            onClick={handleSaveAndStudy}
            disabled={!canSave}
            size="lg"
            className="font-semibold text-base px-6 h-12 shadow-sm hover-elevate"
          >
            Enregistrer et étudier
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
