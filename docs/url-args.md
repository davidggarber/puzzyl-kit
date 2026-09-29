# Optional URL parameters

The following may be added to any puzzle URL to trigger optional functionality

### Debugging
- debug
- trace
- break=[name]
- restart
- reload
- body-debug

### Causes alternate layout
- iframe
- print
- icon
- modal

### Layout testing
- scan-layout
- compare-layout


## debug

- Checked in code by `isDebug()`.
- Causes input fields to **alert** input codes.
- If there is a build error, causes the page to turn red.

## trace

- Checked in code by `isTrace()`.
- Logs every step of the builder to the console.
- Injects `<!--comments-->` into the built document as `<for>` loops iterate.
- Logs each template argument from `<use>` elements.
- Logs every confirmation event.
- Logs every sync event.

## debug && trace

- Logs (noisily) each extraction update from inputs.

## break

Takes an argument: `puzzle.xhtml?break=[name]`

Tells the builder to break into the debugger whenever an element's  ID or tag name matches `[name]`.

## restart

Overrides any saved progress. Always presents a blank puzzle.

## reload

Reloads a puzzle if at all possible, without asking.

## print

Causes pages to show their print mode all the time.
- Hide input helpers like stamp toolbars
- Show QR codes
- Suppress the faux page border
- Hides anything styled with `.no-print`
- Shows anything styled with `.print-only`

## iframe

Indicates that this page is embedded in another.<br>
The most common reason is the print pages.
- Blocks event syncing
- Blocks relaod
- Blocks scanning for meta feeder updates

## icon

Indicates that page is being rendered for snapshot purposes.
<br>To make clipping consistent, landscape puzzles are rotated to portrait.

## modal

Special case for pages that are not puzzles, but are meant to act as floating modal dialogs (in iframes).



