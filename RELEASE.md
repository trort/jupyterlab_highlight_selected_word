# Making a new release of jupyterlab-highlight-selected-word

The extension can be published to PyPI and npm manually or using the Jupyter Releaser.

## Manual Release

1.  Bump the version in `package.json` and `jupyterlab_highlight_selected_word/_version.py`.
2.  Tag the release:
    ```bash
    git tag vX.Y.Z
    git push origin vX.Y.Z
    ```
3.  Build and publish.
