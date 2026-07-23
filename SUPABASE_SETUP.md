# Live familiespellen activeren

## 1. Supabase-project
1. Maak een Supabase-project.
2. Open **Authentication → Sign In / Providers → Anonymous** en schakel **Allow anonymous sign-ins** in.
3. Open **SQL Editor**, plak de volledige inhoud van `supabase-schema.sql` en voer die uit.

De standaard familiecode is `ANNECY26`. Verander die in de laatste regels van het SQL-bestand voordat je het uitvoert wanneer je een andere code wilt.

## 2. Publieke app-sleutels invullen
Open **Project Settings → API** en kopieer:
- Project URL
- Publishable key (`sb_publishable_...`; een legacy anon key werkt ook)

Vul beide waarden in `supabase-config.js` in. Gebruik nooit een secret/service_role key.

## 3. Publiceren
Upload de map naar GitHub en verbind de repository aan Netlify. Voor deze statische app:
- Build command: leeg
- Publish directory: `.`

## Gebruik
Iedere speler opent **Spellen**, vult één keer een naam en familiecode in en kiest **Meedoen**. De anonieme Supabase-sessie wordt door de browser onthouden. Alleen na het wissen van browsergegevens, gebruik van een nieuw apparaat of **Groep verlaten** moet de code opnieuw worden ingevuld.

## Wat nu live werkt
- gedeelde ranglijst;
- eigen score met +/− aanpassen;
- Bingo-vakjes geven of verwijderen automatisch een punt;
- Hitster geeft met `+1 punt` een live punt;
- iedere bestaande spelkaart heeft `Ronde voltooid +1`;
- scorewijzigingen verschijnen realtime op andere apparaten.

## Testen
1. Open de site op twee apparaten of in twee verschillende browsers.
2. Voer op beide `ANNECY26` in met verschillende namen.
3. Geef op één apparaat een punt.
4. De score hoort vrijwel direct op beide apparaten te veranderen.
