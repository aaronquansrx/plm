import React, {useState} from 'react';

import XLSX from 'xlsx';

import {MyDropzone} from './Dropzone';
import {ExcelDisplayTable, CheckLinesExcelTable} from './Tables';

function BOMFileUploadInterface(props){
    const [sheet, setSheet] = useState([]);

    function handleDrop(workbook){
        console.log(workbook);
        //Get first worksheet
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        //Convert worksheet to array of arrays
        const data = XLSX.utils.sheet_to_json(ws, {header:1});
        setSheet(data);
    }
    return (
        <>
        <MyDropzone onDrop={handleDrop}></MyDropzone>
        <CheckLinesExcelTable sheet={sheet}/>
        </>
    );
}

export default BOMFileUploadInterface;