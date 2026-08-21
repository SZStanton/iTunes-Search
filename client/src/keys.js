const FIELDS = ['INPUT', 'TEXTAREA', 'SELECT'];

// A shortcut that fires while somebody is typing a search term is a bug, not a
// shortcut. contentEditable is in here for anything added later
function typingIn(target) {
  if (!target) return false;

  return FIELDS.includes(target.tagName) || target.isContentEditable === true;
}

export { typingIn };
