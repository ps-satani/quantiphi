import { HttpError } from '../utils/httpError.js';

// GitHub rule: 1–39 chars, alphanumeric or single hyphens, no leading/trailing hyphen.
const GITHUB_USERNAME = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export function validateUsername(req, res, next) {
  const { username } = req.params;
  if (!GITHUB_USERNAME.test(username)) {
    return next(new HttpError(400, 'Invalid GitHub username'));
  }
  next();
}
