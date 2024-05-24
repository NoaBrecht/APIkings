import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import fetch from "node-fetch"; // Ensure you have node-fetch installed
import { addPokemon, connect, login, registerUser, removePokemon, updateActive, userCollection } from "./database";
import { User } from "./interfaces";
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

app.post('/catcher/:id', secureMiddleware, async (req: Request, res: Response) => {
    const pokemonId = parseInt(req.params.id);
    const user = req.session.user;

    if (!user) {
        res.status(401).send("Gebruiker niet ingelogd");
        return;
    }
    user.catchAttempts[pokemonId] = user.catchAttempts[pokemonId] ?? 3;

    console.log(user.catchAttempts[pokemonId]);
    if (user.catchAttempts[pokemonId] < 0) {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
        if (response.ok) {
            const pokemon = await response.json();
            res.render('catcher', {
                title: "Geen pogingen meer over",
                message: "Geen pogingen meer over!",
                user: user,
                pokemon: pokemon
            });
        } else {
            res.status(500).send("Gefaald om pokemon te laden");
            res.redirect('/');
        }
        return;
    }
    try {
        const targetPokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
        if (targetPokemonResponse.status >= 400) {
            throw new Error('Failed to fetch Pokémon');
        }
        const targetPokemon = await targetPokemonResponse.json();
        const catchSuccess = attemptCatch(user, targetPokemon);

        if (!user.pokemons || user.pokemons.length === 0) {
            res.status(400).send("Geen pokemon beschikbaar.");
            return;
        }
        const action = req.body.action;

        if (user.catchAttempts[pokemonId] < 1) {
            res.redirect('/');
            return;
        }
        if (action === 'catch') {
            if (user.catchAttempts[pokemonId] === undefined) {
                user.catchAttempts[pokemonId] = 3;
            } 
            user.catchAttempts[pokemonId]--;
            if (catchSuccess && user.catchAttempts[pokemonId] <= 0) {
                const catchSuccess = attemptCatch(user, targetPokemon);
                if (catchSuccess) {
                    await addPokemon(user, pokemonId);
                    user.pokemons.push({ id: pokemonId, nickname: "", attack: 0, defense: 0 });

                    console.log(`gevangen ${catchSuccess}`);

                    res.redirect('/');
                    req.session.save();
                    return;
                }
            } else {
                if (user.catchAttempts[pokemonId] <= 0) {
                    res.render('catcher', {
                        title: "Catch Failed",
                        pokemon: targetPokemon,
                        user: user,
                        isgevangen: false,
                        message: "Pogin gefaald, probeer opnieuw!"
                    });
                }
            }
        } else if (action === 'release') {
            user.pokemons = user.pokemons.filter(poke => poke.id !== pokemonId);
            await removePokemon(user, pokemonId);
            req.session.user = user;
            res.redirect("/");
        } else {
            res.render('catcher', {
                title: "Attempt to Catch Pokémon",
                message: "Attempt failed, try again!"
            });
        }
    } catch (error) {
        console.log('Error:', error);
        res.status(500).send("pokemon vangen gefaald");
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

app.listen(app.get("port"), async () => {
    try {
        await connect();
        console.log("Server started on http://localhost:" + app.get('port'));
    }
    catch (e) {
        console.error(e);
        console.log("Database couldn't connect");
        process.exit(1);
    }
});