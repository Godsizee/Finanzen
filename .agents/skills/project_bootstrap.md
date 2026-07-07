# Skill: Project Bootstrap Check — FairShare / Finanzen

Prüft, ob der Zwei-Ordner-Workspace (Code + Vault) intakt ist. Ausführen bei Verdacht auf Doku-Drift oder nach längerer Pause.

## Checkliste

1. **Pfade korrekt?**
   - Code: `c:\xampp\htdocs\files\Finanzen\`
   - Vault: `C:\Users\bades\OneDrive\Desktop\Ideen\02 Projekte\FairShare\`
   - Beide referenziert in `CLAUDE.md`, `.agents\agents.md`, Vault-`AGENTS.md`, `_ai\project-context.md`

2. **Session-Log aktuell?**
   - `Recent.md` hat einen Eintrag aus den letzten paar Sessions
   - Neuester Eintrag hat absolutes Datum (nicht "gestern"/"letzte Woche")

3. **Backlog ↔ Code synchron?**
   - Stichprobe: 2–3 als offen markierte Punkte in `FairShare_Backlog.md` im Code gegenprüfen (grep)
   - Bei Abweichung: Backlog korrigieren, nicht nur Code vertrauen

4. **Kein toter Verweis?**
   - `_ai\project-context.md` referenziert keine gelöschten/umbenannten Dateien
   - Dashboard (`00_FairShare_Dashboard.md`) verlinkt keine verwaisten Notizen

5. **Prüfkommandos laufen?**
   ```bash
   npm run check
   npx vitest run
   ```

## Bei Befund

- Drift gefunden → kurze Korrektur, kein großes Refactoring
- Größere Diskrepanz (z. B. Scope-Entscheidung nicht im Vault nachgezogen) → als Memory/Projektnotiz festhalten, Nutzer nicht stillschweigend übergehen
