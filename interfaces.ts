import { ObjectId } from "mongodb";

export interface Pokemon {
    id: number;
    nickname: string;
    attack: number;
    defense: number;
}
export interface User {
    _id?: ObjectId;
    username: string;
    email: string;
    password?: string;
    activepokemon?: number;
    pokemons?: Pokemon[];
    catchAttempts: { [pokemonId: string]: number };
}

//! PokeAPI interface, use on own risk
export interface Poke {
    id: number;
    name: string;
    species: Species;
    sprites: Sprites;
    stats: Stat[];
    types: Type[];
}

export interface Species {
    name: string;
    url: string;
}

export interface Sprites {
    back_default: string;
    back_female: string;
    back_shiny: string;
    back_shiny_female: string;
    front_default: string;
    front_female: string;
    front_shiny: string;
    front_shiny_female: string;
    other: Other;
}

export interface Other {
    home: Home;
}

export interface Home {
    front_default: string;
    front_female: string;
    front_shiny: string;
    front_shiny_female: string;
}

export interface Stat {
    base_stat: number;
    effort: number;
    stat: Species;
}

export interface Type {
    slot: number;
    type: Species;
}
