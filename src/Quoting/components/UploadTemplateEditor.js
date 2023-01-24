import {useState, useEffect} from 'react';

import update from 'immutability-helper';

import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Spreadsheet from "react-spreadsheet";

import {letterValue} from "./../../scripts/ExcelHelpers";
import { TextControl } from '../../components/Forms';

function UploadTemplateEditor(props){
    const [data, setData] = useState([[]]);
    const [dims, setDims] = useState({x: 4, y: 4});
    const [colour, setColour] = useState(null);
    useEffect(() => {
        const d = [...Array(dims.y).keys()].map((j) => {
            return [...Array(dims.x).keys()].map((i) => {
                if(j < data.length && i < data[j].length){
                    return data[j][i];
                }
                return {};
            });
        });
        setData(d);
    }, [dims]);
    function handleBlurX(value){
        if(value.length > 2){
            value = 'ZZ';
        }
        setDims(update(dims, {
            x: {$set: letterValue(value)}
        }));
    }
    function handleBlurY(value){
        const v = value === "" ? 1 : parseInt(value);
        setDims(update(dims, {
            y: {$set: v}
        }));
    }
    function handleChange(v){
        //setData(v);
    }
    function chooseColour(colour){
        return function(){
            setColour(colour);
        }
    }
    function handleColourCell(c){
        //console.log(c);
        if(c.length > 0){
            const coords = c[0];
            console.log(coords);
            /*
            setData(update(data, {
                [coords.row]: {
                    [coords.column]: {$set: {value: "hi"}}
                }
            }));*/
        }
    }
    return(
        <div>
            <div>
                <Button onClick={chooseColour("Primary")}></Button>
                {/*<Form.Control type='text' value={x} onChange={handleChangeX} 
                onKeyDown={handleKeyDown}
                onBlur={handleBlurX}/>*/}
                <TextControl init={'D'} regex="^[A-Za-z]*$" textFunction={(v) => v.toUpperCase()}
                onBlur={handleBlurX} />
                <TextControl init={'4'} regex="^[0-9]*$"
                onBlur={handleBlurY}
                />
            </div>
            <div>
                <Spreadsheet data={data} onChange={handleChange} onSelect={handleColourCell}/>
            </div>
        </div>
    );
}
export default UploadTemplateEditor;