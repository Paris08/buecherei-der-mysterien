# Bücherei der Mysterien

Ein Archiv ungeklärter Fälle und wahrer Geschichten: Bibliothek mit Regalen, Akten zum Umblättern, Weltkarte mit Fundorten, Ermittlungsbrett mit roten Fäden.

**Stack:** React + Vite, Supabase (Datenbank, Login, Bilder), Leaflet (Karte), Netlify (Hosting).

## Lokal starten

```bash
npm install
npm run dev
```

## Wichtig

- Akten liegen in Supabase (Tabelle `akten`, Sammelakten in `ueberakten`).
- Lesen darf jeder, schreiben nur Archivare (`profiles.is_admin`). Absicherung per Row Level Security.
- Neue Akten legt man auf der Seite unter „Neue Akte“ an (nach Anmeldung als Archivar).
- Community-Hub ist vorbereitet (`community_einreichungen`), aber noch gesperrt.
