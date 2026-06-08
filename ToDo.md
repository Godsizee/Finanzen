---
title: Finanzen-App – UX-Analyse und priorisierte Erweiterungen
aliases:
  - Finanzen App UX
  - Haushalts-App Verbesserungen
tags:
  - projekt/finanzen-app
  - ux
  - familienfinanzen
  - webentwicklung
  - roadmap
status: entwurf
created: 2026-06-08
updated: 2026-06-08
source_repository: https://github.com/Godsizee/Finanzen
---

# Finanzen-App – UX-Analyse und priorisierte Erweiterungen

> [!summary]
> Die App besitzt bereits eine gute fachliche Grundlage: Sie trennt sinnvoll zwischen **Zahlungsfluss** („Wer hat bezahlt?“) und **Kostenaufteilung** („Wer soll welchen Anteil tragen?“).  
> Der größte Hebel liegt jetzt nicht in möglichst vielen neuen Funktionen, sondern in einer schnelleren Bedienung, einer klareren Startseite und einer verständlichen Abrechnung.

## Inhaltsübersicht

- [[#1 Zielbild]]
- [[#2 Die drei wichtigsten UX-Verbesserungen]]
- [[#3 Weitere Verbesserungen mit hohem Nutzen]]
- [[#4 Sinnvolle Erweiterungen nach Mehrwert priorisiert]]
- [[#5 Empfohlene Umsetzungsreihenfolge]]
- [[#6 Abnahmekriterien für eine spürbar bessere Bedienbarkeit]]
- [[#7 Grundsätze für die Weiterentwicklung]]
- [[#8 Referenzen zum Projekt]]

---

## 1. Zielbild

Die App sollte im Alltag einer Familie drei Fragen besonders schnell beantworten:

1. **Wer muss wem aktuell Geld überweisen?**
2. **Wie viel Geld ist diesen Monat noch verfügbar?**
3. **Wie kann ich eine Ausgabe in wenigen Sekunden erfassen?**

Die Bedienung sollte konsequent auf Smartphones optimiert werden. Häufige Aktionen müssen ohne Umwege erreichbar sein. Komplexere Sonderfälle sollten erst dann sichtbar werden, wenn sie tatsächlich benötigt werden.

> [!important]
> Die App sollte nicht wie eine Buchhaltungssoftware wirken.  
> Sie sollte sich wie ein unkompliziertes gemeinsames Haushaltswerkzeug anfühlen.

---

## 2. Die drei wichtigsten UX-Verbesserungen

### 2.1 Startseite: Handlungsempfehlung statt abstrakter Kennzahl

Aktuell wird das gemeinsame Nettoeinkommen sehr prominent dargestellt. Für die tägliche Nutzung ist jedoch die offene Ausgleichszahlung wichtiger.

Die größte Aussage auf der Startseite sollte daher lauten:

> **Du bekommst 84,30 € zurück.**  
> Dein Partner sollte dir diesen Betrag überweisen.

oder:

> **Ihr seid quitt.**  
> Aktuell ist kein Ausgleich erforderlich.

Darunter können kompakt weitere Kennzahlen erscheinen:

- Gemeinsame Kasse: 215,80 €
- Ausgaben im Juni: 1.438,20 €
- Noch verfügbar im Juni: 1.126,40 €
- Standardaufteilung: 56 % / 44 % nach Einkommen

#### Umsetzung

- [ ] Hero-Card auf offenen Ausgleichsbetrag umstellen
- [ ] Aussage in verständlicher Sprache formulieren
- [ ] „Wer zahlt wem?“ immer explizit anzeigen
- [ ] Einkommen nur noch sekundär darstellen
- [ ] „Ihr seid quitt“ als positiven Nullzustand gestalten

**Nutzen:** Die App beantwortet die wichtigste Frage sofort, ohne dass Zahlen interpretiert werden müssen.

---

### 2.2 Feste Navigation am unteren Bildschirmrand

Für die mobile Nutzung sollte eine Bottom-Navigation eingeführt werden. Häufig genutzte Funktionen sind dort deutlich leichter mit dem Daumen erreichbar als im oberen Bereich des Bildschirms.

| Bereich   | Zweck                                   |
| --------- | --------------------------------------- |
| Übersicht | Aktueller Saldo und Monatsstatus        |
| Verlauf   | Ausgaben suchen, prüfen und korrigieren |
| **+**     | Neue Ausgabe oder Einzahlung            |
| Fixkosten | Wiederkehrende Kosten                   |
| Haushalt  | Partner, Aufteilung und Einstellungen   |

#### Umsetzung

- [ ] Zentrale Bottom-Navigation ergänzen
- [ ] Plus-Button deutlich hervorheben
- [ ] Aktiven Bereich sichtbar kennzeichnen
- [ ] Auf Desktop-Geräten alternative Seitenleiste verwenden
- [ ] Navigation auf allen Hauptseiten konsistent halten

**Nutzen:** Nutzer müssen nicht überlegen, wo sich Funktionen befinden. Die App wirkt wie eine vollständige Mobile-App statt wie eine mobile Website.

---

### 2.3 Schnellerfassung: Ausgabe in wenigen Sekunden speichern

Die häufigste Alltagssituation lautet beispielsweise:

> Ich habe gerade 42,80 € bei Rewe bezahlt.

Dafür sollte der Standardablauf nur aus drei Schritten bestehen:

1. Plus drücken
2. Betrag eingeben
3. Speichern

Die App sollte Standardwerte automatisch vorbelegen:

- Zahler: standardmäßig „Ich“
- Datum: „Heute“
- Kategorie: zuletzt verwendet oder wahrscheinlichste Kategorie
- Aufteilung: Haushaltsstandard
- Kasse: zuletzt genutzte Zahlungsquelle

Unter dem Betragsfeld können Schnellzugriffe erscheinen:

> Lebensmittel · Tanken · Drogerie · Restaurant · Mehr

Zusätzlich sinnvoll:

- „Letzte Ausgabe wiederholen“
- Snackbar mit **Rückgängig**
- Option „Noch eine Ausgabe erfassen“
- Automatischer Fokus auf das Betragsfeld
- Speichern über die Enter-Taste
- Frei auswählbares Buchungsdatum für nachträgliche Einträge

#### Umsetzung

- [ ] Minimalformular als Standardansicht bauen
- [ ] Erweiterte Felder einklappbar machen
- [ ] Zuletzt verwendete Kategorie merken
- [ ] Favoriten und Vorlagen ergänzen
- [ ] Rückgängig-Funktion nach dem Speichern anbieten
- [ ] Datum nachträglich änderbar machen

**Nutzen:** Die App wird tatsächlich alltagstauglich. Ausgaben lassen sich direkt nach dem Einkauf erfassen, bevor man sie vergisst.

---

## 3. Weitere Verbesserungen mit hohem Nutzen

### 3.1 Begriffe vereinfachen und Berechnung sichtbar machen

Die App verwendet fachlich sinnvolle Konzepte:

- Ausgabe
- Einzahlung
- Kasse
- Saldo
- einkommensbasierter Ausgleich
- offene Abrechnung

Für Nutzer sollte immer sichtbar sein, was eine Buchung konkret bewirkt.

Beispiel bei einer privaten Zahlung:

> Du hast 60,00 € bezahlt.  
> Dein Anteil: 30,00 €  
> Anteil deines Partners: 30,00 €

Beispiel bei Zahlung aus der Haushaltskasse:

> Die Ausgabe wird vollständig von der gemeinsamen Kasse abgezogen.

Unter **Haushalt** sollte eine globale Standardaufteilung hinterlegt werden:

- 50:50
- nach Nettoeinkommen
- individueller Prozentsatz

Sonderfälle erscheinen nur hinter:

> Anders aufteilen

---

### 3.2 Abrechnung sicherer und verständlicher gestalten

Vor einem Monatsabschluss oder einer Sammelabrechnung sollte ein Bestätigungsdialog erscheinen.

Beispiel:

> **Abrechnung bestätigen**  
> Dein Partner überweist dir 84,30 €.  
> Enthalten sind 17 offene Ausgaben.  
> Zeitraum: 1. bis 8. Juni 2026.

Buttons:

- Abbrechen
- Abrechnung abschließen

Nach dem Abschluss:

> Abrechnung abgeschlossen · **Rückgängig**

Zusätzlich sinnvoll:

- automatisch erzeugter Verwendungszweck
- PDF- oder CSV-Export
- gespeicherter Zeitraum
- nachvollziehbare Liste der enthaltenen Buchungen
- Änderungshinweis bei nachträglicher Korrektur

Beispiel für einen Verwendungszweck:

> Haushaltsausgleich Juni 2026

---

### 3.3 Verlauf zu einem echten Arbeitsbereich ausbauen

Der Verlauf sollte nicht nur Buchungen anzeigen, sondern auch schnelles Prüfen und Korrigieren ermöglichen.

Sinnvolle Funktionen:

- Monatsauswahl
- Suche nach Beschreibung oder Händler
- Filter nach Kategorie
- Filter nach Zahler
- Filter nach Zahlungsquelle
- Tabs: Offen · Abgerechnet · Alle
- Gruppierung nach Tagen
- Monatssumme
- Bearbeiten · Duplizieren · Löschen
- Rückgängig-Funktion

Beispiel:

> **Heute**  
> Rewe · Lebensmittel · bezahlt von dir · 42,80 €  
> Tankstelle · Mobilität · aus Haushaltskasse · 71,20 €

> **Gestern**  
> Apotheke · Gesundheit · bezahlt vom Partner · 18,40 €

---

### 3.4 Fixkosten stärker in die Übersicht integrieren

Auf der Startseite sollte ein kompakter Bereich erscheinen:

> **Demnächst fällig**  
> 12.06. Strom · 82,00 €  
> 15.06. Internet · 39,95 €  
> 18.06. Versicherung · 47,20 €

Fixkosten benötigen einen klaren Status:

- geplant
- fällig
- gebucht
- überfällig
- pausiert

Bei einer normalen Ausgabe sollte zusätzlich angeboten werden:

> Als monatliche Ausgabe speichern

---

### 3.5 Nur wenige aussagekräftige Kennzahlen anzeigen

Viele Finanz-Apps werden unübersichtlich, weil sie zu viele Statistiken anzeigen. Für die Startseite reichen wenige Kennzahlen:

1. Offener Ausgleich
2. Noch verfügbares Haushaltsbudget
3. Gemeinsame Kasse
4. Ausgaben im aktuellen Monat
5. Nächste Fixkosten

Optional:

> Lebensmittelbudget: 386 € von 600 € verwendet

---

### 3.6 Onboarding vereinfachen

Empfohlener Ablauf:

1. Vorname
2. Haushaltsmodell auswählen: 50:50 oder nach Einkommen
3. Partner per Link oder E-Mail einladen
4. Erste Beispielausgabe erfassen

Beim Einkommen sollte eine Erklärung stehen:

> Dein Nettoeinkommen wird ausschließlich verwendet, um euren fairen Kostenanteil zu berechnen. Die Angabe ist optional.

Zusätzlich zur E-Mail-Einladung sollte ein teilbarer Link angeboten werden, beispielsweise für WhatsApp.

---

### 3.7 Kleine Details mit großer Wirkung

- [ ] Buttons während des Speicherns deaktivieren
- [ ] Klickflächen mindestens 44 × 44 Pixel groß gestalten
- [ ] Sichtbaren Tastaturfokus ergänzen
- [ ] `aria-label` für reine Icon-Buttons setzen
- [ ] Auswahl nicht nur durch Farben kennzeichnen
- [ ] Offline-Status anzeigen: „Synchronisiert“, „Wird synchronisiert“, „Offline gespeichert“
- [ ] Bei Fehlern konkrete Handlungsoptionen anbieten
- [ ] Ladezustände mit Skeletons oder Spinnern sichtbar machen
- [ ] Leere Zustände mit verständlicher Handlungsaufforderung versehen
- [ ] Formulierungsfehler korrigieren: „Warte auf die Bestätigung deines Partners.“

---

## 4. Sinnvolle Erweiterungen nach Mehrwert priorisiert

> [!tip]
> Die Reihenfolge orientiert sich am tatsächlichen Nutzen für einen gemeinsamen Familienhaushalt, nicht daran, welche Funktion technisch besonders interessant wirkt.

### Priorität A – zuerst umsetzen

#### 4.1 Wiederkehrende Ausgaben automatisch übernehmen

**Nutzen:** sehr hoch  
**Aufwand:** mittel

Miete, Strom, Internet, Versicherungen, Streaming-Dienste und andere Fixkosten sollten automatisch vorgeschlagen oder gebucht werden können.

Sinnvolle Optionen:

- monatlich, quartalsweise oder jährlich
- nächstes Fälligkeitsdatum
- automatische Buchung oder vorherige Bestätigung
- Hinweis bei Preisänderungen
- Status: geplant · fällig · gebucht · pausiert

Beispiel:

> Internet · 39,95 €  
> Wird am 15. Juni automatisch aus der Haushaltskasse gebucht.

---

#### 4.2 Verfügbares Monatsbudget anzeigen

**Nutzen:** sehr hoch  
**Aufwand:** mittel

Berechnung:

```text
gemeinsames Monatsbudget
- Fixkosten
- bereits gebuchte Ausgaben
- geplante Rücklagen
= noch verfügbarer Betrag
```

Beispiel:

> **Noch verfügbar im Juni: 1.126,40 €**  
> Das entspricht durchschnittlich 49,00 € pro verbleibendem Tag.

Optional:

> Bei eurem aktuellen Ausgabentempo wird das Monatsbudget voraussichtlich am 24. Juni aufgebraucht sein.

---

#### 4.3 Flexible Aufteilung einzelner Ausgaben

**Nutzen:** sehr hoch  
**Aufwand:** mittel

Mögliche Varianten:

- 50:50
- nach Einkommen
- vollständig Person A
- vollständig Person B
- individuelle Prozentwerte
- individueller Betrag je Person

Beispiele:

- gemeinsamer Einkauf: 50:50
- persönliches Hobby: vollständig eine Person
- Familienurlaub: nach Einkommen
- Geschenk für ein Kind: individueller Anteil

Die Standardaufteilung bleibt vorausgewählt. Sonderfälle werden nur bei Bedarf über **Anders aufteilen** geöffnet.

---

#### 4.4 Nachvollziehbarer Monatsabschluss

**Nutzen:** sehr hoch  
**Aufwand:** gering bis mittel

Vor dem Abschluss:

> **Abrechnung Juni 2026**  
> Viktor bekommt 84,30 € zurück.  
> Enthalten sind 24 offene Buchungen.

Nach dem Abschluss:

- Zeitraum speichern
- beteiligte Buchungen markieren
- Überweisungsbetrag anzeigen
- Verwendungszweck erzeugen
- PDF- oder CSV-Export
- Rückgängig-Funktion

---

#### 4.5 Persönliche und gemeinsame Ausgaben unterscheiden

**Nutzen:** hoch  
**Aufwand:** mittel

Mögliche Buchungsarten:

- gemeinsame Ausgabe
- persönliche Ausgabe
- Ausgabe für ein Kind
- Erstattung oder Rückzahlung

Beispiel:

> Fitnessstudio · 34,90 €  
> Persönliche Ausgabe · wird nicht geteilt.

---

#### 4.6 Schnellerfassung mit Favoriten und Vorlagen

**Nutzen:** hoch  
**Aufwand:** gering bis mittel

Beispiele für Favoriten:

- Rewe · Lebensmittel · bezahlt von mir
- Tanken · Mobilität · bezahlt von mir
- Kita · Kinder · aus Haushaltskasse
- Bäcker · Lebensmittel · bezahlt vom Partner

Zusätzlich sinnvoll:

- letzte Ausgabe wiederholen
- zuletzt verwendete Kategorien zuerst anzeigen
- häufige Händler vorschlagen
- Standardzahler merken
- Betrag nachträglich anpassen

---

#### 4.7 Nachträgliche Buchungen und Korrekturen

**Nutzen:** hoch  
**Aufwand:** gering

Sinnvolle Funktionen:

- Buchungsdatum frei wählen
- Buchung bearbeiten
- Buchung duplizieren
- Buchung löschen
- Rückgängig-Funktion
- Änderungshistorie bei abgerechneten Buchungen
- Hinweis auf Auswirkungen für den Ausgleich

Beispiel:

> Die Änderung erhöht deinen Erstattungsanspruch um 12,50 €.

---

### Priorität B – danach ergänzen

#### 4.8 Budgets für wichtige Kategorien

**Nutzen:** hoch  
**Aufwand:** mittel

Mögliche Kategorien:

- Lebensmittel
- Restaurant und Lieferdienste
- Mobilität
- Freizeit
- Kinder
- Urlaub
- Drogerie
- Haushalt

Beispiel:

> Lebensmittel  
> 386 € von 600 € verwendet  
> Noch verfügbar: 214 €

Warnung:

> Ihr habt bereits 85 % eures Restaurantbudgets verwendet.

---

#### 4.9 Sparziele und Rücklagen

**Nutzen:** hoch  
**Aufwand:** mittel

Beispiel:

> **Urlaub 2026**  
> Ziel: 2.400 €  
> Bereits zurückgelegt: 1.350 €  
> Empfohlene monatliche Einzahlung: 175 €

Sinnvolle Funktionen:

- Zielbetrag
- Wunschdatum
- monatlicher Sparbetrag
- Fortschrittsanzeige
- Einzahlungen dokumentieren
- Rücklagen vom frei verfügbaren Monatsbudget abziehen

---

#### 4.10 Benachrichtigungen und Erinnerungen

**Nutzen:** mittel bis hoch  
**Aufwand:** mittel

Sinnvolle Benachrichtigungen:

- Partner hat eine größere Ausgabe eingetragen
- Fixkosten werden morgen fällig
- Monatsbudget ist fast ausgeschöpft
- offene Abrechnung besteht seit mehreren Tagen
- Partner hat eine Abrechnung bestätigt
- Rücklage wurde diesen Monat noch nicht eingezahlt

Jeder Benachrichtigungstyp sollte einzeln deaktivierbar sein.

---

#### 4.11 Erstattungen, Rückzahlungen und Gutschriften

**Nutzen:** mittel  
**Aufwand:** mittel

Mögliche Buchungsarten:

- Ausgabe
- Einzahlung in die gemeinsame Kasse
- Erstattung
- Gutschrift
- Rückzahlung
- Einnahme

Beispiele:

- Pfandrückgabe
- Stromgutschrift
- Rücksendung eines Artikels
- Versicherungserstattung
- private Einzahlung in die Haushaltskasse

---

#### 4.12 Datenexport und Datensicherung

**Nutzen:** mittel  
**Aufwand:** gering bis mittel

Formate:

- CSV für Excel
- PDF für Monatsabrechnungen
- vollständiges Backup als JSON
- optionaler Jahresbericht

Filter:

- Zeitraum
- Kategorie
- Person
- offene oder abgeschlossene Buchungen

---

#### 4.13 Kinderbezogene Kosten separat auswerten

**Nutzen:** mittel  
**Aufwand:** gering bis mittel

Mögliche Unterkategorien:

- Betreuung und Kita
- Schule
- Kleidung
- Freizeit
- Gesundheit
- Taschengeld
- Vereinsbeiträge

Beispiel:

> Ausgaben für Kinder im Juni: 438,20 €

---

### Priorität C – später prüfen

#### 4.14 Belege und Fotos anhängen

**Nutzen:** mittel  
**Aufwand:** mittel

Anwendungsfälle:

- Kassenbon
- Handwerkerrechnung
- Garantiebeleg
- Nebenkostenabrechnung
- größere Anschaffung
- Versicherungserstattung

Später optional:

- Texterkennung
- Händlererkennung
- Betragserkennung
- Datumserkennung
- automatische Kategorie-Vorschläge

---

#### 4.15 CSV- oder Bankimport

**Nutzen:** mittel  
**Aufwand:** hoch

Empfohlene Reihenfolge:

1. CSV-Import aus Online-Banking
2. Vorschläge zur Kategorisierung
3. Erkennung möglicher Dubletten
4. Bestätigung vor der Übernahme
5. später optional PSD2- oder Banking-Anbindung über einen spezialisierten Dienstleister

Beispiel:

> 12 neue Kontobewegungen erkannt.  
> 9 Kategorien wurden automatisch vorgeschlagen.

---

#### 4.16 Mehrere Haushaltskassen oder Unterkonten

**Nutzen:** später sinnvoll  
**Aufwand:** mittel bis hoch

Mögliche Kassen:

- laufender Haushalt
- Urlaub
- Kinder
- Auto
- Renovierung
- gemeinsame Anschaffungen

Beispiel:

> Haushaltskasse: 430 €  
> Urlaubskasse: 1.350 €  
> Rücklage Auto: 780 €

---

#### 4.17 Rollen für weitere Familienmitglieder

**Nutzen:** optional  
**Aufwand:** hoch

Mögliche Rollen:

- Administrator
- vollwertiges Haushaltsmitglied
- nur lesen
- eingeschränkte Erfassung
- keine Einsicht in persönliche Ausgaben

Für die erste Version sollte die App jedoch konsequent auf zwei Partner optimiert bleiben.

---

## 5. Empfohlene Umsetzungsreihenfolge

### Phase 1 – sofort spürbare Verbesserung

- [ ] Hero-Card auf offenen Ausgleich umstellen
- [ ] Bottom-Navigation einführen
- [ ] Schnellerfassung vereinfachen
- [ ] sinnvolle Standardwerte setzen
- [ ] Rückgängig-Funktion nach Speichern und Löschen
- [ ] Bestätigungsdialog vor Abrechnung
- [ ] Buchungsdatum frei wählbar machen
- [ ] Formulierungsfehler korrigieren
- [ ] Offline- und Ladezustände sichtbar machen

### Phase 2 – bessere Übersicht

- [ ] Verlauf mit Suche und Filtern
- [ ] Fixkosten auf der Startseite
- [ ] wiederkehrende Ausgaben automatisch übernehmen
- [ ] verfügbares Monatsbudget anzeigen
- [ ] persönliche und gemeinsame Ausgaben unterscheiden
- [ ] flexible Aufteilung einzelner Buchungen
- [ ] Favoriten und Vorlagen
- [ ] Einladungslink für Partner

### Phase 3 – Familienfinanzen aktiv planen

- [ ] Kategorie-Budgets
- [ ] Sparziele und Rücklagen
- [ ] Benachrichtigungen
- [ ] Erstattungen und Gutschriften
- [ ] Monatsabschluss exportieren
- [ ] Kinderkosten separat auswerten

### Phase 4 – Komfortfunktionen und Skalierung

- [ ] Belegscan
- [ ] CSV-Import
- [ ] später mögliche Banking-Anbindung
- [ ] mehrere Haushaltskassen
- [ ] zusätzliche Nutzerrollen

---

## 6. Abnahmekriterien für eine spürbar bessere Bedienbarkeit

### Startseite

- [ ] Nutzer erkennen innerhalb von 3 Sekunden, wer wem Geld schuldet
- [ ] Noch verfügbares Monatsbudget ist direkt sichtbar
- [ ] Nächste Fixkosten sind ohne Navigation erkennbar
- [ ] Wichtigste Kennzahl ist nicht das Einkommen, sondern die Handlungsempfehlung

### Neue Ausgabe

- [ ] Standardausgabe lässt sich in maximal 3 Interaktionen speichern
- [ ] Standardwerte sind sinnvoll vorbelegt
- [ ] Buchung kann nach dem Speichern rückgängig gemacht werden
- [ ] Sonderfälle bleiben erreichbar, überladen aber nicht die Standardansicht

### Verlauf

- [ ] Nutzer können Buchungen suchen
- [ ] Nutzer können nach Monat, Kategorie und Zahler filtern
- [ ] Buchungen lassen sich bearbeiten, duplizieren und löschen
- [ ] Offene und abgerechnete Buchungen sind klar unterscheidbar

### Abrechnung

- [ ] Betrag, Richtung und Zeitraum sind vor Abschluss eindeutig sichtbar
- [ ] Enthaltene Buchungen sind nachvollziehbar
- [ ] Abrechnung kann exportiert werden
- [ ] Fehlbedienung lässt sich unmittelbar rückgängig machen

### Mobile Bedienung

- [ ] Hauptnavigation ist mit dem Daumen gut erreichbar
- [ ] Klickflächen sind mindestens 44 × 44 Pixel groß
- [ ] Plus-Button ist von jeder Hauptseite erreichbar
- [ ] Layout funktioniert auf kleinen Smartphones ohne horizontales Scrollen

---

## 7. Grundsätze für die Weiterentwicklung

Jede neue Funktion sollte mindestens eine dieser Fragen klar mit **Ja** beantworten:

- Spart sie regelmäßig Zeit?
- Verhindert sie Missverständnisse zwischen Partnern?
- Verbessert sie eine finanzielle Entscheidung?
- Macht sie eine Abrechnung nachvollziehbarer?
- Reduziert sie manuelle Eingaben?
- Erhöht sie die Wahrscheinlichkeit, dass die App täglich genutzt wird?

> [!warning]
> Erfüllt eine Erweiterung keinen dieser Punkte, sollte sie zunächst zurückgestellt werden.  
> Eine übersichtliche App mit wenigen sehr guten Funktionen ist für Familien wertvoller als eine komplexe Finanzsoftware mit vielen selten genutzten Optionen.

---

## 8. Referenzen zum Projekt

### Repository

- [Godsizee/Finanzen auf GitHub](https://github.com/Godsizee/Finanzen)

### Relevante Dateien

- [Implementation Plan](https://github.com/Godsizee/Finanzen/blob/master/implementation_plan.md)
- [Dashboard](https://github.com/Godsizee/Finanzen/blob/master/src/routes/%2Bpage.svelte)
- [Hero Card](https://github.com/Godsizee/Finanzen/blob/master/src/lib/features/transactions/components/HeroCard.svelte)
- [Neue Ausgabe](https://github.com/Godsizee/Finanzen/blob/master/src/routes/add/%2Bpage.svelte)
- [Verlauf](https://github.com/Godsizee/Finanzen/blob/master/src/routes/history/%2Bpage.svelte)
- [Fixkosten](https://github.com/Godsizee/Finanzen/blob/master/src/routes/recurring/%2Bpage.svelte)
- [Monatsstatistik](https://github.com/Godsizee/Finanzen/blob/master/src/lib/features/transactions/components/MonthlyStats.svelte)
- [Onboarding](https://github.com/Godsizee/Finanzen/blob/master/src/routes/onboarding/%2Bpage.svelte)

---

## Kurzfazit

Die App sollte zuerst in drei Bereichen verbessert werden:

1. **Sofort verständliche Startseite**
2. **Extrem schnelle Erfassung neuer Ausgaben**
3. **Nachvollziehbare und sichere Abrechnung**

Danach sind automatische Fixkosten, verfügbares Monatsbudget und flexible Aufteilungen die sinnvollsten Erweiterungen. Erst wenn diese Grundlage stabil ist, lohnen sich Komfortfunktionen wie Belegscan, Banking-Import oder zusätzliche Haushaltsrollen.
