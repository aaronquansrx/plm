

export namespace ObjectFunctions{ 
  export function add_keys_to(keys:string[], from:Record<string, any>, to:Record<string, any>): Record<string, any>{
    for(const key of keys){
      add_key_to(key, from, to);
    }
    return to;
  }
  export function add_key_to(key:string, from:Record<string, any>, to:Record<string, any>): Record<string, any>{
    if(key in from) to[key] = from[key];
    return to;
  }
  export function compare_equals<T>(o1: T, o2: T):boolean{
    return JSON.stringify(o1) === JSON.stringify(o2); 
  }
}

export namespace ArrayFunctions{
  export function find_intersection<T>(arr1:T[], arr2:T[]): T[]{
    const intersection:T[] = arr1.reduce((arr:T[], t1) => {
      const find = arr2.find((t2) => ObjectFunctions.compare_equals(t1, t2));
      if(find !== undefined) arr.push(find);
      return arr;
    }, []);
    return intersection;
  }
  export function find_difference<T>(arr1:T[], arr2:T[]): T[]{
    return arr1.filter(x => !arr2.includes(x));
  }
}


export namespace SetFunctions{
  export function set_subtraction<T>(set1:Set<T>, set2:Set<T>):Set<T>{
    return new Set([...set1].filter(x => ![...set2].includes(x)));
  }
}
