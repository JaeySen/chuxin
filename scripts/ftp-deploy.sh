#!/usr/bin/env bash
# FTP deploy for giaovu.hanngusotam.com and testpage.hanngusotam.com
# Usage:
#   ./scripts/ftp-deploy.sh giaovu   — upload apps/giaovu/dist/  (build first separately)
#   ./scripts/ftp-deploy.sh testpage — upload apps/react/dist/   (build first separately)
#   ./scripts/ftp-deploy.sh all      — upload both

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env.deploy"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: .env.deploy not found at $ENV_FILE" >&2; exit 1
fi
source "$ENV_FILE"

FTP_HOST="${FTP_HOST:?}"
FTP_USER="${FTP_USER:?}"
FTP_PASS="${FTP_PASSWORD:?}"

# Python handles FTPS data channel TLS correctly (curl has issues with this server)
upload_dir() {
  local local_dir="$1"
  local remote_base="$2"
  if [[ ! -d "$local_dir" ]]; then
    echo "Error: dist dir not found: $local_dir" >&2
    echo "  Run the build first, e.g.:" >&2
    echo "    pnpm --filter shared build && pnpm --filter react build" >&2
    exit 1
  fi
  python3 - "$FTP_HOST" "$FTP_USER" "$FTP_PASS" "$local_dir" "$remote_base" <<'PYEOF'
import ftplib, ssl, os, sys

host, user, passwd, local_dir, remote_base = sys.argv[1:]

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

ftp = ftplib.FTP_TLS(context=ctx)
ftp.connect(host, 21, timeout=30)
ftp.auth()
ftp.login(user, passwd)
ftp.prot_p()
ftp.set_pasv(True)

count = skipped = errors = 0
for root, dirs, files in os.walk(local_dir):
    dirs.sort()
    for fname in sorted(files):
        local_path = os.path.join(root, fname)
        rel = os.path.relpath(local_path, local_dir)
        if rel.endswith(".map"):
            skipped += 1
            continue
        remote_path = remote_base.rstrip("/") + "/" + rel.replace(os.sep, "/")
        print(f"  ↑ {rel}")
        # ensure remote dirs exist
        parts = remote_path.split("/")[:-1]
        for i in range(2, len(parts)+1):
            d = "/".join(parts[:i])
            try: ftp.mkd(d)
            except ftplib.error_perm: pass
        # delete any existing (possibly 0-byte) file
        try: ftp.delete(remote_path)
        except: pass
        try:
            with open(local_path, "rb") as fp:
                ftp.storbinary(f"STOR {remote_path}", fp, blocksize=32768)
            count += 1
        except Exception as e:
            print(f"  ✗ FAILED: {rel} ({e})", file=sys.stderr)
            errors += 1

ftp.quit()
print(f"\n  Done: {count} uploaded, {skipped} .map skipped{f', {errors} ERRORS' if errors else ''}.")
sys.exit(1 if errors else 0)
PYEOF
}

deploy_giaovu() {
  echo "==> Uploading apps/giaovu/dist/ → giaovu.hanngusotam.com/public_html/"
  upload_dir "$REPO_ROOT/apps/giaovu/dist" "/giaovu.hanngusotam.com/public_html"
}

deploy_testpage() {
  echo "==> Uploading apps/react/dist/ → testpage.hanngusotam.com/public_html/"
  upload_dir "$REPO_ROOT/apps/react/dist" "/testpage.hanngusotam.com/public_html"
}

case "${1:-}" in
  giaovu)   deploy_giaovu ;;
  testpage) deploy_testpage ;;
  all)      deploy_giaovu; echo ""; deploy_testpage ;;
  *)        echo "Usage: $0 giaovu|testpage|all" >&2; exit 1 ;;
esac
