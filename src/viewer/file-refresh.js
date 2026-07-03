export function createFileSnapshot(file) {
  return {
    name: file.name || 'Markdown file',
    lastModified: Number(file.lastModified) || 0,
    size: Number(file.size) || 0,
  };
}

export function isMissingFileError(error) {
  return error?.name === 'NotFoundError'
    || /could not be found/i.test(error?.message || '');
}
