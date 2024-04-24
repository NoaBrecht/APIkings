import { ObjectId } from "mongodb";
import internal from "stream";
export interface Pokemon{
    id:number;
    nickname:string;
}
export interface User {
    _id?: ObjectId;
    username: string;
    email: string;
    password: string;
    activepokemon: number;
    pokemons:Pokemon[];
}