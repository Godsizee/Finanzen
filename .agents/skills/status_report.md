# Skill: Status Report — FairShare / Finanzen

Erzeugt eine kompakte Stand-Zusammenfassung aus den drei maßgeblichen Quellen. Nicht raten — jede Quelle wirklich lesen.

## Quellen (in dieser Reihenfolge)

1. `Recent.md` (Vault) — letzte 2–3 Sessions
2. `FairShare_Backlog.md` (Vault) — offene `- [ ]` je Prioritätsstufe
3. Code-Grep für Stichproben, wenn Backlog-Status unsicher ist (siehe [[project_fairshare_doc_drift]] — Vault-Doku kann hinterherhinken)

## Ausgabeformat

```markdown
## Status FairShare (Stand: YYYY-MM-DD)

### Erledigt seit letztem Report
- ...

### Aktuell offen (nach Priorität)
- P0: ...
- P1: ...

### Aktueller Milestone (SaaS-Plan)
- M<n> — <Kurzbeschreibung, Fortschritt>

### Risiken / Blocker
- ...
```

## Regeln

- Nur Punkte aufnehmen, die tatsächlich in einer der drei Quellen belegt sind
- Keine Spekulation über "vermutlich erledigt" ohne Code-Check
- Bei Widerspruch zwischen Vault-Doku und Code: Code gewinnt, Vault-Doku danach korrigieren
