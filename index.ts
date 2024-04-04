import express, { Express } from "express";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app: Express = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set('views', path.join(__dirname, "views"));

app.set("port", process.env.PORT || 3000);
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});
app.get("/", async (req, res) => {
    try {
        const maxPoke = req.query.maxpoke;
        const limit = maxPoke ? parseInt(maxPoke.toString()) : 100;
        const test = req.query.page;
        const paging = test ? parseInt(test.toString()) : 1;
        const offset = paging === 1 ? 0 : (paging - 1) * limit;
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
        if (response.status === 404) throw new Error('Not found');
        if (response.status === 500) throw new Error('Internal server error');
        if (response.status === 400) throw new Error('Bad request');
        let pokemons: any = await response.json();
        const pokemonWithImages = await Promise.all(pokemons.results.map(async (pokemon: any) => {
            const response = await fetch(pokemon.url);
            const data = await response.json();
            return {
                id: data.id,
                name: pokemon.name,
                image: data.sprites.other.home.front_default,
                type: data.types[0].type.name
            };
        }));
        res.render('index', {
            title: "Alle pokemons",
            pokemons: pokemonWithImages
        });
    } catch (error) {
        console.error('Error:', error);
    }
});
app.get("/pokemon/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (response.status === 404) throw new Error('Not found');
        if (response.status === 500) throw new Error('Internal server error');
        if (response.status === 400) throw new Error('Bad request');

        const pokemon = await response.json();
        console.log(pokemon.name + " " + pokemon.types[0].type.name);

        let pokemonbijnaam: string = "";
        if (pokemonbijnaam === "") {
            pokemonbijnaam = pokemon.name;
        }

        res.render('pokemon', {
            title: pokemon.name,
            pokemon: pokemon,
            pokemonbijnaam: pokemonbijnaam,
        });

    } catch (error) {
        console.error('Error:', error);
    }
});

app.listen(app.get("port"), () => {
    console.log("Server started on http://localhost:" + app.get('port'));
});