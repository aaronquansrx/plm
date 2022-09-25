import React, {useEffect, useState} from 'react';
import XLSX from 'xlsx';
export function useExcelUpload(){
    const [sheet, setSheet] = useState([]);
    const [filename, setFilename] = useState();
    //only uploads first sheet
    function parseSheet(workbook, file, asObj=false){
        setFilename(file);
        //Get first worksheet
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        //Convert worksheet to array of arrays
        const colRange = XLSX.utils.decode_range(ws['!ref']).e.c+1;
        let headers = [];
        let passData;
        if(asObj){
            const data = XLSX.utils.sheet_to_json(ws);
            if(data.length > 0){
                headers = Object.keys(data[0]);
            }
            passData = data;
            setSheet(data);
        }else{
            const data = XLSX.utils.sheet_to_json(ws, {header:1});
            passData = data.reduce((arr,l) => {
                const line = [];
                for(let i=0; i<colRange; i++){
                    const v = l[i] ? l[i].toString() : '';
                    line.push(v);
                }
                if(line.length > 0) arr.push(line);
                return arr;
            }, []);
            headers = passData[0];
            setSheet(passData);
        }
        return {headers: headers, sheet: passData};
    }
    return [sheet, filename, parseSheet];
}