import FtpDeploy from "ftp-deploy";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

config({ path: ".env.deploy" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localRoot = path.resolve(__dirname, "../apps/react/dist");

const ftpDeploy = new FtpDeploy();

ftpDeploy.on("uploading", ({ filename, transferredFileCount, totalFilesCount }) => {
  console.log(`[${transferredFileCount}/${totalFilesCount}] ${filename}`);
});

await ftpDeploy.deploy({
  user: process.env.FTP_USER,
  password: process.env.FTP_PASSWORD,
  host: process.env.FTP_HOST,
  port: Number(process.env.FTP_PORT) || 22,
  localRoot,
  remoteRoot: process.env.FTP_REMOTE_ROOT ?? "/public_html/",
  // The default glob doesn't match dotfiles — explicitly include .htaccess
  // and any other dot-prefixed files so SPA routing works on LiteSpeed/Apache.
  include: ["*", "**/*", ".*", "**/.*"],
  deleteRemote: false,
  sftp: true,
});

console.log("Deploy complete.");
