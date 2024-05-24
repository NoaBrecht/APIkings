import { Collection, MongoClient } from "mongodb";
import { Pokemon, Poke, User } from "./interfaces";
import bcrypt from 'bcrypt';
import dotenv from "dotenv";
dotenv.config();
const saltRounds: number = 13;

export const MONGODB_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017"
export const client = new MongoClient(process.env.MONGO_URI ?? "mongodb://localhost:27017");
export const userCollection: Collection<User> = client.db("project_pokemon").collection<User>("users");
export const PokemonCollection: Collection<Poke> = client.db("project_pokemon").collection<Poke>("pokemons");

async function exit() {
    try {
        await client.close();
        console.log('Disconnected from database');
    } catch (error) {
        console.error(error);
    }
    process.exit(0);
}

async function seed() {
    const users: User[] = [
        {
            username: "John Doe",
            email: "John.Doe@gmail.com",
            password: "123",
            activepokemon: 2,
            pokemons: [
                { id: 1, nickname: "", attack: 0, defense: 0 },
                { id: 2, nickname: "Big chungus", attack: 0, defense: 0 },
            ],
            catchAttempts: {}
        },
        {
            username: "Jane Doe",
            email: "Jane@gmail.com",
            password: "321",
            activepokemon: 25,
            pokemons: [
                { id: 1, nickname: "", attack: 0, defense: 0 },
                { id: 2, nickname: "Foemp", attack: 0, defense: 0 },
                { id: 25, nickname: "", attack: 0, defense: 0 },
                { id: 65, nickname: "Bacon", attack: 5, defense: 10 }
            ],
            catchAttempts: {}
        }
    ];
    if (await userCollection.countDocuments() === 0) {
        for (let user of users) {
            if (user.password)
                user.password = await bcrypt.hash(user.password, saltRounds)
        }
        console.log('Seeding database with users');
        await userCollection.insertMany(users);
    }
    if (await PokemonCollection.countDocuments() === 0) {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=1000`);
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
                hp: data.stats[0].base_stat,
                attack: data.stats[1].base_stat,
                defense: data.stats[2].base_stat,
            };
        }));
        console.log('Seeding database with pokemon');
        await PokemonCollection.insertMany(pokemonWithImages);
    }
}
export async function registerUser(username: string, email: string, password: string) {
    password = await bcrypt.hash(password, saltRounds)
    let existingUser: User | null = await userCollection.findOne<User>({ username: username })
    if (existingUser) {
        throw new Error();
    }
    let user: User = {
        username: username, email: email, password: password, pokemons: [],
        catchAttempts: {}
    }
    return await userCollection.insertOne(user)
}
export async function login(userName: string, password: string) {
    if (userName === "" || password === "") {
        throw new Error("Email and password required");
    }
    let user: User | null = await userCollection.findOne<User>({ username: userName });
    if (user) {
        if (await bcrypt.compare(password, user.password!)) {
            delete user.password;
            return user;
        } else {
            throw new Error("Password incorrect");
        }
    } else {
        throw new Error("User not found");
    }
}
export async function updateActive(user: User, id: number) {
    return await userCollection.updateOne({ _id: user._id }, { $set: { activepokemon: id } });
}
export async function addPokemon(user: User, id: number) {
    let existingPokemon = user.pokemons?.find(poke => poke.id === id)

    //const existingPokemon = user.pokemons?.find(poke => poke.id === id);
    if (existingPokemon) {
        throw new Error('Pokemon already caught');
    }
    return await userCollection.updateOne(
        { _id: user._id },
        { $push: { pokemons: { id: id, nickname: "", attack: 0, defense: 0 } } }
    );
}
export async function removePokemon(user: User, id: number) {
    return await userCollection.updateOne({ _id: user._id }, { $pull: { pokemons: { id: id } } });
}
export async function updateNickName(user: User, pokemonID: number, nickname: string) {
    return await userCollection.updateOne({ _id: user._id, "pokemons.id": pokemonID }, { $set: { "pokemons.$.nickname": nickname } });
}
export async function updateDefense(user: User, pokemonID: number) {
    return await userCollection.updateOne(
        { _id: user._id, "pokemons.id": pokemonID }, { $inc: { "pokemons.$.attack": 1 } }
    );
}
export async function updateAttack(user: User, pokemonID: number) {
    return await userCollection.updateOne(
        { _id: user._id, "pokemons.id": pokemonID }, { $inc: { "pokemons.$.defense": 1 } }
    );
}
export async function connect() {
    await client.connect();
    await seed();
    console.log('Connected to database');
    process.on('SIGINT', exit);
}