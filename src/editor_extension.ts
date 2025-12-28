import {
  Extension,
  StateEffect,
  StateField,
  RangeSetBuilder,
  Compartment
} from '@codemirror/state';
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
    for (const e of tr.effects) {
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
  const re = new RegExp(
    query.source,
    query.flags.includes('g') ? query.flags : query.flags + 'g'
  );

  while ((match = re.exec(text)) !== null) {
    const start = match.index;
    const end = match.index + match[0].length;
    builder.add(start, end, highlightDecoration);
  }

  return builder.finish();
}

// Compartment for dynamic theme configuration
export const themeCompartment = new Compartment();

export function createThemeExtension(
  highlightColor: string,
  outlineColor: string,
  highlightColorBlurred: string,
  outlineWidth: number,
  outlineOnly: boolean
): Extension {
  // Styles for focused editor
  const focusedStyle = {
    backgroundColor: outlineOnly ? 'transparent' : highlightColor,
    outline: `${outlineWidth}px solid ${outlineColor}`
  };

  // Styles for non-focused editor (blurred)
  const blurredStyle = {
    backgroundColor: outlineOnly ? 'transparent' : highlightColorBlurred,
    outline: `${outlineWidth}px solid ${highlightColorBlurred}` // Original had separate color for outline blur? params.highlight_color_blurred. Yes.
  };

  return EditorView.baseTheme({
    // Default (unfocused)
    '.jp-HighlightSelected': blurredStyle,

    // Focused editor override
    '.cm-editor.cm-focused .jp-HighlightSelected': focusedStyle
  });
}

export function highlightExtension(): Extension {
  // Default theme (will be updated by settings immediately on load)
  return [
    highlightField,
    themeCompartment.of(
      createThemeExtension('#d7d4f0', '#ababab', '#e6e4f5', 1, false)
    )
  ];
}
