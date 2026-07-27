# Install MEP Concept on an Android tablet

The files must first be placed on an HTTPS website. GitHub Pages is a free way to do this and does not require a Mac.

## Part 1 — Publish from a Windows computer

1. Download `MEPConcept-Android-PWA.zip` and extract it.
2. Open https://github.com in a browser and sign in or create an account.
3. Select **New repository**.
4. Enter a name such as `mep-concept-app`.
5. Set the repository to **Public**, then create it.
6. In the repository, select **Add file → Upload files**.
7. Drag all contents of the extracted folder into the upload area. `index.html` must be at the repository root, and the `icons` folder must remain a folder.
8. Select **Commit changes**.
9. Open **Settings → Pages**.
10. Under **Build and deployment**, choose **Deploy from a branch**.
11. Select branch **main**, folder **/(root)**, then select **Save**.
12. On the Pages screen, use the published address shown by GitHub. It will normally resemble:

   `https://YOUR-GITHUB-NAME.github.io/mep-concept-app/`

## Part 2 — Install on the Android tablet

1. On the tablet, open **Google Chrome**.
2. Visit the GitHub Pages address from Part 1.
3. Confirm the MEP Concept project screen opens.
4. Tap Chrome's **three-dot menu**.
5. Tap **Add to Home screen**, then **Install**. On some versions of Chrome the menu item is labelled **Install app**.
6. Return to the home screen or app drawer and open the **MEP Concept** icon.
7. Open the app once while connected to the internet. The core app is then cached for offline use.

## Backups

Project data is stored locally on the tablet. Use the downward-arrow backup button to download a JSON backup. Use **Projects → Import backup** to restore it.

## Updating the app

Upload replacement app files to the same GitHub repository and commit the changes. Reopen the installed app while online. If an old version remains cached, close it fully and reopen it; as a final measure, remove the installed web app and install it again from Chrome.

## Troubleshooting

- **No Install option:** confirm the page is opened in Chrome from the `https://...github.io/...` address, not from a downloaded local file.
- **Blank page:** check that `index.html`, `app.js`, `calc.js`, `styles.css`, `sw.js`, `manifest.webmanifest` and the `icons` folder are all in the published repository.
- **Projects disappeared:** browser/app storage was cleared. Restore the latest JSON backup.
- **Site gives 404:** confirm Pages is set to `main` and `/(root)`, and that `index.html` is in the repository root.
