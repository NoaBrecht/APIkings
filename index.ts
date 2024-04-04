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
        const response = await fetch('https://pokeapi.co/api/v2/pokemon');
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
            title: "Brands",
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
        res.render('pokemon', {
            title: pokemon.name,
            pokemon: pokemon
        });
    } catch (error) {
        console.error('Error:', error);
    }
});

app.listen(app.get("port"), () => {
    console.log("Server started on http://localhost:" + app.get('port'));
});