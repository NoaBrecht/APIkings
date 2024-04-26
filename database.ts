import { Collection, MongoClient } from "mongodb";
import { User } from "./interfaces";
import dotenv from "dotenv"; dotenv.config();



export const client = new MongoClient(process.env.MONGO_URI || "mongodb://localhost:27017");

export const userCollection: Collection<User> = client.db("project_pokemon").collection<User>("users");

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
    const students: User[] = [
        {
            id: 1,
            username: "John Doe",
            email: "John.Doe@gmail.com",
            password: "123",
            activepokemon: 2,
            pokemons: [
                { id: 1, nickname: "", attack: 0, defense: 0 },
                { id: 2, nickname: "Big chungus", attack: 0, defense: 0 },
            ]
        },
        {
            id: 2,
            username: "Jane Doe",
            email: "Jane@gmail.com",
            password: "321",
            activepokemon: 25,
            pokemons: [
                { id: 1, nickname: "", attack: 0, defense: 0 },
                { id: 2, nickname: "Foemp", attack: 0, defense: 0 },
                { id: 25, nickname: "", attack: 0, defense: 0 }
            ]
        }
    ];
    if (await userCollection.countDocuments() === 0) {
        console.log('Seeding database');
        await userCollection.insertMany(students);
    }
}
export async function getUser(_userId: number) {
    return await userCollection.findOne({ id: _userId });
}
export async function connect() {
    try {
        await client.connect();
        await seed();
        console.log('Connected to database');
        process.on('SIGINT', exit);
    } catch (error) {
        console.error(error);
    }
}