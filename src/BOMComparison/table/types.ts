

export type Header = {
    label: string,
    accessor: string
}

export namespace Header{
  export function create(label:string, accessor: string):Header{
    return {label, accessor};
  }
  
}

export type TableHeader<T extends Record<string, any>> = {
  accessor: keyof T, label: string
}

export namespace TableHeader{
  export function create<T extends Record<string, any>>(label:string, accessor: keyof T):TableHeader<T>{
    return {label, accessor};
  }

}