import {findIndexStringSearchInArray} from './General';

export function bomEditParse(table, columnAttrs, rowChecked, tableHeaders){
    const headerToAccessor = tableHeaders.reduce(function(map, obj) {
        map[obj.Header] = obj.accessor;
        return map;
    }, {});
    const editedRowBom = table.reduce((arr, line, i) => {
        if(!rowChecked[i]) arr.push(line);
        return arr;
    }, []);
    const editedBom = editedRowBom.reduce((arr, line) => {
        const bomLine = {_unnamed: []};
        //let mpns = [];
        line.forEach((cell, i) => {
            const attr = columnAttrs[i];
            if(attr !== tableHeaders[0].Header){
                switch(headerToAccessor[attr]){
                    case 'mpn':
                        const mpns = cell.split(', ');
                        bomLine.mpn = mpns[0];
                        bomLine.mpnOptions = mpns;
                        break;
                    case 'quantity':
                        const quant = parseInt(cell);
                        bomLine.quantity = quant;
                        bomLine.display_quantity = quant;
                        bomLine.quantities = {
                            single: quant,
                            multi: quant,
                        }
                        break;
                    default:
                        bomLine[headerToAccessor[attr]] = cell;
                        break;
                }
                /*
                if(headerToAccessor[attr] === 'mpn'){
                    const mpns = cell.split(', ');
                    if(mpns.length > 1){

                    }
                }else if(headerToAccessor[attr] === 'quantity'){
                    bomLine.quantity = cell;
                    bomLine.display_quantity = cell;
                    bomLine.quantities = {
                        single: 1,
                        multi: 1,
                    }
                }else{
                    bomLine[headerToAccessor[attr]] = cell;
                }
                */
            }else{
                bomLine["_unnamed"].push(cell);
            }
        });
        if(!('quantity' in bomLine)){
            bomLine.quantity = 1;
            bomLine.display_quantity = '1';
            bomLine.quantities = {
                single: 1,
                multi: 1,
            }
        }
        /*
        mpns.forEach((mpn, i) => {
            const bl = {...bomLine}; 
            bl.mpn = mpn;
            if(i !== 0) bl.display_quantity = '';
            arr.push(bl);
        });
        */
        return arr;
    }, []);

    const bomAttrs =  columnAttrs.reduce((arr, attr) => {
        if(attr !== tableHeaders[0].Header && headerToAccessor[attr] !== 'quantity'){
            arr.push({Header: attr, accessor: headerToAccessor[attr]});
        }
        return arr;
    }, []);
    //bomAttrs.push({Header: 'Quantity', accessor: 'display_quantity'});
    //console.log(bomAttrs);
    return {editedBom: editedBom, columnAttributes: bomAttrs};
}

export function autoFindAttributes(bom, attributes=[]){
    //change attributes to array
    if(bom.length > 0){
        const cols = attributes.reduce((arr, v) => {
            const i = findIndexStringSearchInArray(bom[0], v.search);
            if(i !== -1){
                arr.push({header: v.header, index: i});
            }
            return arr;
        }, []);
        const mpnI = cols.reduce((i, col) => {
            if(col.header.accessor === 'mpn') return col.index;
            return i;
        }, -1);
        const quantityI = cols.reduce((i, col) => {
            if(col.header.accessor === 'quantity') return col.index;
            return i;
        }, -1);
        if(mpnI !== -1){
            //execute autofind
            const headers = cols.map((attr) => {
                let h = attr.header;
                if(attr.header.accessor === 'quantity'){
                    return {Header: 'Quantity', accessor: 'display_quantity'}
                }
                return h;
            });
            cols.splice(quantityI, 1); // remove quantity (evaluate seperate)
            cols.shift(); // remove mpn (eval seperate)
            bom.shift();
            const bomData = bom.reduce((arr, line) => {
                const bomLine = {};
                const mpns = line[mpnI].split(', '); // mpn
                bomLine.mpn = mpns[0];
                bomLine.mpnOptions = mpns;
                if(quantityI !== -1){
                    const quant = parseInt(line[quantityI]);
                    bomLine.quantity = parseInt(line[quantityI]);
                    bomLine.display_quantity = line[quantityI].toString();
                    bomLine.quantities = {
                        single: quant,
                        multi: quant
                    }
                }else{
                    bomLine.quantity = 1;
                    bomLine.display_quantity = '1';
                    bomLine.quantities = {
                        single: 1,
                        multi: 1
                    }
                }
                cols.forEach((col) => {
                    bomLine[col.header.accessor] = line[col.index];
                });
                arr.push(bomLine);
                /*
                mpns.forEach((mpn, i) => {
                    const bl = {...bomLine}; 
                    bl.mpn = mpn;
                    if(i !== 0) bl.display_quantity = '';
                    arr.push(bl);
                });
                */
                return arr;
            }, []);
            return {found: true, bom: bomData, headers: headers};
        }
    }
    return {found: false};
}