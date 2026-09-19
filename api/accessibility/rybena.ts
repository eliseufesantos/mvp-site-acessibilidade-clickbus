import { handleRybenaRequest } from '../../app/server/accessibility/rybena.js';

export default { fetch: (request: Request) => handleRybenaRequest(request) };
