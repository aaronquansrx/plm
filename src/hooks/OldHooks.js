


//for BOMTable.js

function lineOfferEvaluation(line, algoData){
    const retLine = {...line};
    apisList.forEach((api) => {
        retLine[api].offers.forEach((off, i) => {
            off.adjusted_quantity = algoData[api][i].adjusted_quantity;
            off.excess_quantity = algoData[api][i].excess_quantity;
            off.excess_price = algoData[api][i].excess_price;
            off.total_price = algoData[api][i].total_price;
            off.prices.price = algoData[api][i].price_per;
            off.prices.index = algoData[api][i].index;
            off.prices.total = algoData[api][i].total_price;
        });
    });
    return retLine;
}

function lineAlgorithmsModifyFull(line, algoData){
    const stockOnly = algoData.in_stock_only;
    const notStockOnly = algoData.not_stock_only;

    //best price
    const bestPrice = stockOnly.bestpricefull;
    const bestPriceNoStock = notStockOnly.bestpricefull;
    const priceHL = bestPrice.best ? {api: bestPrice.best.api, offerNum: bestPrice.best.offerNum} : null;
    const priceNoStockHL = bestPriceNoStock.best ? 
    {api: bestPriceNoStock.best.api, offerNum: bestPriceNoStock.best.offerNum} : null;

    //lead time
    const leadTime = stockOnly.bestleadtimefull;
    const leadTimeNoStock = notStockOnly.bestleadtimefull;
    const leadtimeHL = leadTime.best ? 
        {api: leadTime.best.api, offerNum: leadTime.best.offerNum} : null;
    const leadtimeNoStockHL = leadTimeNoStock.best ? 
        {api: leadTimeNoStock.best.api, offerNum: leadTimeNoStock.best.offerNum} : null;

    line.highlights.stock.price = priceHL;
    line.highlights.noStock.price = priceNoStockHL;
    line.highlights.stock.leadTime = leadtimeHL;
    line.highlights.noStock.leadTime = leadtimeNoStockHL;
    if(bestPrice.best){
        line.offerEvaluation.price = {
            offers: [bestPrice.best],
            quantity_found: bestPrice.best.quantity,
            total_price: bestPrice.best.total,
            fully_evaluated: bestPrice.best.quantity >= line.quantities.multi
        }
    }else{
        line.offerEvaluation.price = {
            offers: [],
            quantity_found: 0,
            total_price: 0,
            fully_evaluated: false
        }
    }
    if(leadTime.best){
        line.offerEvaluation.leadtime = {
            offers: [leadTime.best],
            quantity_found: leadTime.best.quantity,
            total_price: leadTime.best.total,
            fully_evaluated: leadTime.best.quantity >= line.quantities.multi
        }
    }else{
        line.offerEvaluation.leadtime = {
            offers: [],
            quantity_found: 0,
            total_price: 0,
            fully_evaluated: false
        }
    }
    const stockInfo = stockOnly.offerinfoquantityprices;
    const noStockInfo = notStockOnly.offerinfoquantityprices;
    apisList.forEach((api) => {
        line[api].offerOrder.stock.price = bestPrice.sort[api];
        line[api].offerOrder.noStock.price = bestPriceNoStock.sort[api];
        line[api].offerOrder.stock.leadTime = leadTime.sort[api];
        line[api].offerOrder.noStock.leadTime = leadTimeNoStock.sort[api];

        line[api].offers.forEach((off, i) => {
            //if(!stockInfo[api][i] || !noStockInfo[api][i]) return;
            off.adjustedQuantity = {
                stock: stockInfo[api][i].quantity,
                noStock: noStockInfo[api][i].quantity
            };

            off.prices.price = {
                stock: stockInfo[api][i].price_per,
                noStock: noStockInfo[api][i].price_per,
            };
            off.prices.pricingIndex = {
                stock: stockInfo[api][i].index,
                noStock: noStockInfo[api][i].index
            };
            off.prices.total_price = {
                stock: stockInfo[api][i].total,
                noStock: noStockInfo[api][i].total
            }
            off.totalPrice = {
                stock: stockInfo[api][i].total,
                noStock: noStockInfo[api][i].total,
            };
            //off.prices.pricingIndex = algorithmsStockStructure(bestPrice.offer_info[api][i].index);
            off.excessQuantity = {
                stock: stockInfo[api][i].excess_quantity,
                noStock: noStockInfo[api][i].excess_quantity,
            };
            off.excessPrice = {
                stock: stockInfo[api][i].excess_price,
                noStock: noStockInfo[api][i].excess_price,
            }
        });
    });

    return line;
}
function runBOMAlgorithms(b=null, lt=null){
    const bom = b === null ? tableBOM : b;
    const newLeadtimeCutOff = lt == null ? ltco : lt;
    const hasInStock = true;
    axios({
        method: 'POST',
        url: serverUrl+'api/algorithms',
        data: {
            bom: bom,
            algorithms: ['bestpricefull', 'bestleadtimefull', 'offerinfoquantityprices'],
            in_stock: hasInStock,
            lead_time_cut_off: newLeadtimeCutOff
        }
    }).then(response => {
        //console.log(response);
        console.log(response.data);
        //const algos = response.data.data;
        /*
        const newTableBOM = [...bom].map((line,i) => {
            const newLine = lineAlgorithmsModifyFull({...line}, algos[i]);
            return newLine;
        });
        setTable(newTableBOM);
        */
        //setTableLock(false);
        //changeLocks(false);
        
    });
}
function runBOMLineAlgorithms(row, b=null){
    const bom = b === null ? tableBOM : b;
    const hasInStock = true;
    axios({
        method: 'POST',
        url: serverUrl+'api/algorithms',
        data: {
            line: bom[row],
            algorithms: ['bestpricefull', 'bestleadtimefull', 'offerinfoquantityprices'],
            in_stock: hasInStock,
            lead_time_cut_off: ltco
        }
    }).then(response => {
        console.log(response.data);
        /*
        const algos = response.data.data;
        const newLine = lineAlgorithmsModifyFull({...bom[row]}, algos);
        setTable(update(bom, {
            [row]: {$set: newLine}
        }));
        */
    });
}