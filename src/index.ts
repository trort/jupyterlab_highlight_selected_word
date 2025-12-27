import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

/**
 * Initialization data for the jupyterlab-highlight-selected-word extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-highlight-selected-word:plugin',
  description: 'Highlight selected word in JupyterLab',
  autoStart: true,
  optional: [ISettingRegistry],
  activate: (app: JupyterFrontEnd, settingRegistry: ISettingRegistry | null) => {
    console.log('JupyterLab extension jupyterlab-highlight-selected-word is activated!');

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('jupyterlab-highlight-selected-word settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for jupyterlab-highlight-selected-word.', reason);
        });
    }
  }
};

export default plugin;
