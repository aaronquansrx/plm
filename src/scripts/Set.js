export function setSubtraction(a,b){
    return new Set([...a].filter(x => !b.has(x)));
}

export function setIntersection(a,b){
    return new Set([...a].filter(x => b.has(x))); 
}
export function setUnion(a, b){
    return new Set([...a, ...b]);
}