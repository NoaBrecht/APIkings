function calculateFight(hp: number, defence: number, attack: number) {
    let damage: number = (defence - attack);
    console.debug(`damage: ${damage}`);
    return hp + damage;
}
export function battle(pokemon1: any, pokemon2: any) {
    console.log(`${pokemon1.name} is fighting ${pokemon2.name}`);
    pokemon1.hp = pokemon1.stats[0].base_stat;
    pokemon2.hp = pokemon2.stats[0].base_stat;
    pokemon1.attack = pokemon1.stats[1].base_stat;
    pokemon2.attack = pokemon2.stats[1].base_stat;
    pokemon1.defense = pokemon1.stats[2].base_stat;
    pokemon2.defense = pokemon2.stats[2].base_stat;
    console.debug(`${pokemon1.name} has ${pokemon1.hp} hp, ${pokemon1.attack} attack and ${pokemon1.defense} defense`);
    console.debug(`${pokemon2.name} has ${pokemon2.hp} hp, ${pokemon2.attack} attack and ${pokemon2.defense} defense`);
    do {
        console.debug(`${pokemon1.name} has ${pokemon1.hp} hp left`);
        console.debug(`${pokemon2.name} has ${pokemon2.hp} hp left`);
        pokemon1.hp = calculateFight(pokemon1.hp, pokemon1.defense, pokemon2.attack);
        if (pokemon1.hp <= 0) {
            console.log(`${pokemon2.name} won!`);
            return pokemon2;
        }
        pokemon2.hp = calculateFight(pokemon2.hp, pokemon2.defense, pokemon1.attack);
        if (pokemon2.hp <= 0) {
            console.log(`${pokemon1.name} won!`);
            return pokemon1;
        }
    } while (pokemon1.hp > 0 && pokemon2.hp > 0);
}