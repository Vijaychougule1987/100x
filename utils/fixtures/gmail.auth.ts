import fs from 'fs/promises';
import path from 'path';
import process from 'process';
import { authenticate } from '@google-cloud/local-auth';
import { google } from 'googleapis';
import { JSDOM } from 'jsdom';
import { OAuth2Client } from 'google-auth-library';
import { fileURLToPath } from 'url';

// Convert `import.meta.url` to a directory path for `process.cwd()`
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(__dirname, 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content: any = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client: any) {
  const content: any = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client: any = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client?.credentials) {
    await saveCredentials(client);
  }
  return client;
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function listLabels(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  const res = await gmail.users.labels.list({
    userId: 'me',
  });
  const labels = res.data.labels;
  if (!labels || labels.length === 0) {
    console.log('No labels found.');
    return;
  }
  console.log('Labels:');
  labels.forEach((label) => {
    console.log(`- ${label.name}`);
  });
}

async function getInbox(auth: OAuth2Client) {

    const gmail = google.gmail({ version: "v1", auth: auth });

    const res = await gmail.users.messages.list({
        userId: "me",
        maxResults: 2, // Fetch latest email
    });

    if (!res.data.messages || res.data.messages.length === 0) {
        console.log("No emails found.");
        return;
    }
    const message= res.data.messages[0]

    const messageId = message.id;
    const email = await gmail.users.messages.get({
        userId: "me",
        id: messageId as string,
    });

    const payload: any = email.data.payload;

    let emailBody = Buffer.from(payload.body?.data || "", "base64").toString("utf-8");
       
    const regex = /\[(\d+)\]/;
    const match = emailBody.match(regex) as any;
    console.log(match[1])
    return match[1]


}
function htmlToText(html) {
    const dom = new JSDOM(html);
    return dom.window.document.body.textContent || "";
}
//authorize().then(getInbox).catch(console.error);

export { authorize, getInbox}