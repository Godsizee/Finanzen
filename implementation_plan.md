# FairShare — SaaS-Plattform: Vollständiger Implementierungsplan

> **Version 2.0 — Stand: 2026-07-06**
> Ziel: Ausbau von einer privaten Paar-PWA zur vollwertigen, marktfähigen SaaS-Plattform für geteilte Gruppenfinanzen.

---

## 1. Vision & Positionierung

**FairShare** ist die datenschutzkonforme, offline-fähige und fair-aufteilende Finanz-App für alle, die gemeinsam wirtschaften — ob Paar, WG, Freundesgruppe, Familie oder kleines Team.

**Elevator Pitch:**
> „Nie wieder Streit ums Geld. FairShare rechnet automatisch ab — transparent, fair und auch ohne Internet."

**Alleinstellungsmerkmale (USP):**
- Offline-First (kein Internet nötig zum Buchen)
- Self-Hostable (Privacy by Design, keine Datenweitergabe)
- Gruppen-übergreifend (ein Account, viele Gruppen)
- Intelligente Aufteilung (gleich / einkommensbasiert / individuell)
- Belegerfassung mit OCR (Foto → Betrag automatisch)
- Bank-Sync ohne Cloud-Pflicht (GoCardless/FinAPI optional)

---

## 2. Produkt-Tiers & Business Model

### Preisstruktur

| Feature | **Free** | **Pro** | **Business** |
|---|:---:|:---:|:---:|
| Gruppen | 1 | Unbegrenzt | Unbegrenzt |
| Mitglieder/Gruppe | 2 | 10 | Unbegrenzt |
| Transaktionen/Monat | 50 | Unbegrenzt | Unbegrenzt |
| Offline-Sync | ✅ | ✅ | ✅ |
| Wiederkehrende Ausgaben | ✅ (3) | ✅ | ✅ |
| CSV-Export | ✅ | ✅ | ✅ |
| Kategorien (eigene) | — | ✅ | ✅ |
| Budgets & Sparziele | — | ✅ | ✅ |
| Belegfoto (OCR) | — | ✅ | ✅ |
| PDF-Monatsbericht | — | ✅ | ✅ |
| Push-Benachrichtigungen | ✅ (basic) | ✅ (alle) | ✅ (alle) |
| Bank-Sync | — | — | ✅ |
| REST-API-Zugang | — | — | ✅ |
| Aktivitäts-Audit-Log | — | ✅ | ✅ |
| Prioritäts-Support | — | — | ✅ |
| Preis/Monat | **0 €** | **4,99 €** | **14,99 €** |
| Preis/Jahr | **0 €** | **39,99 €** | **119,99 €** |
| Gratis-Trial (Pro) | — | **14 Tage** | **14 Tage** |

### Monetarisierungs-Roadmap
- **Phase 1:** Free + Pro (MVP SaaS)
- **Phase 2:** Business-Tier + API
- **Phase 3:** Self-Hosted Lizenz (Docker-Image, jährliche Lizenz für Privacy-first-Nutzer)
- **Phase 4:** White-Label für Finanz-Apps / Fintechs

---

## 3. Tech-Stack (Vollständig)

### 3.1 Frontend

| Technologie | Rolle | Status |
|---|---|---|
| SvelteKit 2 | App-Framework (SPA/PWA) | ✅ vorhanden |
| Svelte 5 (Runes) | Reaktives State-Management | ✅ vorhanden |
| Tailwind CSS 4 | Design-System | ✅ vorhanden |
| Vite PWA Plugin | Service Worker, Manifest | ✅ vorhanden |
| TypeScript | Typsicherheit | ✅ vorhanden |
| Vitest | Unit Tests | ✅ vorhanden |
| Playwright | E2E Tests | 🆕 hinzufügen |
| paraglide-js (inlang) | i18n (DE/EN/...) | 🆕 hinzufügen |
| Stripe.js | Payment UI | 🆕 hinzufügen |
| Capacitor | iOS/Android Wrapper | 🆕 Phase 3 |

### 3.2 Backend

| Technologie | Rolle | Status |
|---|---|---|
| PocketBase | Datenbank, Auth, REST, Realtime | ✅ vorhanden |
| PocketBase Hooks (JSVM) | Serverseitige Business-Logik | 🆕 erweitern |
| n8n | Workflow-Automation (OCR, Bank-Sync, E-Mail) | 🆕 hinzufügen |
| Stripe | Subscription-Billing | 🆕 hinzufügen |
| Resend | Transaktionale E-Mails | 🆕 hinzufügen |
| Cloudflare R2 | Beleg-/Avatar-Storage | 🆕 hinzufügen |
| Upstash Redis | Rate Limiting, Caching, Sessions | 🆕 hinzufügen |

### 3.3 Infrastructure & Observability

| Technologie | Rolle | Status |
|---|---|---|
| Coolify (eigener VPS) | PaaS, CI/CD, Container-Orchestrierung | ✅ vorhanden |
| Docker | Container-Isolation | ✅ vorhanden |
| GitHub | Versionskontrolle, CI Trigger | ✅ vorhanden |
| Sentry | Error Monitoring (Frontend + Backend) | 🆕 hinzufügen |
| PostHog | Analytics, Feature Flags, A/B Testing | 🆕 hinzufügen |
| BetterStack / Uptime Kuma | Uptime Monitoring | 🆕 hinzufügen |
| Loki + Grafana | Log Aggregation (via Coolify) | 🆕 Phase 2 |

---

## 4. Architektur: Multi-Tenant SaaS

### 4.1 Mandantenmodell

```
User (1) ──── belongs_to (N) ──── GroupMember ──── (N) Group
                                                         │
                                              (N) Transactions
                                              (N) Budgets
                                              (N) Settlements
                                              (N) RecurringRules
                                              (N) AuditEvents
```

Jede `Group` ist ein logischer Mandant. Ein User kann mehreren Gruppen angehören (WG + Paar + Freundesgruppe). PocketBase-Zugriffsregeln erzwingen Datenisolation auf Row-Level.

### 4.2 PocketBase Row-Level Rules (Prinzip)

```
transactions: 
  list/view: @request.auth.id != "" && group.members.user_id ?= @request.auth.id
  create:    @request.auth.id != "" && @request.body.group_id.members.user_id ?= @request.auth.id
  update:    @request.auth.id != "" && group.members.user_id ?= @request.auth.id && group.members.role != "readonly"
  delete:    @request.auth.id != "" && (paid_by = @request.auth.id || group.members.role = "admin")
```

### 4.3 Offline-First Architektur

```
[User Action]
      │
      ▼
[Svelte Store]  ──optimistic update──►  [UI sofort aktualisiert]
      │
      ▼
[Offline Queue]  ──wenn online──►  [PocketBase API]
      │                                    │
      ▼                                    ▼
[IndexedDB]                      [Realtime SSE broadcast]
                                           │
                                           ▼
                                  [Partner-Gerät aktualisiert]
```

### 4.4 Subscription-Flow (Stripe)

```
[User klickt Upgrade]
      │
      ▼
[SvelteKit → PocketBase Hook → Stripe Checkout Session]
      │
      ▼
[Stripe Checkout Page]
      │
      ▼
[stripe.webhook → PocketBase Hook → subscription.update]
      │
      ▼
[Feature-Flag im User-Record gesetzt]
```

---

## 5. Vollständiges Datenmodell

### Collection: `users` (System, erweitert)

| Feld | Typ | Beschreibung |
|---|---|---|
| id | ID | PocketBase-Standard |
| email | Email | Unique, verifiziert |
| username | String | Anzeigename |
| avatar | File | Profilbild |
| subscription_tier | Select | `free` / `pro` / `business` |
| stripe_customer_id | String | Stripe-Referenz |
| locale | Select | `de` / `en` / `fr` / ... |
| currency | Select | `EUR` / `USD` / ... |
| push_enabled | Bool | Web Push aktiv? |
| onboarding_completed | Bool | Tutorial abgeschlossen? |
| two_factor_enabled | Bool | TOTP aktiv? |
| deleted_at | DateTime | Soft-Delete (DSGVO) |

### Collection: `groups`

| Feld | Typ | Beschreibung |
|---|---|---|
| id | ID | |
| name | String | z.B. "Gemeinsame Haushaltskasse" |
| avatar | File | Gruppen-Bild |
| description | String | optional |
| created_by | Relation → users | |
| default_currency | Select | `EUR` / `USD` / ... |
| default_split_mode | Select | `equal` / `proportional` / `custom` |
| settlement_interval | Select | `on_demand` / `weekly` / `monthly` |
| invite_code | String | Unique, für Einladungslinks |
| invite_expires_at | DateTime | optional |
| is_archived | Bool | Inaktive Gruppen ausblenden |
| metadata | JSON | Erweiterungsfeld |

### Collection: `group_members`

| Feld | Typ | Beschreibung |
|---|---|---|
| id | ID | |
| group_id | Relation → groups | |
| user_id | Relation → users | |
| role | Select | `admin` / `member` / `readonly` |
| income_cents | Number | Einkommen in Cent (für proportionalen Split) |
| joined_at | DateTime | |
| is_active | Bool | Pausiert vs. aktiv |

### Collection: `categories` (erweitert)

| Feld | Typ | Beschreibung |
|---|---|---|
| id | ID | |
| name | String | |
| icon | String | Emoji oder Icon-Name |
| color | String | HEX-Farbe |
| group_id | Relation → groups | null = System-Kategorie |
| is_system | Bool | Schreibschutz für System-Kategorien |
| sort_order | Number | Anzeigereihenfolge |
| classification_hints | JSON | Keywords für KI-Kategorisierung |

**System-Kategorien (vorinstalliert):**
Supermarkt, Restaurant, Transport, Wohnen, Energie, Versicherung, Gesundheit, Freizeit, Kleidung, Elektronik, Reisen, Sport, Bildung, Sonstiges

### Collection: `transactions` (vollständig überarbeitet)

| Feld | Typ | Beschreibung |
|---|---|---|
| id | ID | |
| group_id | Relation → groups | |
| total_amount | Number | Gesamtbetrag in Cent |
| date | DateTime | Ausgabedatum |
| category_id | Relation → categories | |
| paid_by | Relation → users | Hauptzahler |
| paid_amounts | JSON | `{user_id: amount_cents}` — für Splitpayment |
| split_mode | Select | `equal` / `proportional` / `custom` / `full` |
| split_shares | JSON | `{user_id: amount_cents}` — Kostenverteilung |
| note | String | optional |
| receipt_url | String | R2-URL des Belegfotos |
| receipt_ocr_data | JSON | OCR-Ergebnis (Vertrauen, Rohtext) |
| settlement_id | Relation → settlements | null = offen |
| status | Select | `pending` / `confirmed` / `settled` |
| import_source_id | Relation → import_sources | optional |
| external_id | String | Dedup-Key für Bank-Sync |
| is_deleted | Bool | Soft-Delete |
| deleted_at | DateTime | |
| metadata | JSON | Erweiterungsfeld |

### Collection: `settlements` (erweitert)

| Feld | Typ | Beschreibung |
|---|---|---|
| id | ID | |
| group_id | Relation → groups | |
| from_user | Relation → users | Schuldner |
| to_user | Relation → users | Gläubiger |
| amount | Number | In Cent |
| date | DateTime | |
| status | Select | `pending` / `confirmed` / `paid` |
| payment_method | Select | `cash` / `transfer` / `app` |
| payment_reference | String | Verwendungszweck / App-Referenz |
| note | String | optional |

### Collection: `recurring_rules` (erweitert)

| Feld | Typ | Beschreibung |
|---|---|---|
| id | ID | |
| group_id | Relation → groups | |
| name | String | z.B. "Miete" |
| amount_cents | Number | |
| frequency | Select | `monthly` / `quarterly` / `yearly` / `weekly` |
| day_of_month | Number | 1–31 (null für weekly) |
| day_of_week | Number | 0–6 (nur für weekly) |
| category_id | Relation → categories | |
| paid_by | Relation → users | |
| split_mode | Select | |
| split_shares | JSON | |
| active_from | Date | Startdatum der Regel |
| active_until | Date | optional — Endedatum |
| next_due_date | Date | Nächste Fälligkeit |
| last_generated_at | DateTime | |
| is_paused | Bool | |
| skip_months | JSON | `["2026-02", "2026-08"]` |
| note | String | |

### Collection: `budgets` (NEU)

| Feld | Typ | Beschreibung |
|---|---|---|
| id | ID | |
| group_id | Relation → groups | |
| name | String | z.B. "Lebensmittel-Budget" |
| category_id | Relation → categories | null = alle Kategorien |
| amount_cents | Number | Monatslimit |
| period | Select | `monthly` / `yearly` |
| alert_at_percent | Number | Warnung ab z.B. 80% |
| color | String | HEX |
| is_active | Bool | |

### Collection: `savings_goals` (NEU)

| Feld | Typ | Beschreibung |
|---|---|---|
| id | ID | |
| group_id | Relation → groups | |
| name | String | z.B. "Urlaub Italien" |
| target_amount_cents | Number | |
| current_amount_cents | Number | |
| deadline | Date | optional |
| icon | String | Emoji |
| color | String | HEX |
| is_completed | Bool | |
| completed_at | DateTime | |

### Collection: `savings_contributions` (NEU)

| Feld | Typ | Beschreibung |
|---|---|---|
| id | ID | |
| goal_id | Relation → savings_goals | |
| user_id | Relation → users | |
| amount_cents | Number | |
| note | String | |
| created_at | DateTime | |

### Collection: `audit_events` (NEU)

| Feld | Typ | Beschreibung |
|---|---|---|
| id | ID | |
| group_id | Relation → groups | |
| user_id | Relation → users | |
| event_type | String | `transaction.created` / `settlement.confirmed` / ... |
| entity_type | String | `transaction` / `budget` / ... |
| entity_id | String | |
| changes | JSON | Diff: `{field: {from, to}}` |
| created_at | DateTime | |

### Collection: `notifications` (NEU)

| Feld | Typ | Beschreibung |
|---|---|---|
| id | ID | |
| user_id | Relation → users | |
| group_id | Relation → groups | optional |
| type | Select | `settlement_pending` / `budget_alert` / `new_transaction` / ... |
| title | String | |
| body | String | |
| action_url | String | Deep-Link in App |
| read_at | DateTime | null = ungelesen |
| created_at | DateTime | |

### Collection: `push_subscriptions` (NEU)

| Feld | Typ | Beschreibung |
|---|---|---|
| id | ID | |
| user_id | Relation → users | |
| endpoint | URL | Web Push Endpoint |
| p256dh | String | Public Key |
| auth | String | Auth Secret |
| device_name | String | z.B. "iPhone 15 Pro" |
| created_at | DateTime | |

### Collection: `subscriptions` (NEU — Stripe)

| Feld | Typ | Beschreibung |
|---|---|---|
| id | ID | |
| user_id | Relation → users | |
| stripe_subscription_id | String | |
| stripe_price_id | String | |
| tier | Select | `pro` / `business` |
| status | Select | `active` / `canceled` / `past_due` / `trialing` |
| trial_ends_at | DateTime | |
| current_period_start | DateTime | |
| current_period_end | DateTime | |
| cancel_at_period_end | Bool | |

### Collections: Import-Pipeline (P3, vorhanden + erweitert)

- `import_sources` — Bankverbindungen / CSV-Quellen
- `import_runs` — Einzelne Importläufe
- `transaction_candidates` — Noch zu prüfende Buchungen
- `classification_rules` — Regex/Keyword → Kategorie
- `csv_mapping_profiles` — Spaltenprofile je Bank/Format
- `financial_accounts` — Bankkonten des Users

---

## 6. UI/UX Design System (Mobile-First)

### 6.1 Breakpoint-System

```
Default (kein Prefix):  < 360px   — Ultracompact (alte Smartphones, Smartwatches)
xs:                     ≥ 360px   — Standard Mobile (Grundlinie)
sm:                     ≥ 640px   — Tablet / großes Phablet
lg:                     ≥ 1024px  — Desktop / Laptop
xl:                     ≥ 1280px  — Wide Desktop
```

**Tailwind-Konfiguration:**
```js
// tailwind.config.js
theme: {
  screens: {
    'xs': '360px',
    'sm': '640px',
    'md': '768px',
    'lg': '1024px',
    'xl': '1280px',
    '2xl': '1536px'
  }
}
```

### 6.2 < 360px — Ultracompact

Zielgeräte: Sehr alte Phones, Budget-Android-Geräte, ggf. Smartwatch-Browser.

**Regeln:**
- Basis-Schriftgröße: 13px (statt 16px)
- Keine Bottom-Nav-Labels — nur Icons (20px)
- FAB: 44px (statt 56px), kein Label
- Karten: minimaler Inhalt (Betrag + Datum + Kategorie-Icon)
- Kein Avatar im Header, nur Initialen-Badge (24px)
- Numpad: 4 Spalten à 44px Höhe
- Modals: Full-Screen (kein Overlay-Gap)
- Toasts: kompakt, kein Icon, max. 2 Zeilen
- Listen: 48px Zeilenhöhe (minimum Touch Target)
- Gruppen-Switcher: Horizontal-Scroll-Chips statt Tabs

### 6.3 ≥ 360px — Standard Mobile (Hauptzielgruppe)

**Navigation:**
```
┌────────────────────────────────┐
│  FairShare    [Gruppe ▾]  [🔔] │  ← Header (56px)
├────────────────────────────────┤
│                                │
│        [Content Area]          │
│                                │
│                                │
├───────────────────────────────┤
│ 🏠    📋    ⊕    💰    👤    │  ← Bottom Nav (64px)
│ Home  Hist  ADD  Budget Profil │
└────────────────────────────────┘
                 ↑
            FAB (56px, floating, zentriert, +8px über Nav)
```

**Gestik:**
- Pull-to-Refresh: Transaktionsliste
- Swipe-Left auf Transaktion: Löschen (rot) / Bearbeiten (blau)
- Swipe-Right auf Import-Kandidat: Bestätigen
- Swipe-Left auf Import-Kandidat: Ablehnen
- Long-Press auf Transaktion: Kontextmenü (Duplizieren, Teilen, Details)

**Haptisches Feedback (Vibration API):**
- Erfolgreich gespeichert: kurzes Buzz (10ms)
- Fehler: 3× kurz (50ms, 50ms, 50ms)
- Löschen: langes Buzz (200ms)
- Settlement bestätigt: Double-Buzz (50ms Pause 50ms)

### 6.4 ≥ 640px — Tablet / Phablet

```
┌──────────────────────────────────────────────┐
│  FairShare              [Gruppe ▾]  [🔔] [+] │
├──────────────────────────────────────────────┤
│              │                               │
│  🏠 Home     │   [Content — 2 Columns]       │
│  📋 Historie │                               │
│  💰 Budgets  │                               │
│  🔄 Wieder.  │                               │
│  👤 Profil   │                               │
│              │                               │
└──────────────────────────────────────────────┘
← Sidebar 200px →←  Content 100% - 200px     →
```

Kein FAB — "Neue Buchung" als prominenter Button in Header und Sidebar.

### 6.5 ≥ 1024px — Desktop

```
┌────────┬─────────────────────────────────────────────┐
│ Logo   │   [Globale Suchleiste]         [🔔] [Profil]│
│        ├──────────────────────┬──────────────────────┤
│ 🏠 Home│                      │                      │
│ 📋 Hist│   [Haupt-Content]    │  [Detail / Sidebar]  │
│ 💰 Budg│   2/3 Breite         │  1/3 Breite          │
│ 🔄 Wie │                      │  Letzte Aktivitäten  │
│ 📥 Imp │                      │  Budget-Status       │
│ 👤 Prof│                      │  Nächste Fälligkeiten│
│ ⚙ Einst│                      │                      │
│        │                      │                      │
│        ├──────────────────────┴──────────────────────┤
└────────┴─────────────────────────────────────────────┘
240px    └──────────── calc(100% - 240px) ─────────────┘
```

**Keyboard Shortcuts (Desktop):**
```
Strg + N        → Neue Buchung
Strg + /        → Globale Suche
Strg + S        → Speichern (in Formularen)
Esc             → Modal/Formular schließen
Alt + 1–5       → Navigation (Home / Historie / Budgets / Profil)
```

### 6.6 Design-Tokens (CSS Custom Properties)

```css
:root {
  /* Farben */
  --color-primary:     #3b82f6; /* blue-500 */
  --color-success:     #22c55e; /* green-500 */
  --color-warning:     #f59e0b; /* amber-500 */
  --color-danger:      #ef4444; /* red-500 */
  --color-neutral:     #64748b; /* slate-500 */

  /* Typografie */
  --font-size-xs:      0.75rem;  /* 12px */
  --font-size-sm:      0.875rem; /* 14px */
  --font-size-base:    1rem;     /* 16px */
  --font-size-lg:      1.125rem; /* 18px */
  --font-size-xl:      1.25rem;  /* 20px */
  --font-size-hero:    2rem;     /* 32px */

  /* Spacing (4px Grid) */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  /* Touch Targets */
  --touch-min: 44px; /* WCAG 2.5.5 */

  /* Radien */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-card: 0 1px 3px rgba(0,0,0,.12), 0 1px 2px rgba(0,0,0,.08);
  --shadow-modal: 0 20px 60px rgba(0,0,0,.3);
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg:      #0f172a; /* slate-900 */
    --color-surface: #1e293b; /* slate-800 */
    --color-border:  #334155; /* slate-700 */
    --color-text:    #f1f5f9; /* slate-100 */
    --color-muted:   #94a3b8; /* slate-400 */
  }
}
```

---

## 7. Feature-Scope (Vollständig)

### 7.1 Auth & Onboarding

- [x] E-Mail + Passwort (PocketBase Auth)
- [ ] Magic Link Login (E-Mail-Link, kein Passwort nötig)
- [ ] OAuth: Google / Apple (PocketBase OAuth2)
- [ ] 2FA (TOTP: Google Authenticator, Authy)
- [ ] Passwort-Reset via E-Mail (Resend)
- [ ] E-Mail-Verifikation bei Registrierung
- [ ] Onboarding-Wizard (3 Schritte):
  1. Profilbild + Name + Währung
  2. Erste Gruppe erstellen oder Einladung annehmen
  3. Ersten Ausgabeneintrag tutorial-geführt machen
- [ ] Invite-Flow: Link / QR-Code / E-Mail-Einladung

### 7.2 Gruppen-Management

- [ ] Gruppe erstellen (Name, Avatar, Währung, Split-Modus)
- [ ] Mitglieder per Link / QR-Code / E-Mail einladen
- [ ] Rollen verwalten (Admin / Member / Readonly)
- [ ] Mitglied entfernen (mit Datentransfer-Option)
- [ ] Gruppe archivieren (historische Daten bleiben)
- [ ] Gruppe löschen (mit Bestätigung + DSGVO-Export)
- [ ] Einladungslink-Ablaufdatum setzen
- [ ] Multi-Gruppen-Switcher im Dashboard

### 7.3 Transaktionen

- [x] Neue Buchung (Betrag, Kategorie, Datum, Notiz)
- [x] Zahler-Toggle (Einer zahlt / Gemeinsam bezahlt)
- [x] Split-Modi (50/50, einkommensbasiert, custom)
- [x] Offline-Queue mit Sync bei Verbindung
- [x] Realtime-Update auf Partnergerät (SSE)
- [x] Duplizieren von Buchungen
- [x] Bearbeiten / Löschen
- [ ] Belegfoto (Kamera + Upload → OCR)
- [ ] Undo nach Erfassung (5-Sek-Toast mit Rückgängig)
- [ ] Haptisches Feedback
- [ ] Quick-Add-Shortcuts (häufige Buchungen, 1 Tap)
- [ ] Buchungsvorlagen (Favoriten)
- [ ] Negativbuchung (Rückerstattung / Korrektur)
- [ ] Multi-Kategorie-Splits (ein Kassenbon, mehrere Kategorien)
- [ ] Standort-Tag optional (für Restaurantbesuche etc.)

### 7.4 Abrechnung & Settlements

- [x] Monatsabschluss atomar (pb.createBatch)
- [x] Einheitlicher Split-Modus je Gruppe
- [ ] Abrechnungsvorschau vor Bestätigung
- [ ] Zahlungsbestätigung (Status: pending → confirmed → paid)
- [ ] Zahlungs-Methode (Bar / Überweisung / App)
- [ ] Verwendungszweck-Generator ("FairShare Juli 2026")
- [ ] Automatische Abrechnung bei Intervall (weekly/monthly)
- [ ] Teilabrechnung (nur bestimmte Transaktionen)

### 7.5 Budgets

- [ ] Budget erstellen (Kategorie, Betrag, Zeitraum)
- [ ] Fortschrittsbalken je Budget (grün / orange / rot)
- [ ] Warnung bei x% Verbrauch (Push + In-App)
- [ ] Budget-Übersicht auf Dashboard
- [ ] Monatlicher Auto-Reset
- [ ] Budget-Vergleich Vormonat
- [ ] Budget für alle Kategorien gesamt

### 7.6 Sparziele

- [ ] Ziel erstellen (Name, Betrag, Deadline, Icon)
- [ ] Einzahlung hinzufügen (verknüpft mit Buchung oder manuell)
- [ ] Fortschrittsanzeige (Balken + %)
- [ ] Countdown bis Deadline
- [ ] Zielerreichungs-Feier (Konfetti-Animation)
- [ ] Mehrere Ziele parallel

### 7.7 Wiederkehrende Ausgaben

- [x] Regeln erstellen (monatlich, quartalsweise, jährlich)
- [x] Clientseitige Generierung mit deterministischen IDs
- [x] Duplikat-Schutz (400-Fehler-Handling)
- [ ] Pausieren & Überspringen (einzelner Monat)
- [ ] Bearbeiten ohne Rückwirkung (ab nächstem Monat)
- [ ] Serverseitige Generierung via n8n (robuster)
- [ ] Unique-Index in PocketBase setzen
- [ ] Abo-Kalender-Ansicht (Wann wird was fällig?)
- [ ] Abo-Kosten-Übersicht (Gesamtbetrag/Monat)
- [ ] Erinnerung 3 Tage vor Fälligkeit (Push)

### 7.8 Historia & Analyse

- [x] Monatsgruppen in Transaktionsliste
- [x] CSV-Export
- [ ] Such- und Filterlogik (Betrag, Kategorie, Zahler, Zeitraum)
- [ ] Kategorie-Donut-Chart (Monatsübersicht)
- [ ] Ausgaben-Zeitreihe (Liniendiagramm)
- [ ] Kassensturz-Ansicht (Gesamtausgaben / pro Person)
- [ ] Monat-für-Monat Vergleich
- [ ] Sparquote-Berechnung (Einnahmen vs. Ausgaben)
- [ ] PDF-Monatsbericht (Pro-Feature)
- [ ] JSON-Export (vollständig)
- [ ] DSGVO-Datenauskunft (vollständiger Export aller eigenen Daten)

### 7.9 Import & Bank-Sync

- [ ] CSV-Import mit Spalten-Mapping
- [ ] Mappingprofile speichern (je Bank-Format)
- [ ] Import-Prüfeingang (Swipe Right/Left)
- [ ] Duplikat-Erkennung (Hash-basiert + fuzzy)
- [ ] GoCardless / FinAPI Bank-Sync (Business-Tier)
- [ ] Automatische Kategorisierung (Regex-Regeln + KI)
- [ ] Importbericht (wie viele angenommen / abgelehnt)
- [ ] Audit-Trail je Import-Run

### 7.10 OCR & Belegerfassung

- [ ] Kamera-Trigger im Add-Formular
- [ ] Upload zu Cloudflare R2 (mit User-Isolierung)
- [ ] n8n Webhook → OpenAI Vision API
- [ ] Extrahierte Felder: Betrag, Datum, Händlername
- [ ] Konfidenz-Anzeige ("Erkennung: 94%")
- [ ] Manuelle Korrektur vor Übernahme
- [ ] Belegvorschau in Transaktionsdetail
- [ ] OCR-Daten in `receipt_ocr_data` speichern

### 7.11 Benachrichtigungen

- [ ] Web Push (Serviceworker + Push API)
- [ ] In-App Notification Center (Glocke im Header)
- [ ] E-Mail-Benachrichtigungen via Resend:
  - Neue Buchung (optional, konfigurierbar)
  - Abrechnung ausstehend
  - Budget-Warnung
  - Sparziel erreicht
  - Einladung zur Gruppe
  - Abonnement-Bestätigung / Mahnung
- [ ] Push-Trigger:
  - Partner trägt Ausgabe ein
  - Budget überschritten
  - Abrechnung überfällig (> 30 Tage)
  - Fälligkeit Fixkosten
  - Sparziel-Deadline naht

### 7.12 Aktivitäts-Log & Audit

- [ ] Jede CRUD-Aktion wird in `audit_events` geschrieben
- [ ] Aktivitätsfeed auf Dashboard ("Anna hat 45 € für Lebensmittel eingetragen")
- [ ] Undo-Funktion (letzte 5 Aktionen rückgängig machbar)
- [ ] Konfliktanzeige (wenn beide offline dasselbe bearbeitet haben)
- [ ] Audit-Log-Ansicht (Pro/Business-Feature)

### 7.13 Subscription & Billing

- [ ] Stripe Checkout (monatlich / jährlich)
- [ ] Stripe Customer Portal (Kündigung, Zahlungsupdate)
- [ ] Webhook-Handler in PocketBase Hook
- [ ] Feature-Flags im User-Record (`subscription_tier`)
- [ ] Downgrade-Handling (Gruppen auf Limit reduzieren, Daten behalten)
- [ ] Trial-Zeitraum (14 Tage, Kreditkarte erst nach Trial)
- [ ] Proration bei Plan-Wechsel
- [ ] Invoice-E-Mails via Stripe (automatisch)

### 7.14 i18n & Multi-Currency

- [ ] Sprachen: Deutsch (primär), Englisch (Release)
- [ ] Später: Französisch, Spanisch, Niederländisch
- [ ] Paraglide-JS für typesafe i18n
- [ ] Währungsformat je Locale (€ 12,50 vs $12.50)
- [ ] Wechselkurse via Open Exchange Rates API (gecacht via Upstash Redis)
- [ ] Gruppen-Währung (alle Beträge in Gruppenw. gespeichert)
- [ ] Persönliche Anzeigewährung mit Konvertierung

### 7.15 Datenschutz & Sicherheit

- [ ] DSGVO-Datenauskunft (vollständiger JSON-Export aller eigenen Daten)
- [ ] Recht auf Löschung (Account + alle Daten, Soft-Delete mit 30-Tage-Frist)
- [ ] 2FA (TOTP)
- [ ] Rate Limiting (Upstash Redis, 100 req/min/user)
- [ ] Input-Sanitierung auf Client und PocketBase-Ebene
- [ ] Kein localStorage für Auth-Token (Memory + HttpOnly Cookie)
- [ ] API-Keys für Business-Tier (HMAC-signiert, scoped)
- [ ] Automatische Session-Invalidierung nach 30 Tagen Inaktivität
- [ ] PocketBase Update-Regeln: User kann nur eigene Felder schreiben

### 7.16 Admin & Support (Business-Tier)

- [ ] Team-Admin-Ansicht (alle Mitglieder, Rollen verwalten)
- [ ] Aktivitätsprotokoll (wer hat wann was getan)
- [ ] API-Key-Verwaltung (generieren, rotieren, widerrufen)
- [ ] Webhook-Konfiguration (eigene Systeme anbinden)
- [ ] Priority-Support-Button (Direkt-Chat oder Ticket)

### 7.17 Marketing & Growth

- [ ] Landing Page (/ → public, vor Login)
  - Hero Section (Tagline + App-Screenshot)
  - Feature-Grid (3 USPs mit Icons)
  - Preisübersicht (Tier-Vergleich-Tabelle)
  - Testimonials (placeholder)
  - CTA: "Kostenlos starten" (→ /register)
- [ ] Referral-System (Empfehle 3 Freunde → 1 Monat Pro gratis)
- [ ] PostHog Analytics (Funnel: Landing → Register → Onboarding → First Transaction)
- [ ] PostHog Feature Flags (Gradueller Rollout neuer Features)
- [ ] A/B Testing (Onboarding-Varianten)
- [ ] Open Graph Meta-Tags für Social Sharing

---

## 8. Frontend-Architektur (Erweitert)

```
src/
├── lib/
│   ├── core/
│   │   ├── pb.ts              ← PocketBase-Client-Singleton
│   │   ├── auth.svelte.ts     ← Auth-Store (Svelte 5 Runes)
│   │   ├── queue.svelte.ts    ← Offline-Queue (IndexedDB)
│   │   ├── i18n.ts            ← Paraglide-JS Setup
│   │   ├── stripe.ts          ← Stripe.js Initialisierung
│   │   ├── pushNotifications.ts ← Web Push API
│   │   └── types.ts           ← Globale TypeScript-Typen
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── api.ts
│   │   │   └── components/    ← LoginForm, RegisterForm, OAuthButtons
│   │   ├── groups/
│   │   │   ├── api.ts
│   │   │   ├── store.svelte.ts
│   │   │   └── components/    ← GroupCard, GroupSwitcher, InviteModal
│   │   ├── transactions/
│   │   │   ├── api.ts
│   │   │   ├── store.svelte.ts
│   │   │   └── components/    ← TransactionCard, TransactionForm, NumPad
│   │   ├── settlements/
│   │   │   ├── api.ts
│   │   │   ├── store.svelte.ts
│   │   │   └── components/    ← SettlementCard, SettlementPreview
│   │   ├── recurring/
│   │   │   ├── api.ts
│   │   │   ├── store.svelte.ts
│   │   │   └── components/    ← RecurringCard, RecurringForm
│   │   ├── budgets/
│   │   │   ├── api.ts
│   │   │   ├── store.svelte.ts
│   │   │   └── components/    ← BudgetCard, BudgetProgress
│   │   ├── goals/
│   │   │   ├── api.ts
│   │   │   ├── store.svelte.ts
│   │   │   └── components/    ← GoalCard, ContributionForm
│   │   ├── import/
│   │   │   ├── api.ts
│   │   │   └── components/    ← ImportCard, CsvUpload, ReviewSwipe
│   │   ├── notifications/
│   │   │   ├── api.ts
│   │   │   ├── store.svelte.ts
│   │   │   └── components/    ← NotificationBell, NotificationList
│   │   ├── analytics/
│   │   │   └── components/    ← DonutChart, TimelineChart, MonthReport
│   │   └── billing/
│   │       ├── api.ts
│   │       └── components/    ← PricingTable, UpgradeModal, BillingPortal
│   │
│   └── ui/                    ← Generische UI-Bausteine
│       ├── Button.svelte
│       ├── Input.svelte
│       ├── Modal.svelte
│       ├── Toast.svelte
│       ├── Badge.svelte
│       ├── Card.svelte
│       ├── ProgressBar.svelte
│       ├── SwipeCard.svelte   ← Swipe-Geste für Import/Delete
│       ├── NumPad.svelte      ← Mobile Numpad
│       ├── BottomSheet.svelte ← Mobile Bottom Sheet
│       ├── Fab.svelte         ← Floating Action Button
│       ├── BottomNav.svelte   ← Mobile Bottom Navigation
│       └── Sidebar.svelte     ← Desktop Sidebar
│
└── routes/
    ├── +layout.svelte         ← Auth-Guard, Nav, Toast-Container
    ├── +page.svelte           ← Landing Page (public)
    ├── login/+page.svelte
    ├── register/+page.svelte
    ├── onboarding/+page.svelte
    ├── (app)/                 ← Auth-protected routes
    │   ├── +layout.svelte     ← App-Shell (Nav + Content)
    │   ├── dashboard/+page.svelte
    │   ├── add/+page.svelte
    │   ├── edit/[id]/+page.svelte
    │   ├── history/+page.svelte
    │   ├── groups/+page.svelte
    │   ├── groups/[id]/+page.svelte
    │   ├── recurring/+page.svelte
    │   ├── budgets/+page.svelte
    │   ├── goals/+page.svelte
    │   ├── import/+page.svelte
    │   ├── analytics/+page.svelte
    │   ├── notifications/+page.svelte
    │   └── profile/+page.svelte
    ├── (admin)/               ← Business-Tier Admin
    │   ├── +layout.svelte     ← Tier-Guard
    │   └── admin/+page.svelte
    ├── api/
    │   └── webhooks/
    │       └── stripe/+server.ts  ← Stripe Webhook Handler
    └── invite/[code]/+page.svelte ← Gruppeneinladung
```

---

## 9. Backend-Hooks (PocketBase JSVM)

PocketBase ermöglicht JavaScript-Hooks, die serverseitig laufen.

### Hooks zu implementieren:

```javascript
// pb_hooks/main.pb.js

// 1. Neue Transaktion → Audit-Event schreiben
onRecordAfterCreateRequest((e) => {
  if (e.collection().name === "transactions") {
    // Audit-Event + Notification für Gruppenpartner
  }
}, "transactions")

// 2. Budget-Warnung nach neuer Buchung
onRecordAfterCreateRequest((e) => {
  // Prüfe ob Budgetlimit überschritten
  // Falls ja: Notification + Web Push
}, "transactions")

// 3. Stripe-Webhook: Subscription-Update
routerAdd("POST", "/api/webhooks/stripe", (e) => {
  // Stripe-Signatur validieren
  // User subscription_tier updaten
})

// 4. Invite-Link-Generator
routerAdd("POST", "/api/groups/:id/invite", (e) => {
  // Zufälligen Code generieren, in group.invite_code speichern
})

// 5. DSGVO-Datenexport
routerAdd("GET", "/api/user/export", (e) => {
  // Alle Nutzerdaten als JSON-Zip zurückgeben
})

// 6. User-Löschung (Right to be Forgotten)
routerAdd("DELETE", "/api/user/me", (e) => {
  // Soft-Delete, 30-Tage-Frist setzen
  // n8n-Workflow für endgültige Löschung triggern
})
```

---

## 10. n8n Workflows

### Workflow 1: OCR-Pipeline
```
Trigger: Webhook (Belegfoto hochgeladen)
→ Datei von R2 herunterladen
→ OpenAI Vision API: Betrag, Datum, Händler extrahieren
→ Ergebnis in transactions.receipt_ocr_data speichern
→ Benachrichtigung an User (OCR fertig)
```

### Workflow 2: Serverseitige Fixkosten-Generierung
```
Trigger: Täglich 06:00 Uhr (Cron)
→ Alle aktiven recurring_rules abrufen, die heute fällig sind
→ Für jede Regel: transaction erstellen (idempotent via ID)
→ Audit-Event schreiben
→ Betroffene User benachrichtigen
```

### Workflow 3: Bank-Sync (Business)
```
Trigger: Täglich 08:00 Uhr oder manuell
→ GoCardless API: neue Transaktionen abrufen
→ Duplikat-Prüfung via external_id
→ Auto-Kategorisierung via classification_rules
→ transaction_candidates erstellen
→ User benachrichtigen (X neue Buchungen zur Prüfung)
```

### Workflow 4: Monatsbericht (Pro)
```
Trigger: Erster Tag des Monats, 09:00 Uhr
→ Letzte 30 Tage Transaktionen je Gruppe abfragen
→ PDF generieren (Kategorie-Breakdown, Vergleich Vormonat)
→ Via Resend an alle Gruppenpartner senden
```

### Workflow 5: User-Löschung (DSGVO)
```
Trigger: Webhook von PocketBase (30 Tage nach Soft-Delete)
→ Alle Transaktionen des Users anonymisieren
→ User-Record endgültig löschen
→ Löschbestätigung per E-Mail
```

---

## 11. Milestones & Rollout

### M1 — Multi-Tenant Foundation (Woche 1–2)
**Ziel:** Von 2-User-App zur echten Mehrgruppen-Plattform

- [x] `groups` + `group_members` Collections anlegen (`migrate_m1_groups.mjs`)
- [x] Alle Collections auf `group_id` umstellen (transactions, settlements, recurring_expenses; categories bleiben vorerst global)
- [x] PocketBase RLS-Regeln für Gruppen-Isolation (`migrate_m1_groups.mjs`, wird nach Backfill gesetzt)
- [x] Group-Create + Invite-Flow (Link; QR-Code noch offen)
- [x] Multi-Gruppen-Switcher im Dashboard (Desktop-Sidebar + mobile Startseite + `/groups`)
- [x] Auth: E-Mail-Verifikation + Passwort-Reset (Routen vorhanden; Resend-Anbindung noch offen)
- [x] Migration: bestehende Daten in eine Default-Gruppe überführen (Skript geschrieben — **noch nicht gegen Produktion ausgeführt**)

**Akzeptanzkriterien:**
- Zwei verschiedene Browser-Sessions in verschiedenen Gruppen sehen keine gegenseitigen Daten
- Gruppen-Ersteller kann zweite Person per Link einladen

### M2 — Mobile UI Overhaul (Woche 3–5)
**Ziel:** Jedes Gerät fühlt sich nativ an

- [ ] Design-Token-System (CSS Custom Properties)
- [ ] Dark/Light Mode (prefers-color-scheme + manuell)
- [ ] `<360px` Layout (kompakt)
- [ ] `≥360px` Layout (Bottom Nav + FAB)
- [ ] `≥640px` Layout (Sidebar)
- [ ] `≥1024px` Layout (Desktop Dashboard)
- [ ] Swipe-Gesten (Transaktion löschen/bearbeiten)
- [ ] Haptic Feedback (Vibration API)
- [ ] Pull-to-Refresh
- [ ] Bottom Sheet Komponente (für Filter, Aktionen)
- [ ] Keyboard Shortcuts (Desktop)

**Akzeptanzkriterien:**
- App funktioniert auf 320px-Gerät ohne horizontales Scrollen
- Lighthouse Mobile Score ≥ 90

### M3 — Core Features Complete (Woche 6–7)
**Ziel:** Keine offenen P0/P1-Lücken

- [ ] Budgets (CRUD + Fortschrittsbalken + Warnungen)
- [ ] Sparziele (CRUD + Einzahlungen + Konfetti)
- [ ] Aktivitätsfeed auf Dashboard
- [ ] Undo nach Buchung (5-Sek-Toast)
- [ ] Buchungsvorlagen / Favoriten
- [ ] Negative Buchungen (Rückerstattungen)
- [ ] Push-Benachrichtigungen (Web Push API)
- [ ] In-App Notification Center
- [ ] Abrechnungsvorschau vor Settlement
- [ ] Such- und Filterlogik in Historie
- [ ] Offline: Retry mit Backoff
- [ ] Offline: UPDATE/DELETE auf Temp-ID-Transaktionen
- [ ] Fixkosten: Unique-Index + Monatsskip-Funktion

**Akzeptanzkriterien:**
- Alle P0/P1-Backlog-Items erledigt
- Offline: 5 Buchungen ohne Verbindung, nach Reconnect alles synchronisiert

### M4 — Subscription & Billing (Woche 8–9)
**Ziel:** Zahlende Nutzer onboarden

- [ ] Stripe-Integration (Checkout + Portal + Webhooks)
- [ ] Feature-Flag-System basierend auf `subscription_tier`
- [ ] Free-Tier-Limits durchsetzen (50 Tx, 1 Gruppe, 2 Member)
- [ ] Upgrade-Modal (gezielt bei Limit-Überschreitung)
- [ ] 14-Tage-Trial für Pro
- [ ] Downgrade-Handling (Daten bleiben, Features gesperrt)
- [ ] Billing-Seite im Profil (Stripe Portal Link)

**Akzeptanzkriterien:**
- Stripe Checkout abschließbar (Testmodus)
- Feature-Flags korrekt gesetzt nach Webhook
- Free-User sieht Upgrade-Modal bei 51. Transaktion

### M5 — OCR & Import (Woche 10–12)
**Ziel:** Dateneingabe auf ein Minimum reduzieren

- [ ] Belegfoto-Upload (Kamera + Datei) zu R2
- [ ] n8n OCR-Workflow (OpenAI Vision API)
- [ ] OCR-Ergebnis in Formular vorausfüllen
- [ ] CSV-Import mit Spalten-Mapping
- [ ] Import-Prüfeingang UI (Swipe Right/Left)
- [ ] Duplikat-Erkennung (Hash + Fuzzy)
- [ ] Auto-Kategorisierung via `classification_rules`
- [ ] Importbericht anzeigen

**Akzeptanzkriterien:**
- Kassenbon-Foto → Betrag korrekt erkannt in ≥80% der Fälle
- CSV-Import: 100 Transaktionen ohne Fehler importierbar

### M6 — Analytics & Reporting (Woche 13–14)
**Ziel:** Daten sichtbar machen

- [ ] Kategorie-Donut-Chart (Monatsübersicht)
- [ ] Ausgaben-Zeitreihe (Liniendiagramm, 12 Monate)
- [ ] Monat-für-Monat Vergleich
- [ ] Sparquote-Berechnung
- [ ] PDF-Monatsbericht (Pro-Feature, n8n Workflow)
- [ ] JSON-Export (vollständig)
- [ ] DSGVO-Datenauskunft (vollständiger Export)

**Akzeptanzkriterien:**
- Charts rendern korrekt auf Mobile + Desktop
- PDF-Bericht enthält alle Kategorien und Vergleichswerte

### M7 — Bank Sync (Woche 15–17)
**Ziel:** Manuelle Eingabe optional machen (Business)

- [ ] GoCardless API-Integration via n8n
- [ ] Kontoverbindung in Profil (Business-Tier)
- [ ] Täglicher automatischer Import
- [ ] Duplikat-Schutz via `external_id`
- [ ] Import-Prüfeingang für Bank-Transaktionen
- [ ] Automatische Kategorisierung
- [ ] Bank-Sync-Status in Profil

**Akzeptanzkriterien:**
- Neue Bank-Transaktion erscheint innerhalb 24h im Prüfeingang
- Kein Duplikat nach doppeltem Import

### M8 — i18n & Multi-Currency (Woche 18–19)
**Ziel:** Internationalen Markt öffnen

- [ ] Paraglide-JS Setup (Deutsch + Englisch)
- [ ] Alle UI-Strings externalisiert
- [ ] Währungsauswahl je User + je Gruppe
- [ ] Wechselkurse via Open Exchange Rates (gecacht)
- [ ] Anzeigekonvertierung (Gruppenw. → Anzeigewährung)
- [ ] Locale-korrektes Zahlenformat

**Akzeptanzkriterien:**
- Vollständige EN-Übersetzung ohne fehlende Strings
- Beträge korrekt in USD angezeigt für EUR-Gruppe

### M9 — Public Launch (Woche 20)
**Ziel:** Öffentliche Beta starten

- [ ] Landing Page (/, public)
- [ ] SEO-Meta-Tags + Open Graph
- [ ] Datenschutzerklärung (DSGVO-konform)
- [ ] Nutzungsbedingungen
- [ ] Impressum
- [ ] Onboarding-Tutorial (3 Schritte interaktiv)
- [ ] PostHog Analytics (Funnel-Tracking)
- [ ] Feedback-Widget (PostHog Surveys)
- [ ] Sentry Error Tracking live

**Akzeptanzkriterien:**
- Lighthouse Desktop Score ≥ 95, Mobile ≥ 90
- DSGVO-Audit bestanden (kein US-Drittanbieter ohne Einwilligung)
- 0 kritische Sentry-Fehler in der ersten Stunde

### M10 — Mobile Apps (Phase 2)
**Ziel:** iOS/Android App Store Präsenz

- [ ] Capacitor Wrapper Setup
- [ ] Native Push Notifications (via Capacitor)
- [ ] Kamera-Plugin (bessere Belegerfassung)
- [ ] Biometrie-Login (FaceID / Fingerprint)
- [ ] App Store Connect + Google Play Console
- [ ] TestFlight Beta / Internal Testing Track

---

## 12. Infrastructure & Operations

### 12.1 Docker Compose (Produktion)

```yaml
services:
  frontend:
    image: ghcr.io/user/fairshare-frontend:${TAG}
    restart: unless-stopped
    ports: ["3000:3000"]
    environment:
      PUBLIC_PB_URL: ${PB_URL}
      PUBLIC_STRIPE_KEY: ${STRIPE_PUBLIC_KEY}
      PUBLIC_POSTHOG_KEY: ${POSTHOG_KEY}

  pocketbase:
    image: ghcr.io/user/fairshare-pocketbase:0.22.x  # Version pinnen!
    restart: unless-stopped
    volumes:
      - pb_data:/pb/pb_data
      - pb_hooks:/pb/pb_hooks
    ports: ["8090:8090"]

  n8n:
    image: n8nio/n8n:1.x.x  # Version pinnen!
    restart: unless-stopped
    volumes:
      - n8n_data:/home/node/.n8n
    environment:
      N8N_BASIC_AUTH_ACTIVE: "true"
      N8N_ENCRYPTION_KEY: ${N8N_ENCRYPTION_KEY}

volumes:
  pb_data:
  pb_hooks:
  n8n_data:
```

### 12.2 GitHub Actions CI

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  ci:
    steps:
      - npm ci
      - npm run check      # TypeScript
      - npm run lint        # ESLint
      - npx vitest run      # Unit Tests
      - npx playwright test # E2E Tests (gegen PocketBase-Testinstanz)
      - npm run build       # Produktions-Build
```

### 12.3 Monitoring Stack

| Tool | Zweck | Trigger |
|---|---|---|
| Sentry | JS-Fehler + PocketBase-Hook-Fehler | Alert ab 10 Fehlern/Stunde |
| PostHog | Funnel, Feature Flags, Recordings | — |
| BetterStack | Uptime (HTTP-Check alle 60s) | Alert bei Ausfall >2min |
| Coolify Health | Container-Status | Neustart bei Crash |

### 12.4 Backup-Strategie

- PocketBase `pb_data`: täglich via Coolify Volume Backup (S3-kompatibel)
- Cloudflare R2: Built-in Geo-Redundanz
- Retention: 30 Tage rolling
- Restore-Test: monatlich

### 12.5 Security Checklist

- [ ] Rate Limiting: 100 req/min/IP + 50 req/min/User (Upstash Redis)
- [ ] PocketBase-Hooks: Stripe-Webhook-Signatur validieren
- [ ] R2-Buckets: Private (kein public access), signed URLs mit TTL
- [ ] Secrets: Nur in Coolify-Umgebungsvariablen, nie im Repository
- [ ] Dependencies: `npm audit` in CI, Dependabot aktiviert
- [ ] Headers: HSTS, CSP, X-Frame-Options (via SvelteKit hooks.server.ts)
- [ ] PocketBase-Admin: Nicht auf Port 8090 öffentlich — nur via Tunnel/VPN
- [ ] 2FA für PocketBase-Admin-Account erzwingen
- [ ] Docker-Images: konkrete Versions-Tags (kein `latest`)
- [ ] PocketBase-Regeln: `users.income` nur von eigenem User schreibbar

---

## 13. Offene Risiken & Entscheidungen

| # | Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|---|---|---|---|---|
| 1 | PocketBase skaliert nicht bei 10k+ Usern | mittel | hoch | Migration zu PostgreSQL via pgx wenn nötig, Repository Pattern macht das möglich |
| 2 | Stripe nicht in allen Märkten verfügbar | niedrig | mittel | Paddle als Fallback evaluieren |
| 3 | OpenAI Vision API teuer bei hohem OCR-Volumen | hoch | mittel | Rate Limit je User, nur Pro-Feature |
| 4 | GoCardless PSD2-Kosten | mittel | mittel | Business-Only, Preisgestaltung anpassen |
| 5 | DSGVO-Verstoß durch PostHog/Sentry | mittel | hoch | EU-Cloud-Instanzen nutzen, Einwilligungs-Banner |
| 6 | Offline-Konflikt beide Partner | mittel | mittel | Last-Write-Wins + Konflikt-UI |
| 7 | App Store Ablehnung bei Capacitor | niedrig | mittel | Safari-PWA als Fallback für iOS |

---

## 14. Erfolgsmessung (KPIs)

| Metrik | Free | Pro | Business |
|---|---|---|---|
| Registrierungen | — | — | — |
| Aktive Nutzer/Monat | — | — | — |
| Transactions/User/Monat | Ziel ≥ 15 | Ziel ≥ 30 | Ziel ≥ 50 |
| Conversion Free → Pro | Ziel ≥ 8% | — | — |
| Churn Rate (monatlich) | — | Ziel < 5% | Ziel < 3% |
| Onboarding Completion | Ziel ≥ 70% | — | — |
| NPS | — | Ziel ≥ 40 | Ziel ≥ 50 |

---

## 15. Verknüpfte Dokumente

- [[FairShare_Backlog]] — Technischer Aufgaben-Backlog (P0–P4)
- [[FairShare_Roadmap]] — Zeitplan und Meilensteine
- [[Documentation]] — Technische Architektur-Doku
- `agents.md` — Coding-Agent-Instruktionen (Code-Repo)
