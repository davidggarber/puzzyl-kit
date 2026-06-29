import { test, expect } from '@playwright/test';
import { valueFromContext, valueFromGlobalContext, getBuilderContext, popBuilderContext, pushBuilderContext, testBuilderContext, theBoilerContext } from '../src/builderContext';

global.structuredClone = (val) => JSON.parse(JSON.stringify(val))

test.beforeEach( () => {
});

test('no context', () => {
  expect(testBuilderContext());
  expect(theBoilerContext()).toEqual({})
});

test('blank context', () => {
  expect(testBuilderContext({}));
  expect(theBoilerContext()).toEqual({})
});

test('get context', () => {
  expect(testBuilderContext({sample:true}));
  expect(getBuilderContext()).toEqual({sample:true})
});

test('push context', () => {
  expect(testBuilderContext({outer:true}));
  expect(pushBuilderContext({inner:true})).toEqual({inner:true});
  expect(getBuilderContext()['inner']).toBeTruthy();
  expect(getBuilderContext()['outer']).toBeUndefined();
});

test('push and pop context', () => {
  expect(testBuilderContext({outer:true}));

  expect(pushBuilderContext({inner:true})).toEqual({inner:true});
  expect(getBuilderContext()['inner']).toBeTruthy();

  expect(popBuilderContext()).toEqual({outer:true});
  expect(getBuilderContext()['inner']).toBeUndefined();
  expect(getBuilderContext()['outer']).toBeTruthy();
});

test('push and clone context', () => {
  expect(testBuilderContext({outer:true}));
  expect(pushBuilderContext()).toEqual({outer:true});
});

test('value from', () => {
  testBuilderContext();  // Ensure other tests haven't left any global context
  expect(valueFromGlobalContext('outer', true)).toEqual('');

  testBuilderContext({outer:true});
  expect(valueFromContext('outer')).toBeTruthy();
  expect(valueFromContext('bogus', true)).toEqual('');
  expect(valueFromGlobalContext('outer')).toBeTruthy();
  expect(valueFromGlobalContext('bogus', true)).toEqual('');

  pushBuilderContext({inner:true});
  expect(valueFromContext('outer', true)).toEqual('');
  expect(valueFromContext('inner')).toBeTruthy();
  expect(valueFromGlobalContext('outer')).toBeTruthy();
  expect(valueFromGlobalContext('inner', true)).toEqual('');

  popBuilderContext();
  expect(valueFromContext('outer')).toBeTruthy();
  expect(valueFromContext('inner', true)).toEqual('');
  expect(valueFromGlobalContext('outer')).toBeTruthy();
  expect(valueFromGlobalContext('inner', true)).toEqual('');
});
