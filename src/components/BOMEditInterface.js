import React, {useEffect, useState} from 'react';

import update from 'immutability-helper';
import {ExcelDisplayTable, CheckboxRowCustomColumnTable} from './Tables';

const tableHeaders = [
    {Header:'_remove', accessor: '_'},
    {Header:'Custom', accessor: 'custom'}, {Header:'Manufacturer Part Number', accessor: 'mpn'}, 
    {Header:'Manufacturer', accessor: 'manufacturer'}, {Header:'Quantity', accessor: 'quantity'}
];
const columnOptions = tableHeaders.map((obj) => obj.Header);
const headerToAccessor = tableHeaders.reduce(function(map, obj) {
    map[obj.Header] = obj.accessor;
    return map;
}, {});

function BOMEditInterface(props){
    const [originalSheet, setOriginalSheet] = useState(props.bom); // bom before editing
    const [editedSheet, setEditedSheet] = useState(props.bom); // edited bom (display)
    const [formattedSheet, setFormattedSheet] = useState([]); // will be sent to BOMInterface (array of same object)
    //keeps track of the edited table state
    const columnAttrs = props.bom.length > 0 ? Array(props.bom[0].length).fill(columnOptions[0]) : [];
    const [editTableState, setEditTableState] = useState({
        checkedRows: Array(props.bom.length).fill(false), 
        columnAttributes: columnAttrs
    });
    console.log(columnAttrs);

    const [columnAttributes, setColumnAttributes] = useState([]);

    const [editState, setEditState] = useState(0);
    console.log(props.bom);
    function handleEditCheckBox(i){
        setEditTableState(update(editTableState, {
            checkedRows: {[i]: 
                {$set: !editTableState['checkedRows'][i]}
            }
        }));
    }
    function handleEditAttributeChange(i, value){
        setEditTableState(update(editTableState, {
            columnAttributes: {[i]: 
                {$set: value}
            }
        }));
    }
    function handleConfirm(){
        switch(editState){
            case 0: // editBOM based on the editTableState
                console.log(editTableState);
                const editedRowsBOM = [];
                for(var i=0; i<originalSheet.length; i++){
                    if(!editTableState['checkedRows'][i]) editedRowsBOM.push(originalSheet[i]);
                }
                const editedBOM = [];
                editedRowsBOM.forEach((line) => {
                    const BOMLine = {"_unnamed": []};
                    for(var i=0; i<line.length; i++){
                        const attribute = editTableState['columnAttributes'][i];
                        if(attribute != columnOptions[0]){
                            BOMLine[headerToAccessor[attribute]] = line[i];
                        }else{
                            BOMLine["_unnamed"].push(line[i]);
                        }
                    }
                    editedBOM.push(BOMLine);
                    //display order
                    //list of obj (bom data)
                });
                const attrs = editTableState.columnAttributes.reduce((arr, attr) => {
                    if(attr !== tableHeaders[0].Header){
                        arr.push({Header: attr, accessor: headerToAccessor[attr]});
                    }
                    return arr;
                }, []);
                editedRowsBOM.unshift(editTableState['columnAttributes']);
                //todo map column field to index
                setEditedSheet(editedRowsBOM);
                setFormattedSheet(editedBOM);
                setColumnAttributes(attrs);
                break;
            case 1:
                props.onFinishEdit(formattedSheet, columnAttributes);
                //props.onBOMUpload(formattedSheet, tableHeaders); //change 2nd prop
                break;
            default:
                console.log("Unknown BOMUpload state");
                break;
        }
        setEditState(editState+1);
    }
    function handleUpload(){
        props.changeState(0);
    }
    function handleBack(){
        setEditState(editState-1);
    }
    function renderInterfaceState(){
        switch(editState){
            case 0:
                return <div>
                Remove Selected Lines
                <CheckboxRowCustomColumnTable sheet={originalSheet} columnOptions={columnOptions}
                checkedRows={editTableState["checkedRows"]} onCheckBox={handleEditCheckBox} 
                columnAttributes={editTableState["columnAttributes"]} onColumnChange={handleEditAttributeChange}/>
                </div>;
            case 1:
                return <ExcelDisplayTable sheet={editedSheet}></ExcelDisplayTable>;
            default:
                return "Unknown interface state";
        }
    }
    return(
        <>
        {renderInterfaceState()}
        <button onClick={handleUpload}>Upload BOM</button>
        {editState !== 0 && <button onClick={handleBack}>Back</button>}
        
        <button onClick={handleConfirm}>Confirm</button>
        </>
    );
}

export default BOMEditInterface;