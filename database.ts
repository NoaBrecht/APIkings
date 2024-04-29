import { Collection, MongoClient } from "mongodb";
import { User } from "./interfaces";


export const client = new MongoClient("mongodb+srv://APIkings:APIkings@apikings.lfjnvkg.mongodb.net/?retryWrites=true&w=majority&appName=APIkings");
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
    const students : User[] = [
        { username: "John Doe",id: 1, email: "John.Doe@gmail.com",password:"123",activepokemon:2,pokemons:[{id:1,nickname:""},{id:2,nickname:"Big chungus"}] }
    ];
    if (await userCollection.countDocuments() === 0) {
        await userCollection.insertMany(students);
    }
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