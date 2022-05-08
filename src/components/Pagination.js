import {useState, useEffect} from 'react';

import Pagination from 'react-bootstrap/Pagination';

import {NumberInput} from './Forms';

export function PageInterface(props){
    //const [entriesPerPage, setEntriesPerPage] = useState(5);
    const current = props.current + 1;
    function prePages(){
        const pages = [];
        for(let i=props.displayWidth; i>0; i--){
            const val = current-i;
            if(val > 0){
                pages.push(val);
            }
        }
        return pages;
    }
    function postPages(){
        const pages = [];
        for(let i=1; i<=props.displayWidth; i++){
            const val = current+i;
            if(val <= props.max){
                pages.push(val);
            }
        }
        return pages;
    }
    function handlePageClick(i){
        return function(){
            if(i !== props.current) props.onPageClick(i);
        }
    }
    return(
        <div>
            <Pagination>
                <Pagination.First onClick={handlePageClick(0)}/>
                {prePages().map(pn => {
                    return(
                        <Pagination.Item key={pn} onClick={handlePageClick(pn-1)}>
                            {pn}
                        </Pagination.Item>
                    );
                })}
                <Pagination.Item active>
                    {current}
                </Pagination.Item>
                {postPages().map(pn => {
                    return(
                        <Pagination.Item key={pn} onClick={handlePageClick(pn-1)}>
                            {pn}
                        </Pagination.Item>
                    );
                })}
                <Pagination.Last onClick={handlePageClick(props.max-1)}/>
            </Pagination>
            <NumberInput value={props.pageSize} onBlur={props.onChangePageSize} label='Page Size'/>
        </div>
    );
}

