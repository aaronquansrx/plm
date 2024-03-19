import { BOMMainFormat, BOMUploadFormat } from "../components/BOMUpload";
import { Header } from "../table/types";
import { ArrayFunctions } from "./general";

export interface BOMComparisonObject{
  upload_format: BOMUploadFormat[];
  main_format: BOMMainFormat[];
  file_name: string;
  main_headers: Header[];
}
  
function new_bom_comparison_object():BOMComparisonObject{
  return {
    upload_format: [],
    main_format: [],
    file_name: '',
    main_headers: []
  }
}

export type BOMDesignatorDifference = {
  old_value: string[],
  new_value: string[],
  additions: string[],
  subtractions: string[]
}

export type BOMNormalDifference = {
  //field: keyof BOMMainFormat,
  //key?: string,
  old_value: string,
  new_value: string
  //difference: string
}

export type BOMDifference = BOMDesignatorDifference | BOMNormalDifference;

export type BOMSideBySideLine = {
  old_line: BOMMainFormat,
  new_line: BOMMainFormat
}

//to determine
export type ComparisonResult = {
  differences: Map<string, Map<keyof BOMMainFormat, BOMDifference>>,
  different_lines: BOMSideBySideLine[];
  additions: BOMMainFormat[]; // in new bom but not old
  subtractions: BOMMainFormat[]; // in old but not new
}

export namespace BOMComparison{
    export function compareMain(bom_old: BOMComparisonObject, bom_new: BOMComparisonObject, 
      comparison_key:keyof BOMMainFormat) : ComparisonResult | undefined{
        if(comparison_key == 'mpn' || comparison_key == 'mfr'){
          return;
        }
        const bom_old_map:Map<string, BOMMainFormat> = new Map(); // map with key as comparison key
        //const order = bom_old.main_format;
        for(const line of bom_old.main_format){
          //console.log(line[comparison_key]);
          const key = line[comparison_key]!;
          bom_old_map.set(key.toString(), line);
        }

        const bom_new_map:Map<string, BOMMainFormat> = new Map();

        const differences:Map<string, Map<keyof BOMMainFormat, BOMDifference>> = new Map();
        const all_different_lines:BOMSideBySideLine[] = [];
        const additions: BOMMainFormat[] = [];
        for(const line of bom_new.main_format){
          const key = line[comparison_key]!;
          if(bom_old_map.has(key)){
            const line_differences = compareLine(bom_old_map.get(key)!, line);
            if(line_differences.size > 0) {
              differences.set(key, line_differences);
              all_different_lines.push({old_line: bom_old_map.get(key)!, new_line: line});
            }
          }else{
            additions.push(line);
          }
          bom_new_map.set(key.toString(), line);
        }
        //console.log(differences);


        const subtractions: BOMMainFormat[] = []
        for(const key of bom_old_map.keys()){
          if(!bom_new_map.has(key)){
            subtractions.push(bom_new_map.get(key)!);
          }
        }


        return {
          differences, different_lines: all_different_lines,
          additions, subtractions
        };
    }
    function bomMap(){

    }

    //to implement comparison key optimisation
    function compareLine(old_line:BOMMainFormat, new_line:BOMMainFormat, comparison_key?: keyof BOMMainFormat): Map<keyof BOMMainFormat, BOMDifference>{
      const bom_difference:Map<keyof BOMMainFormat, BOMDifference> = new Map();
      for(const key in old_line){
        const bom_key = key as keyof BOMMainFormat;
        const old_value = old_line[bom_key];
        const new_value = new_line[bom_key];
        if(key === 'mpn' || key === 'mfr'){
          // array of string comparison
        }
        else{
          //string comparison
          const old_string: string = old_value as string;
          const new_string: string = new_value as string;
          if(key === 'designator'){
            //split into array of strings
            const old_set = old_string.split(',');
            const new_set = new_string.split(',');
            console.log(old_set);
            console.log(new_set);
            const additions = ArrayFunctions.find_difference(new_set, old_set);
            const subtractions = ArrayFunctions.find_difference(old_set, new_set);
            if(additions.length > 0 || subtractions.length > 0){  
              bom_difference.set(bom_key, {
                old_value: old_set, new_value: new_set,
                additions: additions, subtractions: subtractions
              });
            }
          }else{
            if(old_value !== new_value){
              bom_difference.set(bom_key, {
                old_value: old_string, new_value: new_string
              });
            }
          }
        }
      }
      return bom_difference;
    }
}