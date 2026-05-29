import { useMemo, useState } from "react";
import { parseLead, splitLeads } from "@/lib/lead-identity/parser";
import { useIdentityStore } from "@/lib/lead-identity/store";
import { useApp } from "@/lib/store";
import { useMountedNow } from "@/hooks/use-now";
import type { MatchResult, ParsedLeadDraft } from "@/lib/lead-identity/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ListPlus, ShieldCheck, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Row {
  draft: ParsedLeadDraft;
  match: MatchResult;
  selected: boolean;
}

const matchColor = (t: MatchResult["type"]) =>
  t === "exact" ? "bg-destructive/10 text-destructive border-destructive/30"
  : t === "strong" ? "bg-warning/10 text-warning border-warning/30"
  : t === "possible" ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
  : "bg-primary/10 text-primary border-primary/30";

export function BulkPasteImport() {
  const checkDuplicates = useIdentityStore((s) => s.checkDuplicates);
  const createLead = useIdentityStore((s) => s.createLead);
  const { leads, followUps, setLeadFollowUp, selectLead } = useApp();
  const [now] = useMountedNow();
  const [raw, setRaw] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [overdueSelected, setOverdueSelected] = useState<Set<string>>(new Set());

  const overdueItems = useMemo(() => {
    return followUps
      .filter((f) => !f.done && +new Date(f.dueAt) < now)
      .map((f) => {
        const lead = leads.find((l) => l.id === f.leadId);
        return lead ? { followUp: f, lead } : null;
      })
      .filter((x): x is NonNullable<typeof x> => !!x);
  }, [followUps, leads, now]);

  const onParse = () => {
    const chunks = splitLeads(raw);
    const drafts = chunks.map(parseLead).filter((d): d is ParsedLeadDraft => !!d);
    if (!drafts.length) { toast.error("No leads detected in pasted text"); return; }
    const next: Row[] = drafts.map((d) => {
      const m = checkDuplicates(d);
      return { draft: d, match: m, selected: m.type !== "exact" };
    });
    setRows(next);
    toast.success(`Parsed ${next.length} leads`);
  };

  const onImport = () => {
    let created = 0;
    for (const r of rows) {
      if (!r.selected || r.match.type === "exact") continue;
      createLead(r.draft);
      created++;
    }
    toast.success(`Imported ${created} leads`);
    setRaw(""); setRows([]);
  };

  const toggle = (i: number) =>
    setRows((rs) => rs.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r));

  const toggleOverdue = (leadId: string) => {
    setOverdueSelected((prev) => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  };

  const selectAllOverdue = () => {
    setOverdueSelected(new Set(overdueItems.map((x) => x.lead.id)));
  };

  const bumpSelectedOverdue = () => {
    const slot = new Date(now);
    slot.setDate(slot.getDate() + 1);
    slot.setHours(10, 0, 0, 0);
    const iso = slot.toISOString();
    let n = 0;
    for (const { lead, followUp } of overdueItems) {
      if (!overdueSelected.has(lead.id)) continue;
      setLeadFollowUp(lead.id, iso, "high", `Bulk reschedule: ${followUp.reason}`);
      n++;
    }
    toast.success(`Rescheduled ${n} overdue follow-up${n === 1 ? "" : "s"}`);
    setOverdueSelected(new Set());
  };

  return (
    <div className="space-y-3">
      {overdueItems.length > 0 && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2 text-destructive">
            <Clock className="h-4 w-4" /> Overdue leads · bulk reschedule
          </h3>
          <p className="text-xs text-muted-foreground">
            {overdueItems.length} follow-up{overdueItems.length > 1 ? "s" : ""} past due. Select leads and bump to tomorrow 10:00.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={selectAllOverdue}>Select all</Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={overdueSelected.size === 0}
              onClick={bumpSelectedOverdue}
            >
              Bump {overdueSelected.size || "selected"} to tomorrow
            </Button>
          </div>
          <div className="rounded-lg border border-border bg-card overflow-hidden max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2 w-10" />
                  <th className="text-left px-3 py-2">Lead</th>
                  <th className="text-left px-3 py-2">Reason</th>
                  <th className="text-left px-3 py-2">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {overdueItems.map(({ lead, followUp }) => (
                  <tr key={followUp.id} className="hover:bg-muted/20">
                    <td className="px-3 py-2">
                      <Checkbox
                        checked={overdueSelected.has(lead.id)}
                        onCheckedChange={() => toggleOverdue(lead.id)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="font-medium hover:text-primary text-left"
                        onClick={() => selectLead(lead.id)}
                      >
                        {lead.name}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">{followUp.reason}</td>
                    <td className="px-3 py-2 text-xs font-mono text-destructive">
                      {formatDistanceToNow(new Date(followUp.dueAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <ListPlus className="h-4 w-4 text-primary" /> Bulk paste
        </h3>
        <Textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="Paste an entire spreadsheet or WhatsApp dump — multiple leads at once."
          className="min-h-32 font-mono text-xs"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={onParse} disabled={!raw.trim()}>Parse all</Button>
          {rows.length > 0 && (
            <Button size="sm" variant="default" className="gap-1" onClick={onImport}>
              <ShieldCheck className="h-3.5 w-3.5" /> Import {rows.filter((r) => r.selected && r.match.type !== "exact").length} leads
            </Button>
          )}
        </div>
      </div>

      {rows.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 w-10"></th>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2">Phone</th>
                <th className="text-left px-3 py-2">Area · Zone</th>
                <th className="text-left px-3 py-2">Match</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={r.selected}
                      disabled={r.match.type === "exact"}
                      onChange={() => toggle(i)}
                    />
                  </td>
                  <td className="px-3 py-2">{r.draft.name || <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.draft.phone || "—"}</td>
                  <td className="px-3 py-2 text-xs">{r.draft.location || "—"} {r.draft.zone && <span className="text-muted-foreground">· {r.draft.zone}</span>}</td>
                  <td className="px-3 py-2">
                    <Badge variant="outline" className={`text-[10px] capitalize ${matchColor(r.match.type)}`}>
                      {r.match.type} · {r.match.topScore}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
