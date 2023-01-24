import {useState, useEffect, useMemo, useRef} from 'react';
import update from 'immutability-helper';

import Button from 'react-bootstrap/Button';
import Nav from 'react-bootstrap/Nav';
import styled from 'styled-components';

import { PalleteTable } from '../components/PalleteTable';

import './../../css/main.css';

const S1 = styled.div`
    width: 30px;
    height: 25px;
    background-color: ${props => props.bgc ? props.bgc : 'white'};
`;

function UploadTable(props){
    const [colour, setColour] = useState(null);
    const [palleteSetting, setPalleteSetting] = useState('single');
    const [pallete, setPallete] = useState({colour: null, setting: 'single'});
    const sheetNames = useMemo(() => {
        return props.sheets.map((sheet) => sheet.name);
    }, [props.sheets]);
    //const [displaySheet, setDisplaySheet] = useState(props.sheets[0].array);
    const [activeSheetIndex, setActiveSheetIndex] = useState(0);
    const tableDiv = useRef(null);
    const selectedRow = useRef(null);
    const greys = useRef([]);

    const [colourChanges, setColourChanges] = useState(props.sheets[activeSheetIndex].array.map((row) => row.map(() => null)));
    const headerMatch = useRef(null); // null for no match
    const activeSheet = props.sheets[activeSheetIndex].array;
    //console.log(colourChanges);
    function changeColour(c){
        return function(){
            console.log(c);
            setColour(c)
            setPallete(update(pallete, {
                colour: {$set: c}
            }));
        }
    }
    function test(){
        console.log(selectedRow.current);
        console.log(greys.current);
        console.log(tableDiv);
    }
    function handleSelectCell(i,j){
        //console.log(greys);
        if(pallete.colour==='lightblue'){
            const cSheet = props.sheets[activeSheetIndex].array;
            const ccs = props.sheets[activeSheetIndex].array.map((row) => row.map(() => null));
            const headerSet = new Set(props.quoteHeaders);
            const rowColours = cSheet[j].map((h, n) => {
                if(headerSet.has(h)){
                    return 'lightblue';
                }
                return 'red';
            });
            ccs[j] = rowColours;
            if(selectedRow.current !== null){
                ccs[selectedRow.current] = cSheet[selectedRow.current].map(() => 'white');
            }
            for(let n = j+1; n < cSheet.length; n++){
                ccs[n] = cSheet[n].map(() => 'aqua');
            }
            setColourChanges(ccs);
            selectedRow.current = j;
            console.log(cSheet[j]);
            headerMatch.current = cSheet[j].map((h, n) => {
                if(headerSet.has(h)){
                    return h;
                }
                return null;
            }, []);
        }else if(pallete.colour==='grey'){
            greys.current = update(greys.current, {
                $push: [{x: i, y: j}]
            });
        }
    }
    function handleSubmit(){
        if(headerMatch.current !== null){
            const objArray = [];
            for(let j = selectedRow.current+1; j < activeSheet.length; j++){
                const obj = activeSheet[j].reduce((obj, v, n) => {
                    if(headerMatch.current[n] !== null){
                        obj[headerMatch.current[n]] = v;
                    }
                    return obj;
                }, {});
                //console.log(obj);
                objArray.push(obj);
            }
            console.log(objArray);
        }
    }
    function handleSheetChange(i){
        return function(){
            //setDisplaySheet(props.sheets[i].array);
            setActiveSheetIndex(i)
        }
    }
    return(
        <div>
            <div>
                <div>
                <Button variant='secondary' onClick={props.back}>Back</Button>
                <Button onClick={handleSubmit}>Submit</Button>
                </div>
                <div className='Hori'>
                    <div>
                        <span className='Hori' onClick={changeColour('lightblue')}>Header Row: <S1 bgc={'lightblue'}/></span>
                        <span className='Hori'>Invalid Header: <S1 bgc={'red'}/></span>
                        <span className='Hori' onClick={changeColour('aqua')}>Data Collected: <S1 bgc={'aqua'}/></span>
                        {/*<Button onClick={test}>Get Data</Button>*/}
                    </div>
                    <div>
                        <span className='Hori' onClick={changeColour('yellow')}>Product 1: <S1 bgc={'yellow'}/></span>
                        <span className='Hori' onClick={changeColour('orange')}>Product 2: <S1 bgc={'orange'}/></span>
                        <span className='Hori' onClick={changeColour('white')}>Clear: <S1 bgc={'grey'}/></span>
                    </div>
                </div>
            </div>
            {

            }
            <div>
                <Nav variant="tabs">
                    {sheetNames.map((tab, i) => 
                        <Nav.Item key={i} onClick={handleSheetChange(i)}>
                            <Nav.Link>{tab}</Nav.Link>
                        </Nav.Item>
                    )}
                </Nav>
            <div ref={tableDiv}>
            <PalleteTable data={props.sheets[activeSheetIndex].array} pallete={pallete} onClickCell={handleSelectCell}
            colourChanges={colourChanges}/>
            </div>
            </div>
        </div>
    )
}

export default UploadTable;