import {useState, useEffect, useMemo} from 'react';

export function useTableBOM(bom, tableHeaders, apis, apiData){
    const initTableBOM = useMemo(() => {
        return bom.map((line) => {
            line.mpns = {
                mpn: line.mpn,
                options: line.mpnOptions
            }
            line.quantities = {
                initial: line.quantity,
                single: line.quantity,
                multi: line.quantity,
            }
            return line;
        })
    });
    const [tableBOM, setTableBOM] = useState(initTableBOM);
    const headers = useMemo(() => {
        const headerChangeMap = {
            mpn: 'mpns',
            quantity: 'quantities'
        };
        const headers = tableHeaders.concat(apis);
        return headers.map((header) => {
            if(header.accessor in headerChangeMap){
                header.accessor = headerChangeMap[header.accessor];
            }
            return header;
        });
    });
    const [updateTable, setUpdateTable] = useState(0);
    useEffect(() => {

        const updateTimeout = setTimeout(
            () => setUpdateTable(updateTable+1)
        , 1000);
        return () => {
            clearTimeout(updateTimeout);
        }
    }, [updateTable]);
    return [tableBOM, setTableBOM, headers];
}