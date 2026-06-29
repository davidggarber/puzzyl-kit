export type sudokuErrors = {
    columns: Array<boolean | undefined>;
    rows: Array<boolean | undefined>;
    squares: Array<boolean | undefined>;
};
export declare function validateSudoku(grid: Record<string, any>[][]): sudokuErrors;
