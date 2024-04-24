import { ObjectId } from "mongodb";
export interface Pokemon {
    id: number;
    nickname: string;
}
export interface User {
    _id?: ObjectId;
    username: string;
    email: string;
    password: string;
    activepokemon: number;
    pokemons: Pokemon[];
}