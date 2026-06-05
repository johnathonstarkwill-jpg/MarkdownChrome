export async function chooseMarkdownFile(showOpenFilePicker) {
  const [handle] = await showOpenFilePicker({
    multiple: false,
    types: [
      {
        description: 'Markdown files',
        accept: {
          'text/markdown': ['.md', '.markdown'],
          'text/plain': ['.md', '.markdown'],
        },
      },
    ],
  });
  return handle;
}

export async function chooseMarkdownDirectory(showDirectoryPicker) {
  return await showDirectoryPicker({
    mode: 'readwrite',
  });
}

export async function collectMarkdownFileHandles(directoryHandle, basePath = '') {
  const files = [];

  for await (const [name, handle] of directoryHandle.entries()) {
    const path = basePath ? `${basePath}/${name}` : name;

    if (handle.kind === 'directory') {
      files.push(...(await collectMarkdownFileHandles(handle, path)));
      continue;
    }

    if (handle.kind === 'file' && /\.(md|markdown)$/i.test(name)) {
      files.push({ path, name, handle });
    }
  }

  return files.sort((a, b) => a.path.localeCompare(b.path));
}

export async function readFileHandleText(handle) {
  const file = await handle.getFile();
  return await file.text();
}

export async function requestWritePermission(handle) {
  const options = { mode: 'readwrite' };

  if ((await handle.queryPermission(options)) === 'granted') {
    return true;
  }

  return (await handle.requestPermission(options)) === 'granted';
}

export async function writeTextToHandle(handle, text) {
  const hasPermission = await requestWritePermission(handle);
  if (!hasPermission) {
    throw new Error('Write permission was not granted.');
  }

  const writable = await handle.createWritable();
  await writable.write(text);
  await writable.close();
}
