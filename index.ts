import express, { Express } from "express";
import dotenv from "dotenv";
import path from "path";
import { addPokemon, connect, login, registerUser, removePokemon, updateActive, updateAttack, updateDefense, updateNickName } from "./database";
import { User } from "./interfaces";
import session from "./session";
import { secureMiddleware } from "./middleware/secureMiddleware";
import { battle } from "./functions";
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
        pokemonWithImages.sort((a: any, b: any) => a.id - b.id);
        res.render('index', {
            user: req.session.user,
            title: "Mijn pokemons",
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
        const randompok = (min: number, max: number) =>
            Math.floor(Math.random() * (max - min + 1)) + min;
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${randompok(0, 1100)}`);
        if (response.status === 404) {
            console.log("Pokémon niet gevonden, probeer opnieuw");
            res.redirect("/catcher");
            return;
        }
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
            title: "pokemon vangen?",
            pokemon: pokemon,
            user: user,
            isgevangen: isgevangen
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).send("Er is een fout opgetreden");
    }
});
app.get('/catcher/:id', secureMiddleware, async (req, res) => {
    const pokemonId = parseInt(req.params.id);
    const user = req.session.user;

    if (!user) {
        res.status(401).send("Gebruiker niet ingelogd");
        return;
    }

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
        if (response.ok) {
            const pokemon = await response.json();
            let isgevangen = false;
            if (user?.pokemons) {
                const filteredPokemons = user.pokemons.filter(poke => poke.id === pokemon.id);
                isgevangen = filteredPokemons.length > 0;
            }
            res.render('catcher', {
                title: "Vang Pokémon",
                user: user,
                pokemon: pokemon,
                isgevangen: isgevangen
            });
        } else {
            res.status(500).send("Gefaald om pokemon te laden");
        }
    } catch (error) {
        console.log('Error:', error);
        res.status(500).send("pokemon vangen gefaald");
    }
});
app.post('/catcher/:id', secureMiddleware, async (req, res) => {
    const pokemonId = parseInt(req.params.id);
    const user = req.session.user;

    if (!user) {
        res.status(401).send("Gebruiker niet ingelogd");
        return;
    }
    user.catchAttempts = user.catchAttempts || {};
    user.catchAttempts[pokemonId] = user.catchAttempts[pokemonId] || 3;

    if (user.catchAttempts[pokemonId] <= 0) {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);

        if (response.ok) {
            const pokemon = await response.json();
            res.render('catcher', {
                title: "Geen pogingen over",
                message: "Geen pogingen meer over!",
                user: user,
                pokemon: pokemon,
                isgevangen: false
            });
        } else {
            res.status(500).send("Pokemon data laden gefaald");
            res.redirect('/');
        }
        return;
    }
    try {

        if (!user.pokemons) {
            user.pokemons = [];
        }
        const targetPokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
        if (targetPokemonResponse.status >= 400) {
            throw new Error('Kan geen pokemon laden');
        }
        const targetPokemon = await targetPokemonResponse.json();

        if (!user.pokemons || user.pokemons.length === 0) {
            res.status(400).send("Geen pokemon beschikbaar.");
            return;
        }
        const action = req.body.action;
        if (action === 'catch') {
            user.catchAttempts[pokemonId]--;
            const catchSuccess = attemptCatch(user, targetPokemon);
            if (catchSuccess) {
                await addPokemon(user, pokemonId);
                user.pokemons.push({ id: pokemonId, nickname: "", attack: 0, defense: 0 });;

                console.log(user);
                console.log("Lijst na vangen:", user.pokemons);
                console.log('Pokemon gevangen:', pokemonId);
                req.session.user = user;
                req.session.save();
                res.redirect('/');
            }
            else {
                if (user.catchAttempts[pokemonId] <= 0) {
                    res.redirect('/');
                } else {
                    res.render('catcher', {
                        title: "Vangen gefaald",
                        pokemon: targetPokemon,
                        user: user,
                        isgevangen: false,
                        message: "Poging gefaald, probeer opnieuw!"
                    });
                }
            }

        } else if (action === 'release') {
            user.pokemons = user.pokemons.filter(poke => poke.id !== pokemonId);
            await removePokemon(user, pokemonId);
            req.session.user = user;
            req.session.save();

            res.redirect("/");
        }
        else {
            res.render('catcher', {
                title: "Pogin om pokemon te vangen",
                message: "Pogin om pokemon te vangen",
                isgevangen: false
            });
        }
    } catch (error) {
        console.log('Error:', error)
        res.status(500).send("pokemon vangen gefaald")
    }
});
function attemptCatch(user: User, targetPokemon: any): boolean {
    if (!user.pokemons) {

        return false;
    }
    const userActivePokemon = user.pokemons.find(p => Number(p.id) === user.activepokemon);
    if (!userActivePokemon) {

        return false;
    }
    const catchProbability = calculateCatchProbability(userActivePokemon, targetPokemon);
    return Math.random() < catchProbability;
}
function calculateCatchProbability(userPokemon: { attack: any; }, targetPokemon: { stats: any[]; }) {
    const attackFactor = userPokemon.attack;
    const defenseFactor = targetPokemon.stats.find(stat => stat.stat.name === 'defense').base_stat;
    return Math.max(0, Math.min(1, (100 + attackFactor - defenseFactor) / 100));
}
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
                error: "Wachtwoorden komen niet overeen", title: "Register pagina",
            });
        } else if (password1.length < 8) {
            res.render("register", {
                error: "Wachtwoord moet minimaal 8 tekens lang zijn", title: "Register pagina",
            });
        }
        else {
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
            if (poke.id == id) {
                updateActive(user, id)
                user.activepokemon = id;
                req.session.user = user;
            };
        });
        res.redirect("/")
    } catch (error) {

    }
})
app.post("/update-nickname/:id", secureMiddleware, async (req, res) => {
    try {
        let id: number = parseInt(req.params.id);
        let user: User | undefined = req.session.user;
        let nickname: string = req.body.nickname;
        if (!user) {
            res.redirect("/login");
            return;
        }
        user?.pokemons?.forEach(poke => {
            if (poke.id == id) {
                updateNickName(user, id, nickname);
                poke.nickname = nickname;
                req.session.user = user;
            };
        });
        res.redirect("back");
    } catch (error) {
    }
});
app.get("/whothat", secureMiddleware, async (req, res) => {
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
            let user: User | undefined = req.session.user;
            if (!user) {
                res.redirect("/login");
                return;
            }
            let id = user.activepokemon;
            if (!id) {
                if (!user.pokemons || user.pokemons.length === 0) {
                    res.redirect("/starterpokemon");
                    return;
                }
                id = user.pokemons[0].id;
            }
            message = "Correct!";
            wrongGuess = false;
            if (Math.random() < 0.5) {
                updateDefense(user, id);
                user.pokemons?.forEach(poke => {
                    if (poke.id.toString() === id.toString()) {
                        poke.defense = poke.defense + 1;
                    };
                });
            } else {
                updateAttack(user, id);
                user.pokemons?.forEach(poke => {
                    if (poke.id.toString() === id.toString()) {
                        poke.defense = poke.defense + 1;
                    };
                });
            }
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
        if (!user?.pokemons || user?.pokemons.length === 0) {
            res.redirect("/starterpokemon");
            return;
        }
        for (let poke of user?.pokemons || []) {
            let responseuser = await fetch(`https://pokeapi.co/api/v2/pokemon/${poke.id}`);
            const pokemon = await responseuser.json();
            userPokemonsWithNames.push({ id: poke.id, name: pokemon.name });
        }
        if (!id) {
            id = userPokemonsWithNames[0].id;
        }
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        if (response.status === 404) {
            res.redirect("/battler");
            return;
        }
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
        if (response2.status === 404) {
            res.redirect("/battler");
            return;
        }
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
    if (!user) {
        res.redirect("/login");
        return;
    }
    let userPokemonsWithNames = [];
    for (let poke of user?.pokemons || []) {
        let responseuser = await fetch(`https://pokeapi.co/api/v2/pokemon/${poke.id}`);
        const pokemon = await responseuser.json();
        userPokemonsWithNames.push({ id: poke.id, name: pokemon.name });
    }
    let myPokemonId: string = req.body.pokemon;
    let enemyPokemonName: string = req.body.enemy.toLowerCase();
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${myPokemonId}`);
    if (response.status === 404) {
        res.redirect("/battler");
        return;
    }
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
    if (response2.status === 404) {
        res.redirect("/battler");
        return;
    }
    if (response2.status === 500) throw new Error('Internal server error');
    if (response2.status === 400) throw new Error('Bad request');
    const enemy = await response2.json();
    const winner = battle(pokemon, enemy);
    let catchedPokemon = false;
    if (winner.name === pokemon.name) {
        if (!user.pokemons) {
            user.pokemons = [];
        }
        user.pokemons.forEach(pokemon => {
            if (pokemon.id == enemy.id) {
                catchedPokemon = true;
            }
        });
        if (!catchedPokemon) {
            await addPokemon(user, enemy.id);
            user.pokemons.push({ id: enemy.id, nickname: "", attack: 0, defense: 0 });
        }
    }
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
        if (response.status === 404) {
            res.redirect("/vergelijken");
            return;
        } if (response.status === 500) throw new Error('Internal server error');
        if (response.status === 400) throw new Error('Bad request');
        const pokemon1 = await response.json();
        let pokemon2Name = req.query.pokemon2 || "ivysaur";
        pokemon2Name = pokemon2Name.toString().toLowerCase();
        const response2 = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon2Name}`);
        if (response2.status === 404) {
            res.redirect("/vergelijken");
            return;
        }
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