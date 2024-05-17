import express, { Express } from "express";
import dotenv from "dotenv";
import path from "path";
import { addPokemon, connect, login, registerUser, removePokemon, updateActive, userCollection } from "./database";
import { Pokemon, User } from "./interfaces";
import session from "./session";
import { secureMiddleware } from "./middleware/secureMiddleware";
import { battle } from "./functions";
import { name } from "ejs";
dotenv.config();

const app: Express = express();

app.set("view engine", "ejs");
app.use(express.json());
app.use(session);
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set('views', path.join(__dirname, "views"));

app.set("port", process.env.PORT || 3000);
app.use(async (req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});
app.get("/", secureMiddleware, async (req, res) => {
    try {
        let user = req.session.user;
        let pokemons = user?.pokemons;
        let pokemonWithImages: any = [];
        if (pokemons) {
            for (let pokemon of pokemons) {
                const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.id}`);
                if (response.status === 404) throw new Error('Not found');
                if (response.status === 500) throw new Error('Internal server error');
                if (response.status === 400) throw new Error('Bad request');
                const data = await response.json();
                let name = data.name;
                let image = data.sprites.other.home.front_default;
                let type = data.types[0].type.name;
                pokemonWithImages.push({ id: pokemon.id, name: name, image: image, type: type });
            }
        }
        res.render('index', {
            user: req.session.user,
            title: "Alle pokemons",
            pokemons: pokemonWithImages,
            pokemonsCount: pokemonWithImages.length
        });

    } catch (error) {
        console.error('Error:', error);
    }
});
app.get("/all", secureMiddleware, async (req, res) => {
    try {
        let user = req.session.user;
        let UserPokemons = user?.pokemons;
        console.debug(UserPokemons)
        let page;
        if (typeof req.query.page === "string") {
            page = parseInt(req.query.page);
        }
        else {
            page = 1;
        }
        let offset = page * 30 - 30;
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
                type: data.types[0].type.name,
                colour: UserPokemons?.find(poke => poke.id === data.id) ? "" : "blackout"
            };
        }));
        res.render('all', {
            user: req.session.user,
            page: page,
            title: "Alle pokemons",
            pokemons: pokemonWithImages,
        });

    } catch (error) {
        console.error('Error:', error);
    }
});
app.get("/catcher", secureMiddleware, async (req, res) => {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/25`);
        if (response.status === 404) throw new Error('Not found');
        if (response.status === 500) throw new Error('Internal server error');
        if (response.status === 400) throw new Error('Bad request');

        const pokemon = await response.json();
        let isgevangen = false;
        const user = req.session.user;
        if (user?.pokemons) {
            const filteredPokemons = user.pokemons.filter(poke => poke.id === pokemon.id);
            isgevangen = filteredPokemons.length > 0;
            console.log(`gevangen ${isgevangen}`)
        }

        res.render('catcher', {
            title: "catching a pokemon?",
            pokemon: pokemon,
            user: user,
            isgevangen: isgevangen
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send("Er is een fout opgetreden");
    }
});
app.post('/catcher/:id', secureMiddleware, async (req, res) => {
    const pokemonId = parseInt(req.params.id);
    const user = req.session.user;

    if (!user) {
        res.status(401).send("Gebruiker niet ingelogd");
        return;
    }

    try {

        if (!user.pokemons) {
            user.pokemons = [];
        }
        const targetPokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
        console.log("Request body:", req.body);
        console.log(user.pokemons)
        if (targetPokemonResponse.status === 404) throw new Error('Not found');
        if (targetPokemonResponse.status === 500) throw new Error('Internal server error');
        if (targetPokemonResponse.status === 400) throw new Error('Bad request');

        const targetPokemon = await targetPokemonResponse.json();
        if (!user.pokemons || user.pokemons.length === 0) {
            res.status(400).send("Geen pokemon beschikbaar.");
            return;
        }



        const currentPokemon = user.pokemons[0];
        if (!currentPokemon || currentPokemon.attack === undefined) {
            throw new Error('Huidige data mist.');
        }
        const catchProbability = Math.max(0, Math.min(100, 100 - targetPokemon.stats.find((stat: { stat: { name: string; }; }) => stat.stat.name === 'defense').base_stat + currentPokemon.attack));
        const randomChance = Math.random() * 100;
        if (req.body.action === 'catch' && randomChance < catchProbability) {
            await addPokemon(user, pokemonId);
            user.pokemons.push({ id: pokemonId, nickname: "", attack: 0, defense: 0 });;
            req.session.user = user;
            console.log(user);
            console.log("User's Pokémon list after catching:", user.pokemons);
            console.log('Pokemon gevangen:', pokemonId);
            res.redirect("/");
        } else if (req.body.action === 'release') {
            user.pokemons = user.pokemons.filter(poke => poke.id !== pokemonId);
            await removePokemon(user, pokemonId);
            req.session.user = user;
            console.log("User's Pokémon list after releasing:", user.pokemons);
            console.log('Pokemon losgelaten:', pokemonId);
            res.redirect("/");
        }
        else {
            res.render('catcher', {
                title: "Attempt to Catch Pokémon",
                message: "Attempt failed, try again!"
            });
        }





    } catch (error) {
        console.log('Error:', error)
        res.status(500).send("pokemon vangen gefaald")
    }
});
app.get("/logout", secureMiddleware, (req, res) => {
    req.session.destroy((e) => {
        if (e) {
            console.error(e);
        }
    });
    res.redirect("/login");
});
app.get("/landingpagina", (req, res) => {
    res.render('landingpage', {
        title: "Landingpagina, kies een project",
    });
})
app.get("/login", async (req, res) => {
    res.render('login', {
        title: "Login pagina",
        error: ""
    });
})
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    try {
        let user: User = await login(username, password);
        delete user.password;
        req.session.user = user;
        res.redirect("/")
    } catch (e: any) {
        console.warn(`Wrong login from IP: ${req.ip}`)
        res.render("login", {
            error: "Paswoord/gebruikersnaam is fout",
            title: "Login pagina",
        });
    }
})
app.get("/register", async (req, res) => {
    res.render('register', {
        title: "Register pagina",
        error: ""
    });
})
app.post("/register", (req, res) => {
    try {
        let username: string = req.body.userName;
        let email: string = req.body.email;
        let password1: string = req.body.password;
        let password2: string = req.body.password2;
        let terms: boolean = req.body.terms === "agree";
        if (!terms) {
            res.render("register", {
                error: "Je moet akkoord gaan met de voorwaarden", title: "Register pagina",
            });
        } else if (username === "" || email === "" || password1 === "" || password2 === "") {
            res.render("register", {
                error: "Alle velden zijn verplicht", title: "Register pagina",
            });
        } else if (!email.includes("@")) {
            res.render("register", {
                error: "Invaliede e-mail", title: "Register pagina",
            });
        } else if (password1 !== password2) {
            res.render("register", {
                error: "Passwords do not match", title: "Register pagina",
            });
        } else {
            registerUser(username, email, password1);
            res.redirect("/login");
        }

    } catch (err) {
        console.error(err)
        res.render("register", {
            error: "Er is iets foutgegaan", title: "Register pagina",
        });
    }
});
app.get("/wrong_project", async (req, res) => {
    res.render('wrong_project', {
        title: "Dit project is niet beschikbaar"
    });
})
app.get("/privacy-policy", async (req, res) => {
    res.render('policy', {
        title: "Privacy policy"
    });
})
app.get("/pokemon/:id", secureMiddleware, async (req, res) => {
    try {
        let pokemonbijnaam: string = "";
        let pokemonAttack: number = 0;
        let pokemonDefense: number = 0;
        let catchedPokemon: boolean = false;
        //* POkemon ID ophalen
        const { id } = req.params;
        let user: User | undefined = req.session.user;
        user?.pokemons?.forEach(poke => {
            if (poke.id.toString() === id) {
                catchedPokemon = true
                pokemonbijnaam = poke.nickname;
                pokemonAttack = poke.attack;
                pokemonDefense = poke.defense;
            };
        });
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
            chaindata.push({ name: name, id: spriteData.id, spriteUrl: spriteData.sprites.other.home.front_default });
        }
        if (pokemonbijnaam === "") {
            pokemonbijnaam = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);
        }
        res.render('pokemon', {
            user: user,
            title: pokemon.name,
            pokemon: pokemon,
            pokemonbijnaam: pokemonbijnaam,
            evolutionChain: chaindata,
            pokemonAttack: pokemonAttack,
            pokemonDefense: pokemonDefense,
            catchedPokemon: catchedPokemon
        });

    } catch (error) {
        console.error('Error:', error);
    }
});
app.get("/favorite/:id", secureMiddleware, async (req, res) => {
    try {
        let id: number = parseInt(req.params.id);
        let user: User | undefined = req.session.user;
        user?.pokemons?.forEach(poke => {
            console.log(poke.id, id)
            console.log(typeof poke.id, typeof id)
            if (poke.id == id) {
                updateActive(user, id)
                user.activepokemon = id;
                req.session.user = user;
            };
        });
        console.log(user?.activepokemon)
        res.redirect("/")
    } catch (error) {

    }
})
app.get("/whothat", secureMiddleware, async (req, res) => {
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
            previouslyGuessedName: "noname",
            wrongGuess: false,
            formSubmitted: false

        });

    } catch (error) {
        console.error('Error:', error);
    }
});
app.post("/whothat", secureMiddleware, async (req, res) => {

    try {
        const pokemon = await fetchRandomPokemon();
        console.log("1")
        let guessedName: string = req.body.guessedName || "";
        let actualName: string = req.body.actualName || "";

        console.log(guessedName, actualName)

        const isCorrectGuess = guessedName.toLowerCase() === actualName.toLowerCase();
        console.log(isCorrectGuess);
        let message = "";
        let wrongGuess = true;


        if (isCorrectGuess) {
            message = "Correct!";
            wrongGuess = false;

        }
        else {
            message = "Niet correct probeer opnieuw!";
        }

        //console.log(wrongGuess);
        res.render('whothat', {
            previouslyGuessedName: guessedName, previousActualName: actualName, title: "test", pokemon: pokemon, message: message,
            wrongGuess: wrongGuess, formSubmitted: true
        });

        //res.redirect("/whothat");

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
const fetchRandomPokemon = async (): Promise<any> => {
    try {
        const randompok = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randompok(0, 1100)}`);

        if (response.status === 404) {
            console.log("Pokémon not found, trying again");
            return fetchRandomPokemon();
        }
        if (response.status === 500) throw new Error('Internal server error');
        if (response.status === 400) throw new Error('Bad request');

        const pokemon = await response.json();
        return pokemon;
    } catch (error) {
        console.error('Error fetching random Pokemon:', error);
        throw error;
    }
};

app.get("/battler", secureMiddleware, async (req, res) => {
    try {
        let user: User | undefined = req.session.user;
        let id = user?.activepokemon;
        let userPokemonsWithNames = [];
        for (let poke of user?.pokemons || []) {
            let responseuser = await fetch(`https://pokeapi.co/api/v2/pokemon/${poke.id}`);
            const pokemon = await responseuser.json();
            userPokemonsWithNames.push({ id: poke.id, name: pokemon.name });
        }
        if (!id) {
            id = userPokemonsWithNames[0].id;
        }
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (response.status === 404) throw new Error('Not found');
        if (response.status === 500) throw new Error('Internal server error');
        if (response.status === 400) throw new Error('Bad request');
        const pokemon = await response.json();
        user?.pokemons?.forEach(poke => {
            if (poke.id.toString() === pokemon.id.toString()) {
                pokemon.stats[1].base_stat = pokemon.stats[1].base_stat + poke.attack;
                pokemon.stats[2].base_stat = pokemon.stats[2].base_stat + poke.defense;
            };
        });
        let randomNumber = Math.floor(Math.random() * 1025) + 1;
        const response2 = await fetch(`https://pokeapi.co/api/v2/pokemon/${randomNumber}`);
        if (response2.status === 404) throw new Error('Not found');
        if (response2.status === 500) throw new Error('Internal server error');
        if (response2.status === 400) throw new Error('Bad request');
        const enemy = await response2.json();
        res.render('battler', {
            title: "vechten",
            user: user,
            pokemon: pokemon,
            enemy: enemy,
            winner: "",
            userPokemonsWithNames: userPokemonsWithNames
        })
    } catch (error) {
        console.error('Error:', error);
    }
});
app.post("/battler", secureMiddleware, async (req, res) => {
    let user: User | undefined = req.session.user;
    let userPokemonsWithNames = [];
    for (let poke of user?.pokemons || []) {
        let responseuser = await fetch(`https://pokeapi.co/api/v2/pokemon/${poke.id}`);
        const pokemon = await responseuser.json();
        userPokemonsWithNames.push({ id: poke.id, name: pokemon.name });
    }
    let myPokemonId: string = req.body.pokemon;
    let enemyPokemonName: string = req.body.enemy;
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${myPokemonId}`);
    if (response.status === 404) throw new Error('Not found');
    if (response.status === 500) throw new Error('Internal server error');
    if (response.status === 400) throw new Error('Bad request');
    const pokemon = await response.json();
    user?.pokemons?.forEach(poke => {
        if (poke.id.toString() === pokemon.id.toString()) {
            pokemon.stats[1].base_stat = pokemon.stats[1].base_stat + poke.attack;
            pokemon.stats[2].base_stat = pokemon.stats[2].base_stat + poke.defense;
        };
    });
    const response2 = await fetch(`https://pokeapi.co/api/v2/pokemon/${enemyPokemonName}`);
    if (response2.status === 404) throw new Error('Not found');
    if (response2.status === 500) throw new Error('Internal server error');
    if (response2.status === 400) throw new Error('Bad request');
    const enemy = await response2.json();
    const winner = battle(pokemon, enemy);
    res.render('battler', {
        title: "vechten",
        user: user,
        pokemon: pokemon,
        enemy: enemy,
        winner: winner,
        userPokemonsWithNames: userPokemonsWithNames
    });
});

app.get("/vergelijken", secureMiddleware, async (req, res) => {
    try {
        let user = req.session.user;
        let pokemon1Name = req.query.pokemon1 || user?.activepokemon || "pikachu";
        pokemon1Name = pokemon1Name.toString().toLowerCase();
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon1Name}`);
        if (response.status === 404) throw new Error('Not found');
        if (response.status === 500) throw new Error('Internal server error');
        if (response.status === 400) throw new Error('Bad request');
        const pokemon1 = await response.json();
        let pokemon2Name = req.query.pokemon2 || "ivysaur";
        pokemon2Name = pokemon2Name.toString().toLowerCase();
        const response2 = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon2Name}`);
        if (response2.status === 404) throw new Error('Not found');
        if (response2.status === 500) throw new Error('Internal server error');
        if (response2.status === 400) throw new Error('Bad request');
        const pokemon2 = await response2.json();
        res.render('vergelijken', {
            title: "pokemon vergelijken",
            pokemon1: pokemon1,
            pokemon2: pokemon2
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get("/starterpokemon", secureMiddleware, async (req, res) => {
    try {
        let user = req.session.user;
        let UserPokemons = user?.pokemons;
        let page;
        if (typeof req.query.page === "string") {
            page = parseInt(req.query.page);
        }
        else {
            page = 1;
        }
        let offset = page * 30 - 30;
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=30`);
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
                type: data.types[0].type.name,
                colour: UserPokemons?.find(poke => poke.id === data.id) ? "blackout" : ""
            };
        }));
        res.render('starterpokemon', {
            user: req.session.user,
            page: page,
            title: "Alle pokemons",
            pokemons: pokemonWithImages,
        });

    } catch (error) {
        console.error('Error:', error);
    }
});
app.post("/add-pokemon", secureMiddleware, async (req, res) => {

    let pokemonId = Array.isArray(req.body.pokemonId) ? req.body.pokemonId[0] : req.body.pokemonId;
    const action = Array.isArray(req.body.action) ? req.body.action[0] : req.body.action;
    let user = req.session.user;
    if (!user) {
        res.status(401).send("Gebruiker niet ingelogd");
        return;
    }
    try {
        if (!user.pokemons) {
            user.pokemons = [];
        }
        console.log(pokemonId)
        if (action === 'test') {
            console.log("Adding Pokemon:", pokemonId)
            pokemonId = parseInt(pokemonId);
            await addPokemon(user, pokemonId);
            user.pokemons.push({
                id: pokemonId,
                nickname: "",
                attack: 0,
                defense: 0
            });
            req.session.user = user;
            res.redirect("/");
        }



    } catch (error) {
        console.error('Error:', error);
        res.status(500).send("Failed to add Pokémon");
    }

});

app.listen(app.get("port"), async () => {
    try {
        await connect();
        console.log("Server started on http://localhost:" + app.get('port'));
    }
    catch (e) {
        console.error(e);
        console.log("Database couldn't connect")
        process.exit(1);
    }
});
