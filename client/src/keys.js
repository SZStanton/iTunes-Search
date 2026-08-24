const FIELDS = ['INPUT', 'TEXTAREA', 'SELECT'];

// A shortcut firing mid search term is a bug. contentEditable is here for
// anything added later.
function typingIn(target) {
  if (!target) return false;

  return FIELDS.includes(target.tagName) || target.isContentEditable === true;
}

export { typingIn };
