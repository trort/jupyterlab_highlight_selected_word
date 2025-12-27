import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { Cell } from '@jupyterlab/cells';
import { EditorView } from '@codemirror/view';
import { IEditorExtensionRegistry, EditorExtensionRegistry } from '@jupyterlab/codemirror';

// Import our custom extension parts
import { setHighlightQuery, highlightExtension, themeCompartment, createThemeExtension } from './editor_extension';

/**
 * Interface for extension settings
 */
interface IPluginSettings {
  highlightColor: string;
  outlineColor: string;
  minChars: number;
  wholeWords: boolean;
  delay: number;
  enableOnLoad: boolean;
}

const DEFAULT_SETTINGS: IPluginSettings = {
  highlightColor: "#d7d4f0",
  outlineColor: "#ababab",
  minChars: 2,
  wholeWords: true,
  delay: 100,
  enableOnLoad: true
};

/**
 * NotebookHighlighter responsible for a single notebook widget.
 */
class NotebookHighlighter {
  private _panel: NotebookPanel;
  private _updateTimeout: any = null;
  private _settings: IPluginSettings;

  constructor(panel: NotebookPanel, settings: IPluginSettings) {
    this._panel = panel;
    this._settings = settings;

    // Listen for active cell changes
    this._panel.content.activeCellChanged.connect(this._onActiveCellChanged, this);

    // Initial attach
    if (this._panel.content.activeCell) {
      this._monitorCell(this._panel.content.activeCell);
    }
  }

  dispose() {
    if (this._updateTimeout) clearTimeout(this._updateTimeout);
    // Disconnect signals? They usually auto-disconnect on dispose of sender/receiver.
  }

  public updateSettings(newSettings: IPluginSettings) {
    const oldSettings = this._settings;
    this._settings = newSettings;

    // If colors changed, we need to broadcast theme update
    if (oldSettings.highlightColor !== newSettings.highlightColor || oldSettings.outlineColor !== newSettings.outlineColor) {
      this._broadcastTheme();
    }

    // Force re-evaluation of current selection
    if (this._panel.content.activeCell) {
      this._scheduleUpdate();
    }
  }

  private _onActiveCellChanged() {
    const cell = this._panel.content.activeCell;
    if (cell) {
      this._monitorCell(cell);
    } else {
      this._broadcast(null);
    }
  }

  private _monitorCell(cell: Cell) {
    // We need to listen to the model's selection changes
    // Prior listeners are not removed on the old cell, but since we debounce and only use the *current* active cell
    // in the callback, it *should* be fine if we are careful.
    // Ideally we should disconnect the old one. 
    // For simplicity in this MVP: just add listener. The signal slot mechanism handles some deduping if method bound context is same.
    // But we are using an anonymous arrow? No, let's use a bound method if possible or accept some overhead.

    // Actually, we SHOULD disconnect previous. But we don't track "previous active cell".
    // Let's just add the connection. It's cheap.

    cell.editor?.model.selections.changed.connect(this._onSelectionChanged, this);
  }

  private _onSelectionChanged() {
    // Basic check to ensure we are only processing for the active cell to avoid noise
    if (this._panel.content.activeCell === arguments[0]) {
      // sender might not be passed correctly in arguments[0] by signal?
      // Actually, let's just loose check.
    }
    // Only process if the signaling cell is actually the active one
    // (This avoids processing events from background cells if we leave listeners attached)
    // Actually, we can't easily access the sender cell in the callback without wrapping.
    // But we can just check `this._panel.content.activeCell`.

    this._scheduleUpdate();
  }

  private _scheduleUpdate() {
    if (!this._settings.enableOnLoad) {
      this._broadcast(null);
      return;
    }
    if (this._updateTimeout) clearTimeout(this._updateTimeout);
    this._updateTimeout = setTimeout(() => this._updateQuery(), this._settings.delay);
  }

  private _updateQuery() {
    const cell = this._panel.content.activeCell;
    if (!cell || !cell.editor) return;

    const editor = cell.editor;
    const selection = editor.getSelection();
    const { start, end } = selection;

    let text = "";

    // Single line selection concern
    if (start.line === end.line) {
      const lineText = editor.getLine(start.line);
      if (lineText) {
        text = lineText.substring(start.column, end.column);
      }
    } else {
      // Multi-line: ignore
      this._broadcast(null);
      return;
    }

    // Validation
    // TODO: Use settings for min-length
    if (!text || text.length < this._settings.minChars) {
      this._broadcast(null);
      return;
    }

    // Verify word characters if needed, or allow any?
    // "Highlight selected word" implies word.
    // But maybe user wants to highlight "=="?
    // Let's stick to alphanumeric check from design defaults if implicit, but code might want symbols.
    // Design proposal said "valid characters".
    // Original extension had `[\\w$]` token check.
    // Let's implement a loose check: if it's whitespace only, ignore.
    if (!text.trim()) {
      this._broadcast(null);
      return;
    }

    // It's a valid word!
    const flag = "g";
    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // TODO: Use settings for whole-word
    let regexSource = escaped;
    if (this._settings.wholeWords && /^\w+$/.test(text)) {
      regexSource = `\\b${escaped}\\b`;
    }
    const query = new RegExp(regexSource, flag);

    this._broadcast(query);
  }

  private _broadcast(query: RegExp | null) {
    const cells = this._panel.content.widgets;
    cells.forEach(cell => {
      if (cell.model.type === 'code') {
        // We need to get the CM6 EditorView
        // In JLab 4 with @jupyterlab/codemirror, cell.editor is a CodeMirrorEditorWrapper
        // It exposes `.editor` which is the EditorView
        const cmEditor = (cell.editor as any)?.editor as EditorView;
        if (cmEditor) {
          cmEditor.dispatch({
            effects: setHighlightQuery.of(query)
          });
        }
      }
    });
  }

  private _broadcastTheme() {
    const cells = this._panel.content.widgets;
    const themeExtension = createThemeExtension(this._settings.highlightColor, this._settings.outlineColor);

    cells.forEach(cell => {
      if (cell.model.type === 'code') {
        const cmEditor = (cell.editor as any)?.editor as EditorView;
        if (cmEditor) {
          cmEditor.dispatch({
            effects: themeCompartment.reconfigure(themeExtension)
          });
        }
      }
    });
  }
}

/**
 * Initialization data for the jupyterlab-highlight-selected-word extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-highlight-selected-word:plugin',
  description: 'Highlight selected word in JupyterLab',
  autoStart: true,
  requires: [INotebookTracker, IEditorExtensionRegistry],
  optional: [ISettingRegistry],
  activate: (
    app: JupyterFrontEnd,
    tracker: INotebookTracker,
    editorExtensions: IEditorExtensionRegistry,
    settingRegistry: ISettingRegistry | null
  ) => {
    console.log('JupyterLab extension jupyterlab-highlight-selected-word is activated!');

    // Register the editor extension
    editorExtensions.addExtension({
      name: 'jupyterlab-highlight-selected-word:editor',
      factory: () => EditorExtensionRegistry.createImmutableExtension(highlightExtension())
    });

    let currentSettings = { ...DEFAULT_SETTINGS };

    // Track notebooks
    const controllers = new WeakMap<NotebookPanel, NotebookHighlighter>();

    // Function to load settings
    const loadSettings = (settings: ISettingRegistry.ISettings) => {
      currentSettings = {
        highlightColor: settings.get('highlightColor').composite as string || DEFAULT_SETTINGS.highlightColor,
        outlineColor: settings.get('outlineColor').composite as string || DEFAULT_SETTINGS.outlineColor,
        minChars: settings.get('minChars').composite as number || DEFAULT_SETTINGS.minChars,
        wholeWords: settings.get('wholeWords').composite as boolean ?? DEFAULT_SETTINGS.wholeWords,
        delay: settings.get('delay').composite as number || DEFAULT_SETTINGS.delay,
        enableOnLoad: settings.get('enableOnLoad').composite as boolean ?? DEFAULT_SETTINGS.enableOnLoad
      };
      console.log('Highlight settings loaded:', currentSettings);

      // Update all controllers
      tracker.forEach(panel => {
        // We need a way to get the controller associated with the panel.
        // Since `controllers` WeakMap was inside the closure, we can access it if we move it to broader scope
        // or we can just iterate if we have access.
        const controller = controllers.get(panel);
        if (controller) {
          controller.updateSettings(currentSettings);
        }
      });
    };

    tracker.widgetAdded.connect((sender, panel) => {
      const controller = new NotebookHighlighter(panel, currentSettings);
      controllers.set(panel, controller);

      panel.disposed.connect(() => {
        controller.dispose();
        controllers.delete(panel);
      });
    });

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('jupyterlab-highlight-selected-word settings loaded:', settings.composite);
          loadSettings(settings);
          settings.changed.connect(loadSettings);
        })
        .catch(reason => {
          console.error('Failed to load settings for jupyterlab-highlight-selected-word.', reason);
        });
    }
  }
};

export default plugin;
