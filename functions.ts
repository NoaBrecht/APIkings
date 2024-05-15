export function calculateFight(hp: number, defence: number, attack: number) {
    let fight: number = (hp - (defence - attack));
    if (fight > 0) {
        return 0
    }
    return fight;
}