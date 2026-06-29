
/**
 * The decoder frame is either visible (true), hidden (false), or not present (null)
 * @returns true, false, or null
 */
function getDecoderState() {
    const frame = document.getElementById('decoder-frame');
    if (frame != null) {
        const style = window.getComputedStyle(frame);
        return style.display != 'none';
    }
    return null;
}

/**
 * Update the iframe tag to be the desired visibility state.
 * Also ensure that it points at the correct URL
 * @param state true to show, false to hide
 */
function setDecoderState(state: boolean) {
    const frame = document.getElementById('decoder-frame') as HTMLIFrameElement;
    if (frame != null) {
        let src = 'https://www.decrypt.fun/index.html';
        const mode = frame.getAttributeNS('', 'data-decoder-mode');
        if (mode != null) {
            src = 'https://www.decrypt.fun/' + mode + '.html';
        }
        frame.style.display = state ? 'block' : 'none';
        if (frame.src === '' || state) {
            frame.src = src;
        }
    }
}

/**
 * There is a Decoders link in the bottom corner of the page.
 * Set it up such that clicking rotates through the 3 visibility states.
 * @param margins the parent node of the toggle UI
 * @param mode the default decoder mode, if specified
 */
export function setupDecoderToggle(margins:HTMLDivElement|null, mode?:boolean|string) {
    let iframe = document.getElementById('decoder-frame') as HTMLIFrameElement;
    if (iframe == null) {
        iframe = document.createElement('iframe');
        iframe.id = 'decoder-frame';
        iframe.style.display = 'none';
        if (mode !== undefined && mode !== true) {
            iframe.setAttributeNS(null, 'data-decoder-mode', mode as string);
        }
        document.getElementsByTagName('body')[0]?.appendChild(iframe);
    }

    let toggle = document.getElementById('decoder-toggle') as HTMLSpanElement;
    if (toggle == null && margins != null) {
        toggle = document.createElement('span');
        toggle.id = 'decoder-toggle';
        toggle.title = 'Open a helpful decoder at right';
        margins.appendChild(toggle);
    }
    if (toggle) {
        const visible = getDecoderState();
        if (visible) {
            toggle.innerText = 'Hide Decoders';
        }
        else {
            toggle.innerText = 'Show Decoders';
        }
        toggle.addEventListener('click', toggleDecoder)
    }
}

/**
 * Alternate between showing and hiding the decoder iframe
 */
export function toggleDecoder(evt: PointerEvent) {
    var visible = getDecoderState();
    if (visible === null) {
        setupDecoderToggle(null);
    }
    setDecoderState(!visible);
}

/**
 * Explicitly show or hide the decoder iframe
 */
export function showDecoder(show: boolean) {
    var visible = getDecoderState();
    if (visible === null) {
        setupDecoderToggle(null);
    }
    setDecoderState(show);
}

