

export type CompareBOMLine = {
    ipn: number,
    mpn: string,
    mfr: string,
    designator: string,
    description: string,
    quantity: number,
    ['alias/cpn']?: string,
}



export type CollectedBOMLine = {
    id?: number,
    ipn:number,
    mpn: string[],
    mfr: string[],
    designator: string,
    description: string,
    quantity: number,
    ['alias/cpn']?: string,
}

export type CompareBOM = {

}

export type CombinedBOMLine = {
    bom1: CompareBOMLine,
    bom2: CompareBOMLine,
}

export type SeperateCombined = {
    bom1: CompareBOMLine[],
    bom2: CompareBOMLine[]
}

export namespace BOMComparisonFunctions{
    export function collect_compare_lines_to_ipn(compare_lines: CompareBOMLine[]): CollectedBOMLine[]{
        const collections: (CollectedBOMLine | undefined)[] = new Array(compare_lines.length).fill(undefined);
        compare_lines.forEach((line) => {
            if(collections[line.ipn] == undefined){
                collections[line.ipn] = {
                    ipn: line.ipn,
                    mpn: [line.mpn],
                    mfr: [line.mfr],
                    designator: line.designator,
                    description: line.description,
                    quantity: line.quantity
                };
            }else{
                collections[line.ipn]?.mpn.push(line.mpn);
                collections[line.ipn]?.mfr.push(line.mfr);
            }
        });
        const out: CollectedBOMLine[] = collections.reduce(
            (arr:CollectedBOMLine[], 
            line:CollectedBOMLine | undefined) => {
            if(line != undefined){
                arr.push(line)
            }
            return arr;
        }, []);
        return out as CollectedBOMLine[];
    }

    export function seperate_combined(combined: CombinedBOMLine[]): SeperateCombined{
        const bom1 = combined.map((l) => {
            return l.bom1;
        });
        const bom2 = combined.map((l) => {
            return l.bom2;
        });
        
        return {
            bom1: bom1, bom2: bom2
        }
    }

    export function collect_on_field(compare_lines: CompareBOMLine[], field:'ipn'|'alias/cpn'): CollectedBOMLine[]{
        //const collections: (CollectedBOMLine | undefined)[] = new Array(compare_lines.length).fill(undefined);
        const collections = new Map<string, CollectedBOMLine>();
        let id = 0;
        //console.log(compare_lines);
        compare_lines.forEach((line) => {
            if(field as keyof CompareBOMLine in line){
                const key = line[field as keyof CompareBOMLine]?.toString();
                if(key){
                    if(collections.has(key)){
                        const collection = collections.get(key);
                        collection?.mpn.push(line.mpn);
                        collection?.mfr.push(line.mfr);
                    }else{
                        collections.set(key, {
                            ...line,
                            id: id,
                            mpn: [line.mpn],
                            mfr: [line.mfr],
                        });
                        id += 1;
                    }
                }
            }
        });
        //console.log(id);
        const out: CollectedBOMLine[] | undefined = new Array(collections.size).fill(undefined);
        for(const [key, line] of collections.entries()){
            if(line.id !== undefined){
                out[line.id] = line;
            }
        }
        return out as CollectedBOMLine[];
    }

}