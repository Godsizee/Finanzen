Architektur- und Projektplan: Haushalts-Manager PWA ("FairShare")

1. Projektübersicht & Philosophie

"FairShare" ist eine Progressive Web App (PWA) für ein kinderloses Paar mit getrennten Konten. Ziel ist die reibungslose, transparente und faire Verrechnung gemeinsamer Haushaltskosten.

Leitprinzipien der Entwicklung:

Mobile-First & Offline-First: Eingaben müssen in Sekundenbruchteilen möglich sein, auch bei schlechtem Empfang im Supermarkt.

KISS & SRP: Keine überladenen Features. Jede Komponente und jede Backend-Tabelle erfüllt exakt einen Zweck.

Zero-Friction UX: Das Eintragen einer Ausgabe darf maximal 3 Taps dauern.

Klare Zuständigkeiten: Strikte Trennung von UI-Komponenten (Darstellung), State-Management (Logik) und API-Services (Datenbeschaffung).

2. Tech-Stack & Architektur

Die Wahl des Stacks fokussiert sich auf Performance, geringen Wartungsaufwand und exzellente Developer Experience (DX).

2.1 Frontend: SvelteKit + Svelte 5 + Tailwind CSS

SvelteKit (SSG/SPA Modus): Generiert winzige JavaScript-Bundles. Da keine VDOM-Overhead existiert (im Gegensatz zu React), ist die App auf mobilen Geräten extrem performant.

Svelte 5 (Runes): Modernes, reaktives State-Management ($state, $derived). Ermöglicht eine extrem saubere Trennung von Logik und UI.

Tailwind CSS: Utility-First CSS. Garantiert ein konsistentes Design-System, verhindert "totes CSS" und ermöglicht schnelles, responsives Styling ohne komplexe CSS-Architekturen pflegen zu müssen.

Vite PWA Plugin: Generiert automatisiert Service Worker, manifest.json und verwaltet das Offline-Caching von Assets.

2.2 Backend & Datenbank: PocketBase

PocketBase: Eine Open-Source-Lösung, gepackt in eine einzige Go-Binary mit eingebetteter SQLite-Datenbank.

Warum PocketBase? Erfüllt das KISS-Prinzip perfekt. Es eliminiert die Notwendigkeit, ein komplexes Node.js/PostgreSQL-Backend zu schreiben. Es bietet out-of-the-box:

Authentifizierung (E-Mail/Passwort für die 2 Nutzer).

CRUD REST-API.

Realtime Subscriptions via Server-Sent Events (SSE) – wenn Person A einen Bon einträgt, aktualisiert sich das Dashboard von Person B in Echtzeit.

2.3 Deployment & CI/CD (Coolify)

Coolify auf eigenem VPS: Das Deployment wird vollständig über Coolify gemanagt. Coolify agiert hierbei als Self-Hosted PaaS.

Automatisierter Workflow (CI/CD): Jeder Push in den Haupt-Branch (z.B. main) auf GitHub triggert automatisch einen neuen Build- und Deployment-Prozess in Coolify. Manuelle Server-Eingriffe entfallen komplett.

Docker-Isolation: Frontend (als statische PWA serviert) und Backend (PocketBase Container) werden durch Coolify isoliert in separaten Containern orchestriert. Dies garantiert hohe Portabilität und einfache Backups.

2.4 Versionskontrolle & Security (GitHub & .gitignore)

GitHub als Source of Truth: Der gesamte Applikations-Code wird auf GitHub versioniert.

Strikte .gitignore: Es gilt das Prinzip "Least Privilege" für das Repository. Es wird nur der reine Quellcode und Konfigurationen ins Repo gepusht, die zwingend für den Build-Prozess benötigt werden.

Folgende Dateien/Verzeichnisse werden streng blockiert:

pb_data/ (Die tatsächliche SQLite-Datenbank von PocketBase inkl. Userdaten bleibt exklusiv auf dem Produktiv-Server in Coolify gemountet).

.env, .env.\*.local (Sämtliche Umgebungsvariablen, API-Keys und Secrets).

node_modules/, .svelte-kit/, build/, dist/ (Installierte Abhängigkeiten und Build-Artefakte).

DS_Store und betriebssystemspezifische Caches.

3. Datenmodell (PocketBase Schema)

Das relationale Modell trennt strikt zwischen Zahlungsfluss (Wer hat das Geld vorgestreckt?) und Kostenaufteilung (Wer muss die Kosten tragen?). Wir implementieren zudem OCP (Open-Closed Principle) auf Datenebene.

Collection: users (System-Collection)

id, username, email, avatar (Bild)

Collection: categories

id, name, icon, color

Collection: transactions

id

total_amount (Number): Gesamtbetrag in Cent (z.B. 1550 für 15,50 €), verhindert Floating-Point-Fehler.

date (DateTime): Wann die Ausgabe passierte.

category (Relation -> categories)

Zahlungsfluss (Ist-Zustand):

paid_amount_user_a (Number): Betrag in Cent, den Person A beigesteuert hat.

paid_amount_user_b (Number): Betrag in Cent, den Person B beigesteuert hat.

Kostenaufteilung (Soll-Zustand):

split_mode (String): "50_50" oder "custom".

note (String, optional): Bemerkung.

settlement_id (Relation -> settlements, optional): Leer, solange nicht abgerechnet.

metadata (JSON, optional): Der Joker für die Zukunft. Hier landen künftig Dinge wie z.B. {"receipt_url": "...", "ocr_confidence": 0.95, "bank_sync_id": "xyz"}, ohne dass das Datenbankschema geändert werden muss.

Collection: settlements

id, date, amount, from_user, to_user

4. UI/UX & Responsive Design (Frontend)

Das Design-System ist minimalistisch, vertrauenserweckend (Finanzen) und zugänglich.

4.1 Layout-Struktur (Mobile-First)

Mobile: Bottom-Navigation-Bar (Dashboard, Historie, Einstellungen) + Floating Action Button (FAB) zentral über der Bottom-Bar.

Desktop/Tablet: Die Bottom-Bar wandert als Sidebar nach links. Das Layout nutzt CSS-Grid für sauberes Reflow.

4.2 Barrierefreiheit (Accessibility)

Kontrastreiche Farbpalette (z.B. Tailwind slate-900 für Text auf slate-50 Hintergrund).

Formulare nutzen semantische <label>-Elemente und komplette Tastaturbedienbarkeit.

4.3 Ansichten (Views)

Dashboard (/):

Hero-Card: Große, klare Aussage: "Du schuldest Anna 45,50 €".

Quick-Actions: Die letzten 5 Transaktionen.

Add Transaction Modal/Page (/add):

Numpad-optimierte Eingabe für den Gesamtbetrag.

Zahlungs-Toggle: Switch zwischen "Einer zahlt" und "Gemeinsam bezahlt".

Historie & Abrechnung (/history):

Filterbare Monatsansicht und Settlement-Button.

5. Frontend-Architektur (Erweiterbarkeit & Clean Code)

Um Refactoring-Höllen bei zukünftigen Erweiterungen zu vermeiden, nutzen wir ein Feature-Sliced Design und das Repository Pattern. Die Komponenten sind dumm, die Logik ist isoliert.

src/
├── lib/
│ ├── ui/ # Generische, dumme UI-Bausteine (Button, Input, Modal)
│ ├── features/ # Nach Fachdomänen gegliedert (NICHT nach Tech!)
│ │ ├── transactions/ # Alles rund um Ausgaben
│ │ │ ├── components/ # z.B. TransactionCard.svelte
│ │ │ ├── api.ts # Repository Pattern (Kapselt PocketBase-Aufrufe)
│ │ │ └── store.ts # Svelte 5 State ($state) für Transaktionen
│ │ └── settlements/ # Alles rund um Abrechnungen
│ └── core/ # Domänen-unabhängige Logik (Math, Formatter, PocketBase-Client)
├── routes/ # Nur Routing und Page-Assembly

5.1 Das Repository Pattern (Zukunftssicherheit)

Die UI darf niemals pb.collection('transactions').getList() aufrufen. Stattdessen ruft sie transactionApi.getAll() auf.

Der Vorteil: Wenn wir in 2 Jahren von PocketBase auf Supabase wechseln oder eine eigene Node-API schreiben, müssen wir keine einzige Svelte-Komponente anfassen. Wir tauschen nur die api.ts aus (Interface Segregation Principle).

5.2 Logik-Kapselung der Saldo-Berechnung

Die Verrechnung ist in puren, testbaren mathematischen Funktionen gekapselt, die auf den Store zugreifen:

Soll: Berechne den Kostenanteil (total_amount / 2).

Ist: Vergleiche Kostenanteil mit dem tatsächlich gezahlten Betrag (paid_amount_user_a).

Differenz: Bilde das Delta.

6. Zukünftige Erweiterungen (Roadmap & Ideen)

Durch die beschriebene Architektur (Metadata-JSON, Feature-Slicing, API-Abstraktion) ist das System optimal vorbereitet für:

Intelligente Belegerkennung (OCR):

Ein Foto-Upload beim Eintragen. Ein Cloud-Function/n8n-Webhook parst den Kassenbon via KI (z.B. OpenAI Vision API) und trägt Betrag und Kategorie automatisch ein.

Architektur-Vorteil: Das Foto und die KI-Metadaten landen einfach im existierenden metadata JSON-Feld.

Wiederkehrende Zahlungen (Abo-Management):

Miete, Internet, Netflix.

Architektur-Vorteil: Wir fügen eine neue Collection recurring_rules hinzu. Ein Cronjob im Backend (oder n8n) generiert daraus an Stichtagen automatisch Einträge in die bestehende transactions-Tabelle. Die UI und die Saldo-Berechnung bleiben zu 100% unangetastet.

Gemeinsame Budgets:

Ein Limit von "400 € für Lebensmittel pro Monat".

Architektur-Vorteil: Wird als neues Modul unter lib/features/budgets angelegt, liest sich iterativ die Daten aus dem Transaction-Store und visualisiert den Fortschritt.

Bank-Account-Sync (PSD2 / OpenBanking):

Anstatt manueller Eingabe zieht ein Service wie FinAPI oder GoCardless die Transaktionen.

Architektur-Vorteil: Der Sync-Service füttert unsere generische API. Transaktionen bekommen einen status: "draft" und müssen vom User im UI nur noch per Swipe bestätigt (Kategorie & Split) werden (Tinder-Prinzip für Ausgaben).

7. Nächste Schritte (Agiler Rollout)

Milestone 1: Core Engine (Setup PocketBase, SvelteKit Grundgerüst, Feature-Sliced-Struktur).

Milestone 2: UI & Flexibles Zahlungsmodell (Implementierung Single-Payer und Gemeinsames Bezahlen).

Milestone 3: PWA & Realtime (Service Worker, SSE Subscriptions).

Milestone 4: Abrechnung (Settlement-Logik).

Milestone 5: CI/CD & Deployment (Aufsetzen von Coolify, GitHub Webhooks, strikte .gitignore etablieren).

Milestone 6: Wiederkehrende Ausgaben / Abo-Management

- [NEW] Collection `recurring_expenses` in PocketBase (erledigt)
- [NEW] API-Schnittstelle in `src/lib/features/recurring/api.ts` für CRUD-Operationen der wiederkehrenden Ausgaben
- [NEW] Svelte 5 Store `src/lib/features/recurring/store.svelte.ts` zur Verwaltung und automatischen Generierung von Transaktionen beim App-Start
- [NEW] Ansicht `/recurring` zur Verwaltung (Hinzufügen, Bearbeiten, Löschen) von monatlichen, vierteljährlichen und jährlichen Ausgaben (z. B. Miete, Spotify, Versicherungen)
- [MODIFY] Integration der automatischen Generierung im globalen Layout-Ladevorgang oder im Dashboard-Store, so dass fehlende Buchungen seit `last_generated` automatisch erzeugt und in PocketBase gespeichert werden.
