import { useSessionStore, type StudyText, type PartKey } from "@/lib/store";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Compass, Layers, Mic, Flag } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SectionCardProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: React.ReactNode;
};

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
}: SectionCardProps) {
  return (
    <Card className="bg-card border shadow-sm rounded-xl p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-md bg-accent/30 text-accent-foreground flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-serif text-lg font-semibold text-foreground leading-tight">
            {title}
          </h3>
          {description ? (
            <p className="text-xs text-muted-foreground mt-0.5">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </Card>
  );
}

type FieldProps = {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minRows?: number;
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  minRows = 3,
}: FieldProps) {
  const filled = value.trim().length > 0;
  return (
    <div>
      {label ? (
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </label>
          <span
            className={
              filled
                ? "text-[10px] font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider"
                : "text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider"
            }
          >
            {filled ? "Rempli" : "Vide"}
          </span>
        </div>
      ) : null}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ minHeight: `${minRows * 1.6 + 1}rem` }}
        className="font-serif text-base leading-relaxed resize-y bg-background"
      />
    </div>
  );
}

const PART_META: { key: PartKey; label: string; roman: string }[] = [
  { key: "part1", label: "Mouvement 1", roman: "I" },
  { key: "part2", label: "Mouvement 2", roman: "II" },
  { key: "part3", label: "Mouvement 3", roman: "III" },
];

export type CommentaryPlanView = "all" | "cadre" | "synthese";

export function CommentaryPlan({
  text,
  view = "all",
}: {
  text: StudyText;
  view?: CommentaryPlanView;
}) {
  const updateTop = useSessionStore((s) => s.updateCommentaryTop);
  const updatePart = useSessionStore((s) => s.updateCommentaryPart);
  const c = text.commentary;

  const showCadre = view === "all" || view === "cadre";
  const showSynthese = view === "all" || view === "synthese";

  return (
    <div className="space-y-5 pb-12">
      {showCadre && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SectionCard
              icon={Compass}
              title="Problématique"
              description="La question qui guide ta lecture du texte."
            >
              <Field
                value={c.problematique}
                onChange={(v) => updateTop(text.id, "problematique", v)}
                placeholder="En quoi ce texte... ?"
                minRows={4}
              />
            </SectionCard>

            <SectionCard
              icon={Layers}
              title="Mouvements"
              description="Les mouvements structurels que tu as repérés dans le texte."
            >
              <Field
                value={c.mouvements}
                onChange={(v) => updateTop(text.id, "mouvements", v)}
                placeholder="I. ...&#10;II. ...&#10;III. ..."
                minRows={4}
              />
            </SectionCard>
          </div>

          <SectionCard
            icon={Mic}
            title="Introduction"
            description="Auteur, œuvre, contexte, jusqu'à ta problématique."
          >
            <Field
              value={c.introduction}
              onChange={(v) => updateTop(text.id, "introduction", v)}
              placeholder="Présentation, situation du texte, problématique, annonce du plan..."
              minRows={5}
            />
          </SectionCard>
        </>
      )}

      {showSynthese &&
        PART_META.map((p) => (
          <SectionCard
            key={p.key}
            icon={Layers}
            title={`${p.label} (${p.roman})`}
          >
            <Field
              label="Analyse"
              value={c[p.key].intro}
              onChange={(v) => updatePart(text.id, p.key, "intro", v)}
              placeholder="Analyse détaillée..."
              minRows={4}
            />
            <Field
              label="Mini-conclusion"
              value={c[p.key].miniConclusion}
              onChange={(v) =>
                updatePart(text.id, p.key, "miniConclusion", v)
              }
              placeholder="Bilan de la partie..."
              minRows={2}
            />
            <Field
              label="Transition"
              value={c[p.key].transition}
              onChange={(v) => updatePart(text.id, p.key, "transition", v)}
              placeholder="Vers la partie suivante..."
              minRows={2}
            />
          </SectionCard>
        ))}

      {showSynthese && (
        <SectionCard
          icon={Flag}
          title="Conclusion"
          description="Bilan, réponse à la problématique, ouverture."
        >
          <Field
            value={c.conclusion}
            onChange={(v) => updateTop(text.id, "conclusion", v)}
            placeholder="Bilan général, réponse à la problématique, ouverture..."
            minRows={5}
          />
        </SectionCard>
      )}
    </div>
  );
}
