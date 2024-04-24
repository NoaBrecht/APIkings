import express, { Express } from "express";
import dotenv from "dotenv";
import path from "path";
import { connect, getUser } from "./database";
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
    // TODO: Pagination
    try {
        let user = await getUser(1)
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=20`);
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
            user: user,
            page: 1,
            title: "Alle pokemons",
            pokemons: pokemonWithImages,
        });

    } catch (error) {
        console.error('Error:', error);
    }
});
app.get("/catcher", async (req, res) => {
    // TODO: if no pokemon, player can catch a starterpokemon
    try {

        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/1`);
        if (response.status === 404) throw new Error('Not found');
        if (response.status === 500) throw new Error('Internal server error');
        if (response.status === 400) throw new Error('Bad request');

        const pokemon = await response.json();
        res.render('catcher', {
            title: "catching a pokemon?",
            pokemon: pokemon,

        });

    } catch (error) {
        console.error('Error:', error);
    }
});

app.get("/landingpagina", async (req, res) => {
    res.render('landingpage', {
        title: "Landingpagina, kies een project",
    });
})
app.get("/login", async (req, res) => {
    // TODO: Login 
    res.render('login', {
        title: "Login pagina"
    });
})
app.get("/register", async (req, res) => {
    // TODO: Let the user create an account safely
    res.render('register', {
        title: "Register pagina"
    });
})
app.get("/wrong_project", async (req, res) => {
    res.render('wrong_project', {
        title: "Dit project is niet beschikbaar"
    });
})
app.get("/pokemon/:id", async (req, res) => {
    try {
        let user = await getUser(1)
        //* POkemon ID ophalen
        const { id } = req.params;
        //* Pokemon info ophalen
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (response.status === 404) throw new Error('Not found');
        if (response.status === 500) throw new Error('Internal server error');
        if (response.status === 400) throw new Error('Bad request');
        const pokemon = await response.json();
        // Pokemon info log
        console.log(pokemon.id + ' ' + pokemon.name + ' ' + pokemon.types[0].type.name);
        //* Pokemon species ophalen
        const speciesResponse = await fetch(pokemon.species.url);
        if (speciesResponse.status === 404) throw new Error('Not found');
        if (speciesResponse.status === 500) throw new Error('Internal server error');
        if (speciesResponse.status === 400) throw new Error('Bad request');
        const speciesData = await speciesResponse.json();
        //* Evolutiechainurl ophalen
        const evolutionChainUrl = speciesData.evolution_chain.url;
        const evolutionChainResponse = await fetch(evolutionChainUrl);
        const evolutionChainData = await evolutionChainResponse.json();
        const pokemonNames: string[] = [];
        let currentChain = evolutionChainData.chain;
        //! Pokemonnaam uit chain in PokemonNames sturen
        while (currentChain) {
            pokemonNames.push(currentChain.species.name);

            if (currentChain.evolves_to.length > 0) {
                currentChain = currentChain.evolves_to[0];
            } else {
                currentChain = null;
            }
        }
        //* Pokemon foto afhalen uit API en in chaindata sturen
        const chaindata = [];
        for (const name of pokemonNames) {
            const spriteResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
            const spriteData = await spriteResponse.json();
            chaindata.push({ name: name, spriteUrl: spriteData.sprites.other.home.front_default });
        }
        let pokemonbijnaam: string = "";
        if (pokemonbijnaam === "") {
            pokemonbijnaam = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
        }
        res.render('pokemon', {
            user: user,
            title: pokemon.name,
            pokemon: pokemon,
            pokemonbijnaam: pokemonbijnaam,
            evolutionChain: chaindata,
        });

    } catch (error) {
        console.error('Error:', error);
    }
});
app.get("/whothat", async (req, res) => {
    // TODO: Checking if the pokemon the user types in is the same as the name of the pokemon
    try {
        const randompok = (min: number, max: number) =>
            Math.floor(Math.random() * (max - min + 1)) + min;
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randompok(0, 1100)}`);
        if (response.status === 404) {
            console.log("Pokémon not found, trying again");
            res.redirect("/whothat");
        }
        if (response.status === 500) throw new Error('Internal server error');
        if (response.status === 400) throw new Error('Bad request');

        const pokemon = await response.json();
        res.render('whothat', {
            title: "who is that pokemon?",
            pokemon: pokemon,
        });

    } catch (error) {
        console.error('Error:', error);
    }
});
app.get("/battler", async (req, res) => {
    try {
        const id = Math.floor(Math.random() * 1025) + 1;
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (response.status === 404) throw new Error('Not found');
        if (response.status === 500) throw new Error('Internal server error');
        if (response.status === 400) throw new Error('Bad request');
        const pokemon = await response.json();

        const randomNumber = Math.floor(Math.random() * 1025) + 1;
        const response2 = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomNumber}`);
        if (response2.status === 404) throw new Error('Not found');
        if (response2.status === 500) throw new Error('Internal server error');
        if (response2.status === 400) throw new Error('Bad request');
        const enemy = await response2.json();

        res.render('battler', {
            title: "vechten",
            pokemon: pokemon,
            enemy: enemy
        });
    } catch (error) {
        console.error('Error:', error);
    }
})
app.get("/vergelijken", async (req, res) => {
    res.render('vergelijken', {
        title: "pokemon vergelijken"
    });
});
app.get("/:page", async (req, res) => {
    // TODO: Pagination
    try {
        let { page } = req.params;
        let offset;
        if (parseInt(page) > 1) {
            offset = (parseInt(page) - 1) * 30;
        }
        else {
            offset = 0;
        }
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=30&offset=${offset}`);
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
            pokemons: pokemonWithImages,
            page: page
        });

    } catch (error) {
        console.error('Error:', error);
    }
});
app.listen(app.get("port"), async () => {
    await connect();
    console.log("Server started on http://localhost:" + app.get('port'));
});