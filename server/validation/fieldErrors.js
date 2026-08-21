// Every route answers a failed validation the same way, so a form can always
// read errors[field]. First message per field only
function fieldErrors(error) {
  const errors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];
    if (field && !errors[field]) errors[field] = issue.message;
  }

  return errors;
}

export { fieldErrors };
