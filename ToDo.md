## Gesamteinschätzung

Die Heimfinanz-App ist bereits deutlich weiter als ein einfaches MVP. Die Grundidee ist gut: mobile Nutzung, schnelle Erfassung, getrennte Konten, Gemeinschaftskasse, Partner-Verknüpfung, Abrechnung, wiederkehrende Ausgaben und eine übersichtliche Monatsstatistik. Im ursprünglichen Konzept ist sogar ausdrücklich vorgesehen, dass eine Ausgabe in maximal drei Taps erfasst werden kann. ([GitHub][1])

Für die private Nutzung würde ich jetzt **nicht sofort weitere große Module hinzufügen**. Der höchste Nutzen entsteht zunächst durch:

1. absolut verlässliche Berechnungen,
2. eine noch schnellere Alltagserfassung,
3. verständliche Abrechnungen,
4. robuste Offline-Nutzung,
5. Backups und einfache Korrekturmöglichkeiten.

Ein kompletter Neuaufbau ist nicht erforderlich. Die vorhandene Basis ist sinnvoll schlank.

---

# 1. Zuerst beheben: Risiken für falsche Finanzdaten

Diese Punkte sind wichtiger als neue Komfortfunktionen.

| Priorität | Thema                                  | Warum es wichtig ist                                                                                                                                                                            | Empfohlene Änderung                                                                                                                                                  |
| --------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0        | Abrechnungsmodus eindeutig festlegen   | Aktuell existieren gleichzeitig eine normale 50/50-Berechnung und eine einkommensabhängige Fair-Share-Empfehlung. Der Abrechnungsbutton verwendet weiterhin den normalen Saldo.                 | In den Einstellungen einen Haushaltsmodus auswählen: **50/50** oder **nach Nettoeinkommen**. Dieselbe Berechnung muss auf Startseite, Verlauf und Abrechnung gelten. |
| P0        | Abrechnung atomar ausführen            | Beim Abrechnen werden mehrere Buchungen einzeln aktualisiert. Scheitert eine Anfrage mittendrin, können bereits einige Buchungen serverseitig als abgerechnet markiert sein, andere aber nicht. | Einen serverseitigen Abrechnungs-Endpunkt verwenden. Entweder alles wird gespeichert oder nichts. Zusätzlich Status `Entwurf`, `bezahlt`, `storniert`.               |
| P0        | Doppelte Fixkosten verhindern          | Wiederkehrende Buchungen werden clientseitig erzeugt. Öffnen beide Partner die App nahezu gleichzeitig, können dieselben Fixkosten doppelt entstehen.                                           | Pro Regel und Fälligkeitsdatum einen eindeutigen Schlüssel speichern, etwa `regel_id + faelligkeitsdatum`. Die Erzeugung serverseitig idempotent machen.             |
| P0        | Benutzerdefinierte Aufteilungen prüfen | Die Bearbeitungsseite kennt Modi wie `fair`, `me`, `partner` und `custom`. Die zentrale Berechnung fällt bei nicht speziell behandelten Modi jedoch auf 50/50 zurück.                           | Entweder vorläufig nur vollständig implementierte Modi zulassen oder sämtliche Modi zentral berechnen und testen.                                                    |
| P0        | Eingabefehler sichtbar behandeln       | Beim Speichern wird ein Fehler im Store abgefangen, aber nicht weitergegeben. Die Eingabemaske kann dadurch geschlossen werden, obwohl die Buchung nicht gespeichert wurde.                     | Bei Fehlern in der Maske bleiben, deutliche Meldung anzeigen und erneutes Speichern anbieten.                                                                        |

Die Inkonsistenz beim Fair-Share-Modus ist bereits in mehreren Stellen sichtbar: Die Startseite zeigt den normalen Saldo, zusätzlich erscheint eine einkommensabhängige Empfehlung, während die Abrechnung weiterhin mit dem normalen Saldo arbeitet. ([github.com][2])

Auch die aktuelle Mehrfachaktualisierung beim Abrechnen sollte geändert werden: Die Abrechnung wird zuerst angelegt, anschließend werden die einzelnen Transaktionen parallel aktualisiert. Ein lokales Zurücksetzen im Browser kann bereits gespeicherte Serveränderungen nicht zuverlässig rückgängig machen. ([GitHub][2])

PocketBase lässt sich bei solchen Spezialfällen durch eigene serverseitige Routen erweitern. Für eine private App reicht ein schlanker Endpunkt für „Abrechnung abschließen“ und einer für „fällige Fixkosten erzeugen“. ([pocketbase.io][3])

---

# 2. Die wichtigste Produktentscheidung: Wie wird fair abgerechnet?

Die App sollte nicht gleichzeitig zwei unterschiedliche Wahrheiten zeigen.

## Empfohlene Lösung

Unter **Profil → Haushalt → Aufteilung** wird einmal festgelegt:

* **Gleichmäßig 50/50**
* **Nach Nettoeinkommen**
* optional später: **individuelle Aufteilung pro Ausgabe**

Beispiel:

> Viktor übernimmt 60 %, Anna übernimmt 40 %.
> Gültig ab: 1. Juli 2026.

Wichtig ist das Gültigkeitsdatum. Ändert sich später ein Einkommen, dürfen alte Buchungen nicht unbemerkt rückwirkend neu berechnet werden. Sinnvoll ist daher, bei jeder Buchung einen Snapshot zu speichern:

```text
split_mode: income_ratio
split_ratio_paid_by: 60
split_ratio_partner: 40
```

Damit bleibt jede frühere Abrechnung nachvollziehbar.

Für den privaten Alltag genügt ein globaler Standard. Die Sonderaufteilung einzelner Buchungen sollte hinter **„Weitere Optionen“** liegen und nicht jede Erfassung verlangsamen.

---

# 3. Frictionless UX: Eine Ausgabe in wenigen Sekunden erfassen

Der häufigste Ablauf sollte extrem einfach sein:

```text
Plus drücken
→ Betrag eingeben
→ zuletzt verwendete Kategorie antippen
→ speichern
```

Aktuell enthält die Erfassungsseite bereits Betrag, Notiz, Kategorien, Zahler und verschiedene Typen. Das ist funktional gut, aber für den täglichen Einkauf kann die Oberfläche weiter reduziert werden. ([GitHub][4])

## Idealer Standardablauf

### Sofort sichtbar

* Zahlenfeld mit automatisch geöffnetem Nummernblock
* große Betragsanzeige
* 4 bis 6 zuletzt verwendete Kategorien
* Schaltfläche **Speichern**
* Zahler als kleiner Umschalter mit sinnvoller Vorauswahl

### Eingeklappt unter „Weitere Optionen“

* Datum ändern
* Notiz
* andere Person hat bezahlt
* Gemeinschaftskasse
* individuelle Aufteilung
* Belegfoto
* wiederkehrende Ausgabe anlegen

### Sinnvolle Automatiken

* Zahler standardmäßig: angemeldete Person
* zuletzt verwendete Kategorie vorschlagen
* bei gleichem Notiztext dieselbe Kategorie vorschlagen
* nach Speichern Toast anzeigen:
  **„24,80 € Lebensmittel gespeichert · Rückgängig“**
* zweite Aktion im Toast:
  **„Weitere Ausgabe erfassen“**

## Kleine Funktionen mit sehr hohem Nutzen

| Funktion                               | Nutzen im Alltag                                                              |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| **Letzte Buchung wiederholen**         | Ideal für wiederkehrende kleine Ausgaben wie Bäcker, Parken oder Taschengeld. |
| **Buchung duplizieren**                | Betrag oder Datum kurz anpassen, statt alles erneut einzugeben.               |
| **Favoriten-Kategorien**               | Lebensmittel, Drogerie, Tanken, Restaurant direkt erreichbar.                 |
| **Rückgängig nach Speichern**          | Verhindert unnötiges Öffnen und Bearbeiten bei Tippfehlern.                   |
| **Schnellzugriff Gemeinschaftskasse**  | Einzahlung oder Barausgabe mit einem zusätzlichen Tap.                        |
| **Haptisches oder visuelles Feedback** | Klare Bestätigung, dass die Buchung wirklich gespeichert wurde.               |

## Betragseingabe robuster machen

Die aktuelle Validierung basiert auf `parseFloat`. Dadurch können ungültige Eingaben teilweise unerwartet akzeptiert werden, beispielsweise Texte, die mit einer Zahl beginnen. Außerdem sollten Nullbeträge und negative Beträge nicht versehentlich als normale Ausgaben gespeichert werden. ([GitHub][4])

Empfehlung:

* Komma und Punkt akzeptieren
* intern immer Cent-Beträge speichern
* nur positive Beträge zulassen
* negative Beträge ausschließlich über einen klaren Vorgang **„Korrekturbuchung“**
* eine zentrale Money-Input-Komponente für alle Formulare verwenden

---

# 4. Startseite: Saldo statt Einkommen in den Mittelpunkt

Die Startseite zeigt aktuell das gemeinsame Einkommen sehr prominent. Für die Einrichtung ist das nützlich, im täglichen Einsatz ist aber meistens eine andere Frage entscheidend:

> Muss gerade jemand Geld überweisen?

Der große Hauptbereich sollte daher zeigen:

```text
Anna schuldet dir 84,30 €
```

oder:

```text
Alles ausgeglichen
```

Darunter:

* Gemeinschaftskasse: `126,50 €`
* Ausgaben diesen Monat: `1.248,20 €`
* Fixkosten in den nächsten 14 Tagen: `380,00 €`
* 3 letzte offene Buchungen

Das Einkommen kann weiterhin in den Einstellungen und in einer kleinen Fair-Share-Zusammenfassung stehen. Aktuell nimmt es im Hero-Bereich deutlich mehr Raum ein als der persönliche Saldo. ([GitHub][5])

## Startseite vereinfachen

Der ursprüngliche Plan sah eine mobile Bottom-Navigation und nur die letzten fünf Transaktionen vor. In der aktuellen Umsetzung liegen Navigationselemente oben und die Liste kann umfangreicher werden. ([GitHub][1])

Für die mobile Nutzung wäre besser:

```text
Übersicht | Verlauf | + | Fixkosten | Profil
```

Der Plus-Button bleibt mittig und gut mit dem Daumen erreichbar.

Die Liste auf der Startseite sollte maximal fünf Einträge zeigen und darunter:

```text
Alle Buchungen anzeigen
```

Je nach gewünschter Logik sollte die Überschrift außerdem eindeutig sein:

* **Letzte Buchungen**, wenn auch abgerechnete Ausgaben erscheinen
* **Offene Buchungen**, wenn nur noch nicht abgerechnete Positionen erscheinen

---

# 5. Abrechnung verständlicher machen

Momentan kann die Abrechnung recht direkt ausgelöst werden. Für Finanzdaten ist ein kurzer Bestätigungsdialog sinnvoll. ([GitHub][6])

## Empfohlene Abrechnungsvorschau

```text
Abrechnung Juni 2026

Anna überweist Viktor: 84,30 €

Berechnung:
• Gemeinsame Ausgaben: 1.280,00 €
• Von Viktor bezahlt: 724,30 €
• Von Anna bezahlt: 555,70 €
• Aufteilung: 50/50

[Abbrechen]   [Als bezahlt markieren]
```

Bei einkommensabhängiger Aufteilung:

```text
Aufteilung: 60 % / 40 %
Gültig seit: 1. Juni 2026
```

## Eine Abrechnung sollte dauerhaft speichern

* Zeitraum oder Stichtag
* Betrag
* zahlende Person
* empfangende Person
* verwendeter Aufteilungsmodus
* verwendetes Verhältnis
* Status: `offen`, `bezahlt`, `storniert`
* optionale Notiz
* enthaltene Buchungen
* Erstellungsdatum und Änderungsdatum

Das bestehende Settlement-Modell enthält bereits Basisfelder, sollte aber um Richtung, Status und Berechnungsgrundlage erweitert werden. ([GitHub][7])

## Verlauf besser strukturieren

Statt einer langen Liste:

```text
Juni 2026
  Offene Ausgaben
  Abrechnung vom 30.06.2026
    18 Buchungen · Anna → Viktor · 84,30 €

Mai 2026
  Abrechnung vom 31.05.2026
    22 Buchungen · Viktor → Anna · 42,80 €
```

Zusätzlich sinnvoll:

* Monatsfilter
* Suche in Notizen
* Filter nach Kategorie
* Filter nach Zahler
* nur offene Buchungen
* Gemeinschaftskasse separat
* Abrechnung aufklappen
* Abrechnungsübersicht kopieren oder teilen
* CSV-Export

---

# 6. Fixkosten statt „Abos“

Die App verwendet an mehreren Stellen den Begriff „Abos“, obwohl die Beispiele auch Miete, Versicherung und Internet enthalten. ([GitHub][8])

Besser:

```text
Fixkosten
```

oder:

```text
Wiederkehrend
```

Innerhalb eines Eintrags kann optional ein Typ gewählt werden:

* Miete
* Vertrag
* Abo
* Versicherung
* Kredit
* Sonstiges

## Fixkosten-Seite verbessern

Jede Karte sollte vorrangig zeigen:

```text
Miete
1.200,00 € · monatlich
Nächste Buchung: 01.07.2026
Bezahlt von Viktor · 50/50
```

Die zuletzt erzeugte Buchung ist technisch nützlich, aber für den Nutzer ist die **nächste Fälligkeit** meist wichtiger.

Zusätzliche Komfortfunktionen:

* „einmal überspringen“
* pausieren bis zu einem Datum
* Änderung erst ab nächster Fälligkeit
* Enddatum
* letzter Kalendertag des Monats
* Übersicht: Fixkosten pro Monat
* Übersicht: fällig in den nächsten 30 Tagen
* Vorschlag: „Diese Ausgabe kommt häufig vor. Als Fixkosten speichern?“

## Sonderfall Monatsende

Bei einem gewünschten Buchungstag 29, 30 oder 31 muss die App sauber mit Februar und kürzeren Monaten umgehen. Die aktuelle Datumserzeugung arbeitet mit `setUTCDate`, wodurch ungültige Datumswerte in den Folgemonat überlaufen können. ([GitHub][9])

Sinnvolle Auswahl:

```text
Tag 31 beziehungsweise letzter Kalendertag
```

Dazu automatisierte Tests für Februar, Schaltjahre sowie Monate mit 30 und 31 Tagen.

---

# 7. Gemeinschaftskasse praxisnah gestalten

Die Gemeinschaftskasse ist bereits vorhanden und sollte zu einem echten Alltagstool werden. ([GitHub][2])

Besonders sinnvoll:

### Kassensturz

```text
Erwarteter Kassenstand: 126,50 €
Tatsächlich vorhanden: 121,50 €
Differenz: -5,00 €

[Korrekturbuchung erstellen]
```

### Warnung statt Blockade

Wenn eine Barausgabe den Kassenstand negativ machen würde:

```text
Die Gemeinschaftskasse wäre danach 14,20 € im Minus.
Trotzdem buchen?
```

Nicht hart blockieren, da manchmal eine Einzahlung vergessen wurde.

### Eigene Kassenansicht

* Einzahlungen
* Barausgaben
* Korrekturen
* aktueller Sollstand
* letzter Kassensturz
* Filter nur Gemeinschaftskasse

---

# 8. Offline-first konsequent fertigstellen

Im Konzept ist Offline-first ausdrücklich vorgesehen. Die PWA-Konfiguration cached bereits API-Antworten mit einer Network-First-Strategie. In dem sichtbaren Code erkenne ich jedoch noch keine belastbare Warteschlange für neu erfasste oder geänderte Buchungen. ([GitHub][1])

Für eine Heimfinanz-App ist gerade der Supermarkt ein typischer Ort mit instabilem Empfang. Eine Ausgabe darf dann nicht verloren gehen.

## Empfohlenes Verhalten

```text
24,80 € Lebensmittel
Offline gespeichert
Wird automatisch synchronisiert, sobald eine Verbindung besteht.
```

Technisch:

* POST-, PUT- und DELETE-Anfragen lokal in IndexedDB puffern
* jede Buchung mit clientseitiger UUID versehen
* Wiederholungen idempotent behandeln
* Synchronisationsstatus anzeigen
* Konflikte sichtbar machen
* bei Abrechnung keine automatische Konfliktauflösung verwenden

Workbox bietet für fehlgeschlagene Requests eine Background-Sync-Funktion, die Anfragen lokal speichert und später erneut ausführt. ([Chrome for Developers][10])

In der Navigation genügt ein kleiner Status:

```text
● synchronisiert
```

oder:

```text
● 2 Buchungen warten auf Synchronisierung
```

Beim Logout sollten nutzerbezogene Caches und wartende lokale Daten sorgfältig behandelt werden, damit auf einem gemeinsam verwendeten Gerät keine alten Finanzdaten sichtbar bleiben.

---

# 9. Monatsübersicht: gute Basis, nur gezielt erweitern

Die Monatsstatistik ist bereits sinnvoll umgesetzt: Monat wechseln, Gesamtausgaben anzeigen und Kategorien visuell aufschlüsseln. ([GitHub][11])

Für private Nutzung reichen wenige Ergänzungen:

* Vergleich zum Vormonat: `+84,20 €` oder `+7 %`
* Tap auf Kategorie öffnet gefilterten Verlauf
* Aufteilung in Fixkosten und variable Ausgaben
* optional: Gemeinschaftskasse ein- oder ausblenden
* optional später: einfaches Kategorienlimit

Keine aufwendigen Diagrammwelten erforderlich. Ein verständlicher Monatsvergleich bringt mehr Nutzen als zehn verschiedene Charts.

---

# 10. Profil und Onboarding verbessern

Das Onboarding enthält bereits Profil, optionales Einkommen und Partner-Einladung. Das ist eine gute Grundlage. ([GitHub][12])

Direkt nach der Partner-Verknüpfung sollte eine klare Frage erscheinen:

```text
Wie möchtet ihr gemeinsame Ausgaben aufteilen?

○ Gleichmäßig 50/50
○ Nach Nettoeinkommen
○ Später festlegen
```

Danach eine Mini-Einführung:

```text
1. Plus drücken
2. Betrag und Kategorie wählen
3. Bei Bedarf monatlich abrechnen
```

## Profil sinnvoll ergänzen

Unter **Haushalt und Daten**:

* Aufteilungsmodus
* Verhältnis und Gültigkeitsdatum
* Partner
* Export als CSV
* Export als JSON
* Synchronisationsstatus
* letzte erfolgreiche Datensicherung
* Daten vollständig löschen
* App-Version

Die vorhandene Profilseite zeigt bereits Einkommen, Aufteilungsverhältnis und Partnerschaftsinformationen. ([GitHub][13])

---

# 11. Funktionen nach Nutzen priorisieren

## Als Nächstes sinnvoll

| Funktion                       | Begründung                                      |
| ------------------------------ | ----------------------------------------------- |
| Einheitlicher Abrechnungsmodus | Verhindert widersprüchliche Beträge.            |
| Atomare Abrechnung             | Verhindert teilweise gespeicherte Abrechnungen. |
| Idempotente Fixkosten          | Verhindert Dubletten.                           |
| Undo nach Buchung              | Spart viele Korrekturschritte.                  |
| Letzte Buchung wiederholen     | Sehr hoher Alltagsnutzen bei wenig Komplexität. |
| Offline-Warteschlange          | Verhindert verlorene Eingaben.                  |
| Abrechnungsvorschau            | Schafft Vertrauen und Nachvollziehbarkeit.      |
| CSV- und JSON-Export           | Wichtig für Sicherheit und spätere Auswertung.  |
| Kassensturz                    | Macht die Gemeinschaftskasse praktisch nutzbar. |
| Monatsgruppen im Verlauf       | Reduziert visuelle Unruhe.                      |

## Später nur bei echtem Bedarf

| Funktion            | Wann sie sinnvoll wird                                       |
| ------------------- | ------------------------------------------------------------ |
| Belegfoto           | Wenn Belege häufig gesucht oder diskutiert werden.           |
| OCR-Erkennung       | Wenn das manuelle Erfassen tatsächlich lästig wird.          |
| Kategorienbudgets   | Nach einigen Monaten realer Nutzung.                         |
| Sparziele           | Wenn die App nicht nur abrechnen, sondern planen soll.       |
| Haushaltskalender   | Falls Fälligkeiten und Verträge wichtiger werden.            |
| Push-Erinnerungen   | Für offene Abrechnung oder fällige Fixkosten.                |
| Biometrische Sperre | Wenn die App auf gemeinsam genutzten Geräten verwendet wird. |

## Vorerst bewusst nicht bauen

* Bank-Synchronisierung
* vollständige Buchhaltungslogik
* komplexes Vertragsmanagement
* Multi-Haushalt-Verwaltung
* Rollen- und Rechtesystem für viele Personen
* KI-Kategorisierung
* umfangreiche Budgetplanung
* SaaS-Adminbereich

Bank-Synchronisierung und OCR stehen bereits als spätere Ideen im Plan. Für die private Nutzung würden sie aktuell deutlich mehr technische Komplexität als unmittelbaren Nutzen erzeugen. ([GitHub][1])

---

# 12. Technische Qualität und Datenschutz

## Tests ergänzen

Die vorhandene CI führt Installation, Linting, Typprüfung und Build aus. Ein Testskript ist in den sichtbaren Projektdateien noch nicht enthalten. ([GitHub][14])

Für diese App sind keine hunderte Tests nötig. Wenige gezielte Tests schützen bereits die wichtigsten Daten:

### Berechnungen

* Ausgabe 10,00 € bei 50/50
* Ausgabe 9,99 € bei 50/50
* Einkommen 60/40
* Gemeinschaftskasse
* Einzahlung
* Korrekturbuchung
* individuelle Aufteilung
* Änderung des Einkommens ab einem Stichtag

### Fixkosten

* Februar
* Schaltjahr
* Tag 29, 30 und 31
* letzter Kalendertag
* zwei Geräte erzeugen dieselbe Fälligkeit
* pausierte Regel
* einmal übersprungene Regel

### Abrechnung

* alle Buchungen erfolgreich
* eine Aktualisierung schlägt fehl
* erneutes Absenden derselben Abrechnung
* Offline-Zustand
* Abrechnung mit bereits enthaltenen Buchungen

## Backup unbedingt einrichten

Bei privaten Finanzdaten ist ein funktionierendes Backup wichtiger als viele Komfortfunktionen. PocketBase unterstützt integrierte Backups und Wiederherstellung sowie externe S3-kompatible Speicher. Die Dokumentation empfiehlt für externe Backups einen getrennten Bucket. ([pocketbase.io][15])

Pragmatische Lösung:

* nächtliches Backup
* Kopie außerhalb des Servers
* monatlicher Restore-Test
* zusätzlicher manueller CSV- und JSON-Export in der App

## Öffentliches Repository prüfen

Das Repository ist derzeit öffentlich sichtbar. Außerdem ist die PocketBase-Adresse in der Frontend-Konfiguration enthalten. ([GitHub][16])

Die Backend-Adresse im Frontend ist bei einer clientseitigen PocketBase-App nicht automatisch ein Geheimnis. PocketBase ist für direkte Client-Zugriffe ausgelegt; die Sicherheit muss über Authentifizierung und Collection-Regeln gewährleistet werden. ([pocketbase.io][17])

Für eine vorerst rein private App würde ich dennoch:

* das Repository privat stellen, sofern Open Source nicht beabsichtigt ist,
* keine echten Nutzerdaten oder Secrets einchecken,
* Collection-Regeln erneut prüfen,
* Änderungen und Löschungen protokollieren,
* Buchungen eher „stornieren“ als endgültig löschen,
* serverseitige Backups einrichten.

## README ersetzen

Das aktuelle README entspricht noch weitgehend der Standardvorlage von SvelteKit. ([GitHub][16])

Ein kurzes internes README sollte enthalten:

* Zweck der App
* lokale Installation
* Deployment
* Umgebungsvariablen
* PocketBase-Schema aktualisieren
* Backup und Restore
* Berechnungsregeln
* Offline-Verhalten
* Testfälle
* bekannte Einschränkungen

---

# 13. Kleine Sofortverbesserungen

Ein paar Änderungen benötigen kaum Aufwand, verbessern aber den Eindruck spürbar:

* Tippfehler korrigieren:
  `Werte auf Bestätigung von deines Partners.`
  → `Warte auf die Bestätigung deines Partners.`
* „Abos“ überall durch „Fixkosten“ ersetzen
* offene Buchungen auf der Startseite auf fünf begrenzen
* leere Zustände freundlicher formulieren:

  ```text
  Noch keine Ausgaben vorhanden.
  Erfasse deine erste Ausgabe über das Plus.
  ```
* Speichern-Schaltfläche bei ungültigem Betrag deaktivieren
* bei Ladezuständen Skeletons statt springender Inhalte anzeigen
* nach Partner-Verknüpfung sofort den Aufteilungsmodus auswählen
* beim Löschen immer Undo oder Bestätigung anbieten
* bei bearbeiteten Buchungen „zuletzt geändert“ anzeigen

---

# Empfohlene Reihenfolge

## Phase A: Finanzdaten absichern

* zentralen Abrechnungsmodus einführen
* Berechnungslogik vereinheitlichen
* benutzerdefinierte Splits vervollständigen oder ausblenden
* atomare Abrechnung implementieren
* Fixkosten idempotent erzeugen
* Betragsvalidierung zentralisieren
* Tests für Kernlogik ergänzen

## Phase B: Alltag beschleunigen

* Erfassungsmaske reduzieren
* Favoriten und zuletzt verwendete Kategorien
* Undo
* Buchung duplizieren
* letzte Buchung wiederholen
* Bottom-Navigation
* maximal fünf Buchungen auf der Startseite

## Phase C: Komfort und Sicherheit

* Offline-Warteschlange
* CSV- und JSON-Export
* Kassensturz
* Monatsgruppen im Verlauf
* Backup-Anzeige
* Fixkosten-Vorschau
* Vormonatsvergleich

Der sinnvollste nächste Schritt wäre ein GitHub-Issue-Backlog mit P0-, P1- und P2-Tickets sowie klaren Akzeptanzkriterien pro Änderung.

[1]: https://github.com/Godsizee/Finanzen/blob/master/implementation_plan.md "Finanzen/implementation_plan.md at master · Godsizee/Finanzen · GitHub"
[2]: https://github.com/Godsizee/Finanzen/blob/master/src/lib/features/transactions/store.svelte.ts "Finanzen/src/lib/features/transactions/store.svelte.ts at master · Godsizee/Finanzen · GitHub"
[3]: https://pocketbase.io/docs/how-to-use/?utm_source=chatgpt.com "Introduction - How to use PocketBase - Docs"
[4]: https://github.com/Godsizee/Finanzen/blob/master/src/routes/add/%2Bpage.svelte "Finanzen/src/routes/add/+page.svelte at master · Godsizee/Finanzen · GitHub"
[5]: https://github.com/Godsizee/Finanzen/blob/master/src/lib/features/transactions/components/HeroCard.svelte "Finanzen/src/lib/features/transactions/components/HeroCard.svelte at master · Godsizee/Finanzen · GitHub"
[6]: https://github.com/Godsizee/Finanzen/blob/master/src/routes/history/%2Bpage.svelte "Finanzen/src/routes/history/+page.svelte at master · Godsizee/Finanzen · GitHub"
[7]: https://github.com/Godsizee/Finanzen/blob/master/src/lib/features/settlements/api.ts "Finanzen/src/lib/features/settlements/api.ts at master · Godsizee/Finanzen · GitHub"
[8]: https://github.com/Godsizee/Finanzen/blob/master/src/routes/recurring/%2Bpage.svelte "Finanzen/src/routes/recurring/+page.svelte at master · Godsizee/Finanzen · GitHub"
[9]: https://github.com/Godsizee/Finanzen/blob/master/src/lib/features/recurring/store.svelte.ts "Finanzen/src/lib/features/recurring/store.svelte.ts at master · Godsizee/Finanzen · GitHub"
[10]: https://developer.chrome.com/docs/workbox/modules/workbox-background-sync?utm_source=chatgpt.com "workbox-background-sync | Modules - Chrome for Developers"
[11]: https://github.com/Godsizee/Finanzen/blob/master/src/lib/features/transactions/components/MonthlyStats.svelte "Finanzen/src/lib/features/transactions/components/MonthlyStats.svelte at master · Godsizee/Finanzen · GitHub"
[12]: https://github.com/Godsizee/Finanzen/blob/master/src/routes/onboarding/%2Bpage.svelte "Finanzen/src/routes/onboarding/+page.svelte at master · Godsizee/Finanzen · GitHub"
[13]: https://github.com/Godsizee/Finanzen/blob/master/src/routes/profile/%2Bpage.svelte "Finanzen/src/routes/profile/+page.svelte at master · Godsizee/Finanzen · GitHub"
[14]: https://github.com/Godsizee/Finanzen/blob/master/package.json "Finanzen/package.json at master · Godsizee/Finanzen · GitHub"
[15]: https://pocketbase.io/docs/going-to-production/?utm_source=chatgpt.com "Going to production - Docs"
[16]: https://github.com/Godsizee/Finanzen "GitHub - Godsizee/Finanzen · GitHub"
[17]: https://pocketbase.io/docs/api-rules-and-filters/?utm_source=chatgpt.com "Introduction - API rules and filters - Docs"
