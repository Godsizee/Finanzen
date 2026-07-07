# Skill: Obsidian Vault Protocol — FairShare / Finanzen

## Vault-Pfad

```
C:\Users\bades\OneDrive\Desktop\Ideen\
```

Projektordner: `02 Projekte\FairShare\`

---

## Session-Start: Recent.md lesen

**Immer als erste Aktion.**

```
C:\Users\bades\OneDrive\Desktop\Ideen\02 Projekte\FairShare\Recent.md
```

Optional davor: `_ai\project-context.md` im selben Ordner für kompakten Projektkontext (Stack, Pfade, aktive Baustellen).

Ableiten:
- Was wurde zuletzt geändert?
- Welche `- [ ]` Checkboxen sind offen?
- Laufende Pläne oder Architekturentscheidungen?

---

## Session-Ende: Recent.md schreiben

**Immer als letzte Aktion.** Neuer Block ganz oben.

```markdown
## YYYY-MM-DD (Kurztitel)

### Kontext
Ein Satz zum Ausgangspunkt.

### Neue Dateien
- `pfad/datei.ext` — Warum?

### Geänderte Dateien
- `pfad/datei.ext` — Was und warum?

### Ausgeführte Aktionen
- `<befehl>`: ✅/❌ Ergebnis

### Offene Punkte / Nächste Aufgaben
- [ ] ...
```

**Regeln:**
- Datum immer absolut
- Pfade relativ zum Code-Root
- Nur echte Kommando-Ergebnisse eintragen
- Offene `- [ ]` bleiben, erledigte → `- [x]`

---

## Tasks anlegen

Kein separates `tasks/`-Verzeichnis. Alle Aufgaben leben in:

```
C:\Users\bades\OneDrive\Desktop\Ideen\02 Projekte\FairShare\FairShare_Backlog.md
```

Format: P0–P4-Priorität mit `- [ ]`/`- [x]`-Checklisten je Abschnitt (siehe Datei selbst). Neue Aufgaben unter passende Priorität einsortieren, nicht als eigene Datei.

---

## Vault-Konventionen Kurzreferenz

| Regel | ✅ | ❌ |
|---|---|---|
| Dateinamen | `PascalCase.md` / `Mit_Unterstrich.md` | `mit leerzeichen.md` |
| Links | `[[DateiName]]` | `[[C:\...\Datei.md]]` |
| Frontmatter | `tags`, `aliases`, `created` | fehlendes Frontmatter |
| Nach neuer Notiz | Index/Dashboard updaten | Orphaned Note stehen lassen |
