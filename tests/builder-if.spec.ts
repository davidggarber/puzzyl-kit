import { expect, test } from '@playwright/test';
import { testBuilderContext } from '../src/builderContext';
import { ifResult, startIfBlock } from '../src/builderIf';
import { JSDOM } from 'jsdom';

const dom = new JSDOM();
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  Node: dom.window.Node,
  Element: dom.window.Element,
  HTMLElement: dom.window.HTMLElement,
  Text: dom.window.Text,
  Comment: dom.window.Comment,
  DOMParser: dom.window.DOMParser,
});

test.beforeEach(() => {
  expect(testBuilderContext({
    truth: true,
    lies: false,
    num: 1234,
    zeroth: 0,
    nan: NaN,
    fonts: [ 'bold', 'italic' ],
    sentence: 'Unit tests are the best!',
    pt: { x: 3, y: 5 },
    ascii: { 65: 'A', '66': 'B' },
    nest: { alpha: { bravo: 1, charlie: 'delta' }, echo: { foxtrot: { golf: 'hotel' } } },
    emptyList: [],
    emptyDict: {},
  }));
});

test.afterAll(() => {
  testBuilderContext()  // Reset builder
  dom.window.close();
});

function buildRawIf(args: object): string {
  let rawArgs = '';
  for (const [key, value] of Object.entries(args)) {
    rawArgs += ` ${key}="${value}"`;
  }
  return `<if${rawArgs}>`;
}

function buildTestIf(rawIf: string): HTMLElement {
  const rawHtml = rawIf + `PASSED</if>`;
  const parsed = new DOMParser().parseFromString(rawHtml, 'text/html');
  return parsed.querySelector('if') as HTMLElement;
}

function testIfTrue(args: object): void {
  const rawIf = buildRawIf(args);
  const ifNode = buildTestIf(rawIf);
  const result:ifResult = {passed:false, index:0};
  const dest = startIfBlock(ifNode, result);
  expect(result.passed, `${rawIf} == true`).toBe(true);
  expect(dest, `${rawIf} yields 1 child`).toHaveLength(1);
  expect(dest[0].textContent,  `${rawIf} yields PASSED`).toBe('PASSED');
}

function testThrows(args: object): void {
  const rawIf = buildRawIf(args);
  const ifNode = buildTestIf(rawIf);
  const result:ifResult = {passed:false, index:0};
  let thrown = false;
  try {
    const dest = startIfBlock(ifNode, result);
  }
  catch (ex) {
    // Expected exception
    expect(ex && typeof(ex) === 'object' && ex.constructor.name === 'ContextError');
    thrown = true;
  }
  expect(thrown, `Expected ${rawIf} to throw a ContextError`).toBe(true);
}

test('boolean', () => {
  testIfTrue({ test: 'truth' });
  testIfTrue({ not: '{lies}' });

  testThrows({ else: 'invalid' });  // no test attribute
});

test('equals', () => {
  testIfTrue({ test: 'num', eq: '1234' });
  testIfTrue({ test: 'zeroth', eq: '0' });
  testIfTrue({ test: 'fonts.0', eq: 'bold' });
  testIfTrue({ test: 'sentence', eq: 'Unit tests are the best!' });
  testIfTrue({ test: 'pt.x', eq: '3' });
  testIfTrue({ test: 'ascii.65', eq: 'A' });
  testIfTrue({ test: 'ascii.[{65}]', eq: 'A' });
  testIfTrue({ test: 'ascii.65', eq: 'A' });
  testIfTrue({ test: 'nest.echo.foxtrot.golf', eq: 'hotel' });

  testIfTrue({ size: 'fonts', eq: 2 });
  testIfTrue({ size: 'pt', eq: 2 });
  testIfTrue({ size: 'emptyList', eq: 0 });
  testIfTrue({ size: 'emptyDict', eq: 0 });
  testIfTrue({ size: 'fonts.0', eq: 4 });
  testIfTrue({ size: 'sentence', eq: 24 });

  testThrows({ size: 'truth', eq: 0 });
});

test('not-equals', () => {
  testIfTrue({ test: 'num', ne: '1235' });
  testIfTrue({ test: 'zeroth', ne: 'zero' });  // int test doesn't force int value
  testIfTrue({ test: 'nan', ne: NaN });  // In JS, NaN != NaN
  testIfTrue({ test: 'fonts.1', ne: 'bold' });
  testIfTrue({ test: 'sentence', ne: 'Unit tests are the best' });  // Missing final !
  testIfTrue({ test: 'pt.x', ne: '{5}' });
  testIfTrue({ test: 'nest.echo.foxtrot.golf', ne: 'Hotel' });  // case-sensitive

  testIfTrue({ size: 'fonts', ne: 0 });
  testIfTrue({ size: 'pt', ne: 0 });
  testIfTrue({ size: 'fonts.1', ne: 4 });
});

test('numeric-compare', () => {
  // Greater-than
  testIfTrue({ test: 'num', gt: '{1233}' });
  testIfTrue({ size: 'fonts', gt: 1 });
  testIfTrue({ size: 'sentence', gt: 20 });
  // Greater-than-or-equal
  testIfTrue({ test: 'zeroth', ge: '{-1}' });
  testIfTrue({ test: 'zeroth', ge: '{0}' });
  testIfTrue({ size: 'fonts', ge: 2 });
  // Less-than
  testIfTrue({ test: 'num', lt: '{1235}' });
  testIfTrue({ size: 'emptyList', lt: 1 });
  // Less-than-or-equal
  testIfTrue({ test: 'zeroth', le: '{1}' });
  testIfTrue({ test: 'zeroth', le: '{0}' });
  testIfTrue({ size: 'emptyDict', le: 0 });
});

test('substrings', () => {
  // In (substring)
  testIfTrue({ test: 'fonts.0', in: 'bolder' });
  testIfTrue({ test: 'are the best', in: '{sentence}' });
  // Not-in
  testIfTrue({ test: 'bolder', ni: '{fonts.0}' });
  testIfTrue({ test: 'sentence', ni: 'are the best' });

  testThrows({ test: 't', in: '{truth}' });
  testThrows({ test: 't', ni: '{num}' });
});

test('child-items', () => {
  // In (contains child)
  testIfTrue({ test: 'bold', in: '{fonts}' });
  testIfTrue({ test: 'alpha', in: '{nest}' });
  // Not-in (does not contain child)
  testIfTrue({ test: 'underline', ni: '{fonts}' });
  testIfTrue({ test: 'omega', ni: '{nest}' });
});


test('exists', () => {
  // Does exist
  testIfTrue({ exists: '{fonts}' });
  testIfTrue({ exists: '{nest}' });
  testIfTrue({ exists: '{nest.alpha}' });
  testIfTrue({ exists: '{fonts.0}' });
  testIfTrue({ exists: '{ascii.65}' });
  testIfTrue({ exists: '{ascii.66}' });
  testIfTrue({ exists: '{ascii.[{65+1}]}' });  // 66 == '66'
  // Does not exist
  testIfTrue({ notex: '{font}' });  // Can't test, because {font} becomes 'font'
  testIfTrue({ notex: '{nest.bravo}' });
  testIfTrue({ notex: '{fonts.2}' });
});

