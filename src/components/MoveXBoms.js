import {useState, useEffect, useRef} from 'react';
import { getPLMRequest, postPLMRequest } from '../scripts/APICall';

export function MoveXBOMFinder(){
    function collectMoveXBomData(){
        getPLMRequest('movex', {boms: ''}, (res) => {
            console.log(res);
        }, (res) => {
            console.log(res);
        });
    }
    return (
        <>
        <Button onClick={collectMoveXBomData}>Find MoveXBoms</Button>
        </>
    )
}