# APIkings

# Projectbeschrijving

## Projectinhoud

Gemeenschappelijk

De gebruiker komt op de webpagina terecht en ziet een overzicht van al de projecten op de landing page. Deze projecten hebben een afbeelding, een naam. Verder heeft deze pagina geen andere inhoud voor duidelijkheid. De gebruiker kiest dan uit een van de voorgemaakte projecten. Is die gebruiker nog niet ingelogd dan krijgt die een melding. Die melding komt via een kleine textbox onder het project die niet te storend is voor de gebruiker maar duidelijk genoeg voor de melding voort te brengen.

Belangrijk is dat elke Pokémon gebruiker gebonden is, gebruiker met Pokémon a kan een andere Pokémon gevangen hebt dan b.

Als de gebruiker op een ander project klikt, dan krijgt de gebruiker een melding dat hij/zij op een project klikt waar niet aan deelgenomen kan worden. Die melding komt op dezelfde wijze als de niet ingelogd melding maar dan met een andere kleur.

Wanneer de gebruiker op het juiste project klikt en ingelogd is, dan komt hij/zij op de specifieke user landing pagina.

Pokémon Vergelijken

Wanneer de gebruiker op deze pagina komt, moet het duidelijk zijn dat er 2 pokemons worden vergeleken. Dit aan de hand van een duidelijke titel en 2 plekken naast elkaar waar pokemon afbeeldingen komen te staan. Je kunt die pokemons op zoeken met een zoekbalk. Beneden de afbeelding komen de stats te staan van de pokemon. De vergelijking wordt getoond aan de hand van rode en groene kleuren. Groen, wanneer de stats van de eerste beter zijn, en rood wanneer de stats beter van de tweede dan de eerste zijn.

Pokémon vangen

De gebruiker klikt op een foto van een Pokémon, waardoor er een venster opent met de afbeelding.
Als je de Pokémon al gevangen hebt, krijg je een pokebal met een groene rand te zien. Je hebt dan de keuze om de Pokémon vrij te laten. Druk je op confirm dan is de Pokémon vrij en krijgt een rode rand. Nu kan je deze vangen.

Indien de pokebal een rode rand heeft kan je deze vangen.

Berekening
(Je hebt 100-TargetPokemon.defence+HuidigePokemon.attack % kans om de Pokémon te vangen (merk je dat dit “algoritme” niet goed is: kom dan met een goede oplossing)

Als gebruiker heb je 3 kansen om de Pokémon te vangen. Indien je faalt sluit het venster en moet je opnieuw proberen.

Indien je de Pokémon vangt moet je deze een bijnaam kunnen geven. Indien je niks invult is dit de Pokémon naam.

BELANGRIJK

Gebruiker moet eerste keer een zwakke start-Pokémon kunnen kiezen.

Eigen Pokémon bekijken

Je krijgt een lijst van Pokémon’s te zien met een afbeelding en hun naam gerangschikt op hun nummer.

Een extra is een groen vinkje dit alle pokemon toont die je gevangen hebt, degene die je niet gevangen hebt worden grijs getoond. Dit vinkje komt linksboven te staan. 2 à 3 pokemon’s komen naast elkaar, en de lijst gaat zo verder naar onder.

Wanneer je op een Pokémon afbeelding klikt dan krijg je een info pagina te zien met bijnaam, stats, wanneer de Pokémon gevangen is en hoeveel wins/losses deze heeft. Met pijltjes verhoog je deze.

Je ziet ook een evolutie pad a.d.h.v. afbeeldingen. Hierop kan je doorklikken op het volledige pad.

Huidige Pokemon

Je kan een pokemon als je huidige pokemon pakken. Deze pokemon is degene die je gebruik in de battler en voor pokemon te vangen (huidige Pokémon gebruik je aan de hand van de berekening om pokemon te vangen). Je huidige pokemon komt naast je profiel te staan bovenaan de pagina. Heb je geen huidige pokemon , dan komt er een vraagteken te staan.

Pokemon Battler

Je kan een pokemon laten vechten met een pokemon die je opzoekt. Om te beurt heeft ieder een aanval. Berekening (HP -( defence – attack). Als dit kleiner is als 0. Totdat 1 van de 2 geen HP meer heeft. Indien je wint vang je de pokemon

Who’s that pokemon?

De gebruiker komt op een pagina waar hij een spel kan spelen voor te raden welke pokemon er getoont wordt. De afbeelding die getoont wordt is een sprite die vervaagd wordt met zwarte contouren. Onder de afbeelding is een auto completing zoekbox. Waar de gebruiker de naam van een pokemon kan typen. Per goed antwoordt gaat defence of attack van je huidige pokemon met 1 punt naar boven. (Dit wordt randomised).

## Projectteam

Het projectteam zal bestaan uit een scrummaster die elke 2 weken zal verdeeld worden on de leden van het project. De taakverdeling zal gebeuren door de scrummaster. Indien nodig kan er gevraagd worden aan de andere leden om hun deel van het project uit te leggen. De deadlines zullen bewaakt worden door de groepsleden zelf. De communicatie hierover zal gebeuren via teams en tijdens de meetings. Er zal aan peer review gedaan worden. Echter weten we nog niet exact hoe. De groepsleden zullen samen moeten werken. Dit zal gebeuren via teams en in person.

## Projectorganisatie

We hebben user stories gemaakt in de backlog, die worden gezet op Trello. Zo kan elke teamlid zien wat hij moet doen(planned). Die staan op deadlines die gewoonlijk gezamenlijk worden afgesproken. Dit wordt gedaan in Microsoft-teams. Ieder teamlid wordt verwacht dit regelmatig te checken. Via Trello spreken we ook datums af voor het nakijken wat er allemaal in de week gemaakt is. Als iemand met iets bezig is dan staat dit op “current”. Indien er iets niet klopt dan verbeteren we dit gezamenlijk. Als iemand iets niet heeft afgekregen dan wordt er geholpen , maar de persoon die het moest maken heeft nog altijd de verantwoordelijkheid. Dit wordt dan ook later in de peer review geëvalueerd. Ook staan deadlines ruim op voorhand , zodat wanneer er iets misloopt dat er nog tijd is om dit af te werken. Als een user story af is, wordt dit ook getoond aan teamleden voor het op github gepusht wordt.(Review) Dit garandeert op een foutloze werkmethode. Vanaf iets af is en gecontroleerd, dan komt het in trello op “finished “ te staan.

## Projectrealisatie

# Technische realisatie

Het project zal uitgewerkt worden door middel van de programmeertaal Typescript. We zullen Bootstrap 5 en eigen custom css gebruiken voor de frontend. De nodige gegevens zullen opgeslagen worden in mongo-db. De deploymen zal gebeuren via Heroku. Versiebeheer zal gebeuren via GitHub. De beveiliging hiervan zal in de eerstvolgende meeting op 28/02 besproken worden met de groepsleden.

## Authors

- [Steven](https://github.com/Joeprogrammer69)
- [Matthias](https://github.com/Syntaxly0)
- [Noa](https://www.github.com/NoaBrecht)

## Color Reference

| Colour                   | Hex                                                              |
| ------------------------ | ---------------------------------------------------------------- |
| --colour-wave            | ![#588dcc](https://via.placeholder.com/10/588dcc?text=+) #588dcc |
| --colour-wave-background | ![#5284be](https://via.placeholder.com/10/5284be?text=+) #5284be |
