/**
 * memberDashboard.tsx
 *
 * Thin re-export shim.
 *
 * The actual implementation lives in the `./member/` folder, split into
 * focused single-responsibility components. This file exists solely so that
 * the existing import in `app/dashboard/[id]/page.tsx` continues to work
 * without modification.
 *
 * See ./member/index.tsx for the component tree entry-point.
 */
export { default } from "./member/index"