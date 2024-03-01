

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
}