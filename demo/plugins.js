export const plugins = {
  menu: [
    {
      name: 'File',
      translations: { de: 'Datei' },
      icon: 'folder',
      plugins: [
        {
          name: 'Open',
          translations: { de: 'Öffnen' },
          icon: 'description',
          tagName: 'oscd-menu-open',
        },
        {
          name: 'New File',
          translations: { de: 'Neue Datei' },
          icon: 'note_add',
          tagName: 'oscd-menu-new',
        },
        {
          name: 'Save File',
          translations: { de: 'Datei speichern' },
          icon: 'save',
          requireDoc: true,
          tagName: 'oscd-menu-save',
        },
        {
          name: 'Close File',
          translations: { de: 'Datei schließen' },
          icon: 'close',
          requireDoc: true,
          tagName: 'oscd-menu-file-close',
        },
      ],
    },
    {
      name: 'Auto layout SLD',
      translations: {
        de: 'SLD automatisch layouten',
      },
      icon: 'account_tree',
      requireDoc: true,
      tagName: 'oscd-menu-sld-auto-layout',
    },
  ],
  editor: [
    {
      name: 'SLD',
      translations: {
        de: 'SLD',
      },
      icon: 'add_box',
      active: true,
      requireDoc: true,
      tagName: 'oscd-editor-sld',
    },
    {
      name: 'Source Editor',
      translations: { de: 'Source Editor' },
      icon: 'code',
      requireDoc: true,
      tagName: 'oscd-editor-source',
    },
  ],
  background: [],
};
