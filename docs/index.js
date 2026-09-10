function breakup(s) {
    const maxLength = 20;
    const lines = [];
    const words = s.replace('…', '...').split(' ');
    let line = words[0];
    for (const word of words.slice(1)) {
        const appended = line + ' ' + word;
        if (maxLength < appended.length) {
            lines.push(line);
            line = word;
        } else {
            line = appended;
        }
    }
    lines.push(line);
    return lines.join('\n');
}

function print(layout, s) {
    const font = layout.font;
    const ctx = layout.ctx;
    for (const char of s) {
        if (char === '\n') {
            layout.x = layout.indent;
            layout.y += font.height;
        } else {
            const coord = font.coords[char] ?? font.unknown;
            ctx.drawImage(font.image, coord.x, coord.y, coord.w, font.height, layout.x, layout.y, coord.w, font.height);
            layout.x += coord.w;
        }
    }
}

function main(state) {
    const charsPerSecond = 16;
    const delaySeconds = 1.75;
    function animate(timestamp) {
        const screens = state.screens;
        const secondsElapsed = (timestamp - state.zero) / 1000.0;
        let screenSecondsElapsed = secondsElapsed;
        let text = '';
        if (delaySeconds < secondsElapsed && 0 < screens.length) {
            screenSecondsElapsed -= delaySeconds;
            let screenIndex;
            let screenDuration;
            for (screenIndex = 0; screenIndex < screens.length - 1; ++screenIndex) {
                screenDuration = delaySeconds + screens[screenIndex].length / charsPerSecond;
                if (screenSecondsElapsed < screenDuration) {
                    break;
                }
                screenSecondsElapsed -= screenDuration;
            }
            text = screens[screenIndex];
            if (state.onfinished && screenDuration < screenSecondsElapsed) {
                state.onfinished();
                state.onfinished = undefined;
            }
        }
        state.ctx.fillStyle = 'black';
        state.ctx.fillRect(0, 0, canvas.width, canvas.height);
        const layout = {ctx: state.ctx, font: state.font, x: 32, y: 182, indent: 32};
        const charsToShow = Math.min(charsPerSecond * screenSecondsElapsed, text.length);
        print(layout, text.substring(0, charsToShow));
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}

function assignGlyphCoords(font, cursor, chars, width) {
    for (const char of chars) {
        font.coords[char] = {x: cursor.x, y: cursor.y, w: width ?? font.width};
    }
    cursorAdvance(font, cursor, width);
}

function assignGlyphCoordsRange(font, cursor, start, end) {
    for (let glyph = start.charCodeAt(0); glyph <= end.charCodeAt(0); ++glyph) {
        assignGlyphCoords(font, cursor, String.fromCharCode(glyph));
    }
}

function assignGlyphCoordsSequence(font, cursor, sequence) {
    for (const chars of sequence) {
        assignGlyphCoords(font, cursor, chars);
    }
}

function cursorAdvance(font, cursor, width) {
    cursor.x += (width ?? font.width);
}

function cursorCrlf(font, cursor) {
    cursor.x = 0;
    cursor.y += font.height;
}

function initialize() {
    const ctx = canvas.getContext('2d');
    const font = {
        height: 14,
        width: 8,
        image: new Image(),
        coords: {},
        unknown: {x: 80, y: 28, w: 8},
    };
    const cursor = {x: 96, y: 28};
    assignGlyphCoordsRange(font, cursor, '0', '5');
    cursorCrlf(font, cursor);
    assignGlyphCoordsSequence(font, cursor, ['6', '7', '8', '9', ':', ';', ',', '”"', '!', '?', '‽', 'A', 'B', 'C', 'D', 'E', 'F', 'G']);
    cursorCrlf(font, cursor);
    assignGlyphCoordsRange(font, cursor, 'H', 'Y');
    cursorCrlf(font, cursor);
    assignGlyphCoordsSequence(font, cursor, ['Z', '(', '/', ')', "‘'’", '-–', 'ã', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']);
    cursorCrlf(font, cursor);
    assignGlyphCoordsSequence(font, cursor, 'lmnopqrstuvwxyzÄÍ');
    cursorCrlf(font, cursor);
    assignGlyphCoordsSequence(font, cursor, 'ö');
    cursorAdvance(font, cursor);
    assignGlyphCoordsSequence(font, cursor, 'ü');
    cursorAdvance(font, cursor);
    assignGlyphCoordsSequence(font, cursor, 'ÁàÃâÂèÉéÊê');
    cursor.x = 127;
    assignGlyphCoordsSequence(font, cursor, 'õí');
    cursorCrlf(font, cursor);
    assignGlyphCoordsSequence(font, cursor, 'ÓôóúÛáÇç');
    cursorAdvance(font, cursor);
    cursorAdvance(font, cursor);
    cursorAdvance(font, cursor);
    cursorAdvance(font, cursor);
    assignGlyphCoordsSequence(font, cursor, '“.');
    cursor.x = 121
    assignGlyphCoords(font, cursor, '—', 15);
    assignGlyphCoords(font, cursor, '+');
    cursorCrlf(font, cursor);
    assignGlyphCoordsSequence(font, cursor, '=ÁàÃâÈè Óô');
    cursorAdvance(font, cursor);
    assignGlyphCoordsSequence(font, cursor, 'úÁá íÓó');
    cursorCrlf(font, cursor);
    assignGlyphCoordsSequence(font, cursor, 'Úú');

    const state = {
        ctx,
        font,
        screens: [],
        zero: 0,
    };

    let recordedChunks;
    const stream = canvas.captureStream(30); 
    let mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/mp4;codecs=avc1',
    });
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };
    downloadBtn.onclick = () => {
        const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
        const videoUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = videoUrl;
        a.download = 'reload.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(videoUrl), 5000);
    };

    const presets = [
        {name: 'it was safe', value: 'They have escaped into the mansion\nWhere they thought it was safe.\nYet...'},
        {name: 'survival horror', value: 'You have once again entered\nthe world of survival horror.\nGood luck!'},
        {name: 'good things', value: 'We accept good things from God;\nand should we not accept evil?'},
        {name: 'fear', value: "Fear can't kill you.\nBut..."},
    ];
    for (const preset of presets) {
        const btn = document.createElement('button');
        btn.append(preset.name);
        btn.onclick = () => {
            textarea.value = preset.value;
        };
        presetsContainer.append(btn);
    }

    playBtn.onclick = () => {
        downloadBtn.disabled = true;
        state.zero = document.timeline.currentTime;
        state.screens = [];
        recordedChunks = [];
        setTimeout(() => {
            state.zero = document.timeline.currentTime;
            state.screens = textarea.value.split('\n').map(breakup);
            state.onfinished = () => {
                mediaRecorder.stop();
                playBtn.disabled = false;
                downloadBtn.disabled = false;
            }
            mediaRecorder.stop();
            mediaRecorder.start();
        }, 50);
    };
    textarea.value = presets[0].value;

    font.image.onload = function() {
        playBtn.disabled = false;
        main(state);
    };
    font.image.src = 'font.png';
}
const state = initialize();