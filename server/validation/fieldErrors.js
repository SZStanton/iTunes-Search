// Every route answers a failed validation the same way, so a form can always
// read errors[field]. Only the first message per field, a second rarely adds
// anything a person needs
function fieldErrors(error) {
  const errors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (field && !errors[field]) errors[field] = issue.message;
  }

  return errors;
}

export { fieldErrors };
