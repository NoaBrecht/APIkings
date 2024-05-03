import { Collection, MongoClient } from "mongodb";
import { User } from "./interfaces";
import bcrypt from 'bcrypt';
import dotenv from "dotenv";
dotenv.config();
const saltRounds: number = 13;

export const MONGODB_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017"
export const client = new MongoClient(process.env.MONGO_URI ?? "mongodb://localhost:27017");
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
    const users: User[] = [
        {
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
            username: "Jane Doe",
            email: "Jane@gmail.com",
            password: "321",
            activepokemon: 25,
            pokemons: [
                { id: 1, nickname: "", attack: 0, defense: 0 },
                { id: 2, nickname: "Foemp", attack: 0, defense: 0 },
                { id: 25, nickname: "", attack: 0, defense: 0 },
                { id: 65, nickname: "Bacon", attack: 5, defense: 10 }
            ]
        }
    ];
    if (await userCollection.countDocuments() === 0) {
        for (let user of users) {
            if (user.password)
                user.password = await bcrypt.hash(user.password, saltRounds)
        }
        console.log('Seeding database');
        await userCollection.insertMany(users);
    }
}
export async function registerUser(username: string, email: string, password: string) {
    password = await bcrypt.hash(password, saltRounds)
    let user: User = {
        username: username, email: email, password: password
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
export async function connect() {
    await client.connect();
    await seed();
    console.log('Connected to database');
    process.on('SIGINT', exit);
}