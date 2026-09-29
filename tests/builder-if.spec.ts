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
    fonts: [ 'bold', 'italic' ],
    sentence: 'Unit tests are the best!',
    pt: { x: 3, y: 5 },
    ascii: { 65: 'A', '66': 'B' },
    nest: { alpha: { bravo: 1, charlie: 'delta' }, echo: { foxtrot: { golf: 'hotel' } } }
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

test('boolean', () => {
  testIfTrue({ test: 'truth' });
  testIfTrue({ not: '{lies}' });
});

test('equals', () => {
  testIfTrue({ test: 'num', eq: '{1234}' });
  testIfTrue({ test: 'zeroth', eq: '{0}' });
  testIfTrue({ test: 'fonts.0', eq: 'bold' });
  testIfTrue({ test: 'sentence', eq: 'Unit tests are the best!' });
  testIfTrue({ test: 'pt.x', eq: '{3}' });
  testIfTrue({ test: 'ascii.65', eq: 'A' });
  testIfTrue({ test: 'ascii.[{65}]', eq: 'A' });
  testIfTrue({ test: 'ascii.65', eq: 'A' });
  testIfTrue({ test: 'nest.echo.foxtrot.golf', eq: 'hotel' });
});

test('not-equals', () => {
  testIfTrue({ test: 'num', ne: '{1235}' });
  testIfTrue({ test: 'zeroth', ne: '0' });  // 0 != '0'
  testIfTrue({ test: 'fonts.1', ne: 'bold' });
  testIfTrue({ test: 'sentence', ne: 'Unit tests are the best' });  // Missing final !
  testIfTrue({ test: 'pt.x', ne: '{5}' });
  testIfTrue({ test: 'nest.echo.foxtrot.golf', ne: 'Hotel' });  // case-sensitive
});

test('numeric-compare', () => {
  // Greater-than
  testIfTrue({ test: 'num', gt: '{1233}' });
  // Greater-than-or-equal
  testIfTrue({ test: 'zeroth', ge: '{-1}' });
  testIfTrue({ test: 'zeroth', ge: '{0}' });
  // Less-than
  testIfTrue({ test: 'num', lt: '{1235}' });
  // Less-than-or-equal
  testIfTrue({ test: 'zeroth', le: '{1}' });
  testIfTrue({ test: 'zeroth', le: '{0}' });
});

test('substrings', () => {
  // In (substring)
  testIfTrue({ test: 'fonts.0', in: 'bolder' });
  testIfTrue({ test: 'are the best', in: '{sentence}' });
  // Not-in
  testIfTrue({ test: 'bolder', ni: '{fonts.0}' });
  testIfTrue({ test: 'sentence', ni: 'are the best' });
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

