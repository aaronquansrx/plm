import {useState, useEffect, useRef, useMemo} from 'react';
import styled from 'styled-components';
import update from 'immutability-helper';

import Table from 'react-bootstrap/Table';

const CC = styled.td`
&&
{
background-color: ${props => props.bgc ? props.bgc : 'white'}
}
`;

export function PalleteTable(props){
    useEffect(() => {
    }, [props.colourChanges])
    function handleClickCell(i, j){
        return function(e){
            if(props.onClickCell) props.onClickCell(i,j);
        }
    }
    return(
        <Table>
            <tbody>
                {props.data.map((row, j) => {
                    return(
                    <tr key={j}>
                        {row.map((str, i) => {
                            return <ColouredCell key={i} id="ColouredCell" className={'SmallCell'}
                            pallete={props.pallete.colour} content={str} 
                            onColourChange={handleClickCell(i, j)}
                            changeColour={props.colourChanges[j][i]}
                            />
                        }
                        )}
                    </tr>
                    )}
                )}
            </tbody>
        </Table>
    )
}

function ColouredCell(props){
    const [colour, setColour]= useState('white');
    useEffect(() => {
        if(props.changeColour !== null){
            setColour(props.changeColour);
            //console.log(props.changeColour);
        }
    }, [props.changeColour]);
    function handleClick(){
        if(props.pallete !== colour){
            setColour(props.pallete);
            if(props.onColourChange) props.onColourChange(props.pallete);
        }
    }
    return <CC id="ColouredCell" className={'SmallCell'} bgc={colour}
        onClick={handleClick}>
            <div className={"FixedCell"}>{props.content}</div>
        </CC>
}