# Syntax of `<for>` elements

The flavor of the loop is dictated by which attribute assigns the iterating variable.

| Syntax | Loop type |
| --- | --- |
| <code>&lt;for <span style="color:lime">each</span>="x" in="{list}"&gt;</code> | For each entry in a `[list]` |
| <code>&lt;for <span style="color:lime">int</span>="x" to="{max}"&gt;</code><br><code>&lt;for <span style="color:lime">range</span>="x" from="{first}" to="{last}"&gt;</code> | For each integer in a range<br>(with various range syntaxes) |
| <code>&lt;for <span style="color:lime">char</span>="x" in="{string}"&gt;</code> | For each character in a string |
| <code>&lt;for <span style="color:lime">word</span>="x" in="{sentence}"&gt;</code> | For each word in a string |
| <code>&lt;for <span style="color:lime">key</span>="x" in="{dictionary}"&gt;</code> | For each key/value pair in a `{dictionary}` |

## Variable names

The name specified by each/int/range/char/word/key is called the `iteration variable`.

Iteration variables need to be a single word. No punctuation.

Within the loop, that variable takes on each value of the loop, and is accessible within the loop using `{name}` syntax.

## For-each

`<for each="name" in="list">`<br>
Where list is usually one of:
- A lookup variable from the boiler, of type list.
- A child element from an outer buider construct (`<for>` or `<template>`)

The list does not need to be written inside `{function curly braces}`, but it doesn't hurt.

Within the loop, the value will be `{name}`. It can be any type.

## For-int

`<for int="name" [from="first"] [to="last"] [until="stop"] [len="list"] [step="step"]>`<br>
Where all of those attributes are optional, and some are mutually exclusive.

The value of `{name}` will always be an integer.

| Attribute | Meaning | Default, if omitted |
| --- | --- | --- |
| from | first value (inclusive) | 0 |
| to | last value (inclusive) | |
| until | value after last value (exclusive) | |
| len | equivalent to `until=length(list)`, where `list` is assumed to have a `.length()` | 0 |
| step | how to increment | 1 |

One of to/until/len is required must be specified, or the default length is 0.

`<for range=...>` is an older name for this, but is otherwise equivalent.

## For-char

`<for char="x" in="hello world">`

Iterates over every character or grapheme in the `in` value, one at a time.

Special case: emoji are often made up of character sequences. But any combined emoji will be treated as one.

## For-word

`<for word="x" in="hello world">`

 Iterates over every word in the `in` value, separating on spaces (not whitespace generally).
