import { ObjectId } from "mongodb";
export interface Pokemon {
    id: number;
    nickname: string;
    attack: number;
    defense: number;
}
export interface User {
    _id?: ObjectId;
    id: number;
    username: string;
    email: string;
    password: string;
    activepokemon?: number;
    pokemons?: Pokemon[];
}