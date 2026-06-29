
export type sudokuErrors = 
{
  columns: Array<boolean|undefined>,
  rows: Array<boolean|undefined>,
  squares: Array<boolean|undefined>,
};

export function validateSudoku(grid:Record<string, any>[][]): sudokuErrors {
  // STUB: return no errors
  return {
    columns: [],
    rows: [],
    squares: [],
  };
}