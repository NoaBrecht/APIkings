export function calculateFight(hp: number, defence: number, attack: number) {
    hp = (hp - (defence - attack));
    console.log(`hp: ${hp}`);
    if (hp > 0) {
        return 0
    }
    return hp;
}
export function battle(pokemon1: any, pokemon2: any) {
    console.log(`${pokemon1.name} is fighting ${pokemon2.name}`);
    pokemon1.hp = pokemon1.stats[0].base_stat;
    pokemon2.hp = pokemon2.stats[0].base_stat;
    pokemon1.attack = pokemon1.stats[1].base_stat;
    pokemon2.attack = pokemon2.stats[1].base_stat;
    pokemon1.defense = pokemon1.stats[2].base_stat;
    pokemon2.defense = pokemon2.stats[2].base_stat;
    do {
        console.log(`${pokemon1.name} has ${pokemon1.hp} hp left`);
        console.log(`${pokemon2.name} has ${pokemon2.hp} hp left`);
        pokemon1.hp = calculateFight(pokemon2.hp, pokemon2.defense, pokemon1.attack);
        if (pokemon2.hp <= 0) {
            console.log(`${pokemon1.name} won!`);
            return 1;
        }
        pokemon1.hp = calculateFight(pokemon1.hp, pokemon1.defense, pokemon2.attack);
        if (pokemon1.hp <= 0) {
            console.log(`${pokemon2.name} won!`);
            return 2;
        }
        console.log(`${pokemon1.name} has ${pokemon1.hp} hp left`);
        console.log(`${pokemon2.name} has ${pokemon2.hp} hp left`);
    } while (pokemon1.hp > 0 && pokemon2.hp > 0);
}