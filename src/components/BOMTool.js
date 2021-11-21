import React, {useState} from 'react';

import {ExcelDisplayTable, JsonArrayDisplayTable} from './Tables'; 
/*
Main tool for working with BOMs
Functions: 
Part lookup
*/

function BOMTool(props){
    console.log(props.BOMData);
    function BOMDataToArray(){

    }
    return (
        <div>
            This is where BOMs are viewed
            <JsonArrayDisplayTable jsonArray={props.BOMData.BOM} headings={props.BOMData.columnFields}/>
        </div>
    );
}

export default BOMTool;