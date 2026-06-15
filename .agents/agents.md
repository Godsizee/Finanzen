---
trigger: always_on
---

# Coding-Agent — FairShare / Finanzen

## 0. Workspace-Struktur

Dieser Workspace besteht aus **zwei Ordnern**:

| Rolle | Pfad |
|---|---|
| **Code-Projekt** (auf GitHub gespiegelt) | `c:\xampp\htdocs\files\Finanzen\` |
| **Obsidian Vault** (Doku, Notizen, TODOs) | `C:\Users\bades\OneDrive\Desktop\Ideen\` |

Projektordner im Vault: `Projekte\finanzen\`

---

### Session-Protokoll (Pflicht — keine Ausnahmen)

**Zu Beginn jeder Session — als allererste Aktion:**

Lese:
```
C:\Users\bades\OneDrive\Desktop\Ideen\Projekte\finanzen\Recent.md
```

**Am Ende jeder Session — als allerletzte Aktion:**

Schreibe oben in `Recent.md` (neueste Einträge zuerst):

```markdown
## YYYY-MM-DD (Kurztitel der Arbeit)

### Kontext
Ein Satz: Was war der Ausgangspunkt / Wunsch des Nutzers?

### Neue Dateien
- `pfad/datei.ext` — Warum?

### Geänderte Dateien
- `pfad/datei.ext` — Was und warum?

### Ausgeführte Aktionen
- `<befehl>`: ✅/❌ Ergebnis

### Offene Punkte / Nächste Aufgaben
- [ ] Was noch fehlt
```

---

### Vault-Struktur für dieses Projekt

| Inhalt | Pfad (relativ zu Vault-Root) |
|---|---|
| Session-Log | `Projekte\finanzen\Recent.md` |
| Technische Dokumentation | `Projekte\finanzen\Documentation.md` |
| Tasks / TODOs | `Projekte\finanzen\tasks\` |

---

## Obsidian Vault Konventionen

### Dateinamen

- Dashboards/Indizes: `00_<Bereich>_Dashboard.md`
- Themennotizen: `PascalCase` oder `Unter_strichen` — **keine Leerzeichen**
- Ordner: ebenfalls `PascalCase` oder `Unter_strichen`

### Frontmatter (Pflicht für neue Notizen)

```yaml
---
tags: [Finanzen, <thema>]
aliases: ["Alternative Schreibweise"]
created: YYYY-MM-DD
---
```

### Wiki-Links

```markdown
[[DateiName]]                       ← einfacher Link
[[DateiName|Anzeigename]]           ← mit Label
[[DateiName#Abschnittsüberschrift]] ← auf Abschnitt
```

Niemals absolute Pfade (`[[C:\...\Datei]]`).

**Nach jeder neuen Notiz:**
1. Link im Dashboard oder Index eintragen
2. Neue Notiz verlinkt mind. 2–3 verwandte Themen
3. Keine Orphaned Notes

### Callouts

```markdown
> [!note] Hinweis
> [!tip] Tipp
> [!warning] Achtung
> [!example] Beispiel
```

---

## Über die App

Mobile offlinefähige PWA für geteilte Haushaltsfinanzen (FairShare) mit Echtzeit-Sync via PocketBase.

---

## 1. Prioritäten

1. Keine Nutzerdaten verlieren.
2. Kernfunktionalität (Buchung, Abrechnung) zuverlässig halten.
3. Offline-Betrieb sicherstellen.
4. Sicherheit und Datenschutz wahren.
5. Kleine, verständliche und modulare Lösungen bevorzugen.
6. Dokumentation und Konfiguration aktuell halten.

---

## 2. Technischer Rahmen

Verwendete Technologien:
SvelteKit 2, Svelte 5, Vite, TailwindCSS 4, PocketBase, TypeScript, Vitest, PWA

Keine neuen Frameworks oder Bibliotheken einführen, wenn die Aufgabe dies nicht zwingend erfordert.

---

## 3. Wichtige Verzeichnisse

```text
src/
  lib/
    core/          ← PocketBase-Client, globale Stores, Typen
    features/      ← Feature-Module
      auth/
      categories/
      recurring/
      settlements/
      transactions/
        components/
    ui/            ← Shared UI-Komponenten
    assets/
  routes/          ← SvelteKit-Seiten
    add/           ← Neue Transaktion
    edit/[id]/
    history/
    recurring/
    settlements/
    profile/
    login/ register/ onboarding/
```

Vor neuen Dateien immer prüfen, ob bereits ein passendes Modul existiert.

---

## 4. Architekturregeln

- **Offline-First:** Buchungen werden lokal gepuffert (IndexedDB) und bei Verbindung synchronisiert.
- **Feature-Module:** Jedes Feature ist in `src/lib/features/<feature>/` gekapselt.
- **PocketBase als Backend:** Kein eigenes Server-Side-Rendering — adapter-node, API-Calls direkt im Client.
- **Einheitlicher Abrechnungsmodus:** 50/50 oder einkommensbasiert — nur ein aktiver Modus je Paar.
- **Atomare Abrechnung:** Abrechnungen erfolgen über einen serverseitigen Endpunkt (alles oder nichts).
- **Idempotente Fixkosten:** `regel_id + faelligkeitsdatum` als eindeutiger Schlüssel, um Duplikate zu verhindern.

---

## 5. Sicherheit und Datenschutz

- Keine sensiblen Daten im `localStorage` — PocketBase Auth-Token nur in Memory oder `HttpOnly`-Cookie.
- Input-Validierung auf Client (TypeScript-Typen) und PocketBase-Seitenregeln.
- Keine Nutzerdaten an Drittdienste senden.

---

## 6. Arbeitsweise

1. `Recent.md` im Vault lesen (Session-Start).
2. Relevante Dateien lesen.
3. Kleinste vollständige Änderung umsetzen.
4. Tests und Build ausführen.
5. `Recent.md` aktualisieren (Session-Ende).

Keine Tests als erfolgreich bezeichnen, wenn sie nicht ausgeführt wurden.

---

## 7. Prüfkommandos

```bash
npm run dev       # Entwicklungsserver
npm run build     # Produktions-Build
npm run check     # Svelte-Typprüfung
npx vitest run    # Tests
npm run lint      # Linting
```

---

## 8. Fertig-Kriterium

Fertig erst wenn: Funktion umgesetzt · Qualität geprüft · Prüfkommandos grün · `Recent.md` aktualisiert · offene Risiken benannt.

---

## Grundsatz

Die App muss im Alltag zuverlässig buchhalten, auch wenn das Netz offline ist.
