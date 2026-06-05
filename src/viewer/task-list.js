const taskLinePattern = /^(\s*(?:[-+*]|\d+[.)])\s+\[)([ xX])(\]\s+.*)$/;

export function toggleMarkdownTaskAtIndex(markdown, taskIndex) {
  let currentTaskIndex = 0;

  return markdown
    .split('\n')
    .map((line) => {
      const match = line.match(taskLinePattern);
      if (!match) {
        return line;
      }

      if (currentTaskIndex !== taskIndex) {
        currentTaskIndex += 1;
        return line;
      }

      currentTaskIndex += 1;
      const nextMarker = match[2] === ' ' ? 'x' : ' ';
      return `${match[1]}${nextMarker}${match[3]}`;
    })
    .join('\n');
}
