import {useState} from 'react';

export function usePaging(dataLength, pageSize){
    const numPages = Math.ceil(dataLength / pageSize);
    const [pageNumber, setPageNumber] = useState(0);
    function handleChangePageNumber(pn){
        setPageNumber(pn);
    }
    return [pageNumber, numPages, handleChangePageNumber];
}