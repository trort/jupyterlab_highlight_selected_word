# Highlight Selected Word for JupyterLab

[![Github Actions Status](https://github.com/trort/jupyterlab_highlight_selected_word/workflows/Build/badge.svg)](https://github.com/trort/jupyterlab_highlight_selected_word/actions/workflows/build.yml)

A JupyterLab extension that highlights all instances of the selected word in the current editor or across all cells. This is a port of the popular [jupyter_highlight_selected_word](https://github.com/jcb91/jupyter_highlight_selected_word) nbextension for JupyterLab.

## Features

- **Highlight Matches**: Automatically highlights all occurrences of the selected word in the current cell.
- **Global Highlighting**: Option to highlight matches across all cells in the notebook.
- **Customizable**: Configurable highlight colors, outline styles, and behavior.
- **Toggle Hotkey**: Quickly toggle highlighting on/off with `Alt + H`.
- **Intelligent Matching**: Options for whole-word matching and minimum character constraints.

## Requirements

- JupyterLab >= 4.0.0

## Install

To install the extension, execute:

```bash
pip install jupyterlab_highlight_selected_word
```

## Usage

1.  **Select Text**: Simply double-click a word or select text in any code cell. All other occurrences of that word in the cell (and optionally other cells) will be highlighted.
2.  **Toggle**: Press `Alt + H` to toggle the highlighting functionality on or off.

## Configuration

You can configure the extension settings via the JupyterLab **Advanced Settings Editor** (`Settings` > `Settings Editor` > `Highlight Selected Word`) or by defining them in your `overrides.json`.

| Setting                         | Type      | Default   | Description                                                                       |
| :------------------------------ | :-------- | :-------- | :-------------------------------------------------------------------------------- |
| **Highlight Color**             | `string`  | `#d7d4f0` | CSS color for the highlight background.                                           |
| **Blurred Highlight Color**     | `string`  | `#e6e4f5` | CSS color for the highlight background in unfocused cells.                        |
| **Outline Color**               | `string`  | `#ababab` | CSS color for the highlight outline.                                              |
| **Outline Width**               | `number`  | `1`       | Width of the outline in pixels.                                                   |
| **Outline Only**                | `boolean` | `false`   | Show only outline (transparent background).                                       |
| **Code Cells Only**             | `boolean` | `false`   | Restrict highlighting to code cells only.                                         |
| **Minimum Characters**          | `number`  | `2`       | Minimum number of characters required to trigger highlighting.                    |
| **Whole Words Only**            | `boolean` | `true`    | Only highlight matches that are whole words.                                      |
| **Highlight Word Under Cursor** | `boolean` | `false`   | Automatically highlight the word under the cursor when there is no text selected. |
| **Debounce Delay**              | `number`  | `100`     | Delay in milliseconds before highlighting triggers.                               |
| **Enable on Load**              | `boolean` | `true`    | Enable highlighting by default when JupyterLab starts.                            |

## Uninstall

To remove the extension, execute:

```bash
pip uninstall jupyterlab_highlight_selected_word
```

## Contributing

For development instructions, please see [CONTRIBUTING.md](CONTRIBUTING.md).
