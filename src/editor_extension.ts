import { Extension, StateEffect, StateField, RangeSetBuilder, Compartment } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView } from '@codemirror/view';

// StateEffect to update the highlighted word
export const setHighlightQuery = StateEffect.define<RegExp | null>();

// Style for the highlighted matches
const highlightDecoration = Decoration.mark({
    class: 'jp-HighlightSelected'
});

// StateField to manage the decorations
export const highlightField = StateField.define<DecorationSet>({
    create() {
        return Decoration.none;
    },
    update(decorations, tr) {
        decorations = decorations.map(tr.changes);

        // Check if the query has changed
        for (let e of tr.effects) {
            if (e.is(setHighlightQuery)) {
                decorations = matchHighlighter(tr.state.doc.toString(), e.value);
            }
        }
        return decorations;
    },
    provide: f => EditorView.decorations.from(f)
});

// Function to compute decorations based on the query
function matchHighlighter(text: string, query: RegExp | null): DecorationSet {
    if (!query) {
        return Decoration.none;
    }

    const builder = new RangeSetBuilder<Decoration>();

    // Re-implementation using standard Regex loop for stability
    let match;
    // Ensure global flag is set for looping
    const re = new RegExp(query.source, query.flags.includes('g') ? query.flags : query.flags + 'g');

    while ((match = re.exec(text)) !== null) {
        const start = match.index;
        const end = match.index + match[0].length;
        builder.add(start, end, highlightDecoration);
    }

    return builder.finish();
}

// Compartment for dynamic theme configuration
export const themeCompartment = new Compartment();

export function createThemeExtension(bgColor: string, outlineColor: string): Extension {
    return EditorView.baseTheme({
        ".jp-HighlightSelected": {
            backgroundColor: bgColor,
            outline: `1px solid ${outlineColor}`
        }
    });
}

export function highlightExtension(): Extension {
    // Default theme
    return [
        highlightField,
        themeCompartment.of(createThemeExtension("#d7d4f0", "#ababab"))
    ];
}
