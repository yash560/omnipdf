// Same Drive workspace as /drive — this route exists purely so a folder's
// location is reflected in the URL. The [id] segment is read internally via
// useParams() inside DrivePage (see app/drive/page.tsx), which keeps
// currentFolderId in sync with it.
export { default } from '../../page';
