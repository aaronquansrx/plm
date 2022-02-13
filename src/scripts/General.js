
export function findIndexStringSearchInArray(array, matching){
    const index = array.findIndex((val) => {
        return (typeof val === 'string') 
        ? matching.includes(val.toLowerCase()) 
        : false;
    });
    return index;
}