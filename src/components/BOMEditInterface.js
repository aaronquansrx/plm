import React, {useEffect, useState} from 'react';

import update from 'immutability-helper';
import {ExcelDisplayTable, CheckboxRowCustomColumnTable, ReactTable, ChooseHeaderRowsTable} from './Tables';

import Button from 'react-bootstrap/Button';

import './../css/table.css';

const tableHeaders = [
    {Header:'_remove', accessor: '_'}, {Header:'Manufacturer Part Number', accessor: 'mpn'}, 
    {Header:'Manufacturer', accessor: 'manufacturer'}, {Header:'Quantity', accessor: 'quantity'},
    {Header: 'Internal Part Number', accessor: 'ipn'}, {Header: 'Customer Part Number', accessor: 'cpn'},
    {Header: 'Description', accessor: 'description'}, {Header: 'Reference Designator', accessor: 'reference'},
    {Header:'Custom', accessor: 'custom'}
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
    //console.log(columnAttrs);
    const [editedHeaders, setEditedHeaders] = useState([]);

    const [columnAttributes, setColumnAttributes] = useState([]);

    const [editState, setEditState] = useState(0);
    function handleEditCheckBox(i){
        setEditTableState(update(editTableState, {
            checkedRows: {[i]: 
                {$set: !editTableState['checkedRows'][i]}
            }
        }));
    }
    function handleEditAttributeChange(i, value){
        const valueIndex = editTableState.columnAttributes.reduce((v, h, i) => {
            if(h === value){
                return i;
            }
            return v;
        }, null);
        if(valueIndex !== null){
            setEditTableState(update(editTableState, {
                columnAttributes: {
                    [i]: {$set: value},
                    [valueIndex]: {$set: columnOptions[0]}
                }
            }));
        }else{
            setEditTableState(update(editTableState, {
                columnAttributes: {[i]: 
                    {$set: value}
                }
            }));
        }
    }
    function handleConfirm(){
        switch(editState){
            case 0: // editBOM based on the editTableState
                //console.log(editTableState);
                const editedRowsBOM = [];
                for(var i=0; i<originalSheet.length; i++){
                    if(!editTableState['checkedRows'][i]) editedRowsBOM.push(originalSheet[i]);
                }
                const editedBOM = [];
                editedRowsBOM.forEach((line) => {
                    const BOMLine = {"_unnamed": []};
                    for(var i=0; i<line.length; i++){
                        const attribute = editTableState['columnAttributes'][i];
                        if(attribute !== columnOptions[0]){
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
                //console.log(editedRowsBOM);
                //console.log(editedBOM);
                //console.log(attrs);

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
    /*
    function handleUpload(){
        props.changeState(0);
    }*/
    function handleBack(){
        setEditState(editState-1);
    }
    function renderInterfaceState(){
        switch(editState){
            case 0:
                return(
                <div>
                {/*Remove Selected Lines*/}
                {<CheckboxRowCustomColumnTable sheet={originalSheet} columnOptions={columnOptions}
                checkedRows={editTableState["checkedRows"]} onCheckBox={handleEditCheckBox} 
                columnAttributes={editTableState["columnAttributes"]} onColumnChange={handleEditAttributeChange}/>}
                {/*<ChooseHeaderRowsTable sheet={originalSheet} headings={tableHeaders}/>*/}
                </div>);
            case 1:
                return( 
                <ReactTable data={formattedSheet} headers={columnAttributes}/>
                );
                //return <ExcelDisplayTable sheet={editedSheet}></ExcelDisplayTable>;
            default:
                return "Unknown interface state";
        }
    }
    return(
        <>
        <div className='FlexNormal'>
            <div className='IconNav2'>
                {editState !== 0 && <Button onClick={handleBack}>Back</Button>}
                {' '}
                <Button onClick={handleConfirm}>Confirm</Button>
            </div>
        </div>
        <div className='MainTable'>
        {renderInterfaceState()}
        </div>
        </>
    );
}

export default BOMEditInterface;