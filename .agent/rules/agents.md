---
trigger: always_on
---

FairShare PWA - System Prompt & Agent Instructions

# AI Interaction Rules: Token Optimization & Efficiency

## 1. Response Style & Formatting (Output Token Diät)
- **Strictly No Fluff:** Keine Höflichkeitsfloskeln, kein Smalltalk, keine einleitenden oder abschließenden Sätze (z. B. KEIN "Hier ist der angepasste Code:" oder "Ich hoffe, das hilft!"). Starte direkt mit dem Code oder der Antwort.
- **No Unsolicited Explanations:** Erkläre Codeänderungen oder Logik NIEMALS ungefragt. Der generierte Code muss selbstbeschreibend sein. Erklärungen erfolgen nur, wenn explizit danach gefragt wird ("Warum...", "Erkläre...").
- **Strict Diff Mode:** Generiere niemals eine gesamte Datei neu, wenn sich nur wenige Zeilen ändern. Gib *ausschließlich* den modifizierten Code-Block oder ein präzises Diff-Format aus. Wenn möglich, nutze präzise Zeilen-Kommentare zur Orientierung.

## 2. Code Architecture & Error Handling (Loop-Prevention)
- **KISS & SRP Rules:** Halte Code maximal simpel und modular. Nutze das Single Responsibility Principle. Keine unaufgeforderten Abstraktionen, Wrapper oder Overengineering. Weniger Code = weniger Tokens.
- **Defensive & Stable Selectors:** Verwende bei UI-Interaktionen oder Tests ausschließlich semantische und stabile Selektoren (z. B. `getByRole`, `data-testid`). Vermeide spröde CSS-/XPath-Ketten, um fehlerhafte Test-Schleifen im Keim zu ersticken.
- **Fail-Fast Agent Mode:** Wenn ein autonomer Lösungsansatz (z. B. im Terminal) zweimal hintereinander fehlschlägt, brich die Schleife ab. Rätsele nicht weiter, sondern frage sofort nach manuellem User-Input.

## 3. Context & Reasoning Constraints (Input & Thinking Diät)
- **Minimal Workspace Exploration:** Scanne bei der Fehlersuche nicht selbstständig das gesamte Repository. Beschränke deine Analyse strikt auf die explizit im Kontext bereitgestellten oder erwähnten Dateien.
- **Concise Thinking:** Halte interne Denkprozesse (Reasoning Logs / Chain-of-Thought) im Planning-Modus so kurz und strukturiert wie möglich. Fokussiere dich im "Thinking"-Schritt rein auf die Architektur-Entscheidung, nicht auf Text-Prosa.
Dieses Dokument dient als strikte Handlungsanweisung für alle LLMs und KI-Agenten, die am Quellcode des Projekts "FairShare" (Haushalts-Manager PWA) arbeiten.

PROJEKT-KONTEXT:
FairShare ist eine mobile-first Progressive Web App (PWA) für ein kinderloses Paar zur Verrechnung gemeinsamer Haushaltskosten. Kein gemeinsames Konto, sondern ein fortlaufendes Split- und Settlement-System.

1. Tech-Stack (Zwingend einzuhalten)

Frontend-Framework: SvelteKit (App-Routing).

Komponenten & Reaktivität: Svelte 5 (Ausschließlich Runes: $state, $derived, $effect, $props, snippet). Keine alten Svelte 4 Lifecycle-Hooks oder export let.

Styling: Tailwind CSS (Utility-first). Keine separaten .css Dateien für Komponenten, es sei denn es handelt sich um unumgängliche globale Animationen.

Backend/Datenbank: PocketBase (SQLite, REST-API, SSE).

Icons: Lucide Icons (via lucide-svelte).

2. Architektur & Dateistruktur (Feature-Sliced Design)

Die Anwendung folgt einem domänengetriebenen Ansatz. Code darf nicht nach technischer Funktion (alle Stores zusammen, alle Komponenten zusammen), sondern muss nach Feature sortiert werden.

Erlaubte Struktur (src/lib/):

/ui -> Dumme, rein visuelle Komponenten (Buttons, Inputs, Cards). Dürfen KEINEN State oder Geschäftslogik enthalten.

/features/{domain} -> z.B. /features/transactions/. Enthält alles spezifisch für diese Domäne.

components/ -> Smarte Komponenten, die den Store konsumieren.

store.svelte.ts -> Svelte 5 $state für diese Domäne.

api.ts -> Kapselt alle PocketBase Aufrufe (Repository Pattern).

/core -> Domänenübergreifende Logik (Mathe-Hilfen, Auth-Store, PB-Client).

3. Coding Guidelines (Frontend)

3.1 Svelte 5 Runes

Verwende für globalen State klassenbasierte Runes oder exportierte Konstanten mit $state().

Prop-Drilling ist durch den gezielten Einsatz von Kontext (setContext/getContext) oder importierten State-Modulen zu vermeiden.

Event-Handling über Funktionen in Props übergeben (z.B. onsubmit={() => ...} statt Svelte 4 on:submit).

3.2 Data Fetching & Mutations

UI-Komponenten dürfen niemals direkt mit dem pb (PocketBase) Client interagieren.

Jeder Aufruf muss über eine API-Funktion in lib/features/.../api.ts gehen.

Optimistic UI: Bei Mutationen (Create/Update/Delete) wird zuerst der lokale $state aktualisiert, dann der API-Call abgesetzt. Bei Fehler: Rollback des States und Toast-Notification.

3.3 State & Berechnungen

Beträge (amount) werden immer in Cent (Integer) gespeichert, berechnet und im Store gehalten (z.B. 1550 für 15,50 €).

Währungsformatierung (Intl.NumberFormat) findet ausschließlich im allerletzten Schritt bei der Ausgabe im HTML-Template statt.

4. UI/UX Design System (Tailwind)

Mobile First: Alle Basis-Klassen (z.B. w-full, p-4) gelten für Mobile. Breakpoints (md:, lg:) nur für Desktop-Anpassungen nutzen.

Farbschema: Vertrauenserweckend & minimalistisch.

Hintergrund: bg-slate-50 oder bg-gray-50.

Text: text-slate-900 für Primary, text-slate-500 für Secondary.

Schulden (Negativ): text-red-600.

Guthaben (Positiv): text-emerald-600.

Interaktionen: \* Alle klickbaren Elemente benötigen einen Mindest-Touchbereich von 44px (Apple HIG) oder 48px (Material Design).

Nutze active:scale-95 und transition-transform für taktiles Feedback bei Buttons.

Formulare: Immer HTML5 inputmode (z.B. inputmode="decimal") für das korrekte mobile Keyboard setzen.

5. Dokumentation (Obsidian Vault)
   Erstelle eine Vollständige projektdokumentation.
   Speicherort der Dokumentation: G:\Meine Ablage\Ideen\Projekte\finanzen

Sämtliche Architektur-Entscheidungen, Features und Funktionserklärungen müssen parallel zur Entwicklung als Markdown-Notizen in einem eigens dafür angelegten Obsidian Vault dokumentiert werden. Erstelle eine Vollständige projektdokumentation.

Struktur, Inhalt & Tonalität:

Pro Feature eine Notiz: Jedes Haupt-Feature (z.B. transactions, settlements) erhält eine eigene isolierte Notiz (z.B. Feature - [Name].md).

Verständliche & gut erklärende Sprache: Die Dokumentation darf kein reiner Code-Dump sein. Verwende eine didaktisch wertvolle, gut erklärende und klare Sprache. Beschreibe das "Warum" und das "Wie" anhand von praxisnahen, anschaulichen Beispielen (z. B. "Wenn Person A an der Kasse 100€ zahlt, der Split aber 50/50 ist, rechnet das System...").

Vollständigkeit: Die Dokumentation muss den genauen Zweck des Features, die zugrundeliegende Business-Logik (z.B. Berechnungswege), das Datenbankschema und die API-Schnittstellen lückenlos und verständlich erklären.

Empfohlene Obsidian Plugins für dieses Projekt:

Dataview: Unverzichtbar zur dynamischen Auflistung von Features, API-Endpoints, Datenstrukturen und offenen Todos anhand von Tags (z.B. #feature, #todo) und YAML-Metadaten.

Excalidraw: Perfekt für die Erstellung von visuellen Architektur-Diagrammen, UI-Wireframes und Konzept-Skizzen (z.B. Visualisierung von Zahlungsflüssen) direkt innerhalb der Notizen.

Mermaid (Nativ in Obsidian integriert): Ideal für Ablauf- und Sequenzdiagramme (z.B. "Wie funktioniert der Settlement-Prozess im Detail vom Klick bis zur Datenbankänderung?").

6. System-Regeln für Agenten

OCP (Open-Closed Principle): Schreibe Code so, dass neue Features hinzugefügt werden können, ohne bestehenden Code massiv zu verändern (z.B. Nutzung des metadata JSON-Felds in der DB für zukünftige Erweiterungen).

KISS (Keep It Simple, Stupid): Keine Over-Engineering. Nutze Standard-Svelte und Tailwind. Keine überflüssigen npm-Pakete, wenn 5 Zeilen Vanilla JS das Gleiche tun.

Kommentare: Kommentiere das "Warum" komplexer Logik (z.B. Saldo-Berechnung), nicht das "Was" bei offensichtlichem Code.