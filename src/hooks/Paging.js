import {useEffect, useState} from 'react';

export function usePaging(dataLength, pageSize){
    const numPages = Math.ceil(dataLength / pageSize);
    const [pageNumber, setPageNumber] = useState(0);
    function handleChangePageNumber(pn){
        setPageNumber(pn);
    }
    useEffect(() => {
        //console.log(numPages);
        if(pageNumber > numPages){
            setPageNumber(numPages-1);
        }
    }, [dataLength]);
    return [pageNumber, numPages, handleChangePageNumber];
}