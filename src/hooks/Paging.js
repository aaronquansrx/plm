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
            if(numPages == 0){
                setPageNumber(0);
            }else{
                setPageNumber(numPages-1);
            }
        }
    }, [dataLength]);
    return [pageNumber, numPages, handleChangePageNumber];
}