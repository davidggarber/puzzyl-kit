import { test, expect } from '@playwright/test';
import { ContextError, wrapContextError } from '../src/contextError';

function mayday(msg:string) {
  throw new ContextError(msg);
}

function alpha() {
  try {
    mayday('oops');
  }
  catch (ex) {
    throw wrapContextError(ex, 'alpha', undefined);
  }
}


test('explicit context error', () => {
  try {
    throw alpha();
  }
  catch (ex) {
    console.log(ex.toString());
  }
});
