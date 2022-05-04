
export function findIndexStringSearchInArray(array, matching){
    const index = array.findIndex((val) => {
        return (typeof val === 'string') 
        ? matching.includes(val.toLowerCase()) 
        : false;
    });
    return index;
}

export function downloadFile(fileName, contents){
    const blob = new Blob([contents],{type:'application/json'});
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}