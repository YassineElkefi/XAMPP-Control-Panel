#!/bin/bash

set -e

SUDOERS_FILE="/etc/sudoers.d/xampp-control"
XAMPP_BIN="/Applications/XAMPP/xamppfiles/xampp"
USERNAME=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --username)
      USERNAME="$2"
      shift 2
      ;;
    --xampp)
      XAMPP_BIN="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

if [ -z "$USERNAME" ]; then
  USERNAME=$(logname 2>/dev/null || whoami)
fi

if [ "$(id -u)" -eq 0 ]; then
  SUDO_CMD=""
else
  SUDO_CMD="sudo"
fi

# ── Colour helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

echo ""
echo -e "${BOLD}⚙️  XAMPP Control — Permission Setup${RESET}"
echo -e "────────────────────────────────────────"
echo ""

# ── Check XAMPP is installed ──────────────────────────────────────────────────
if [ ! -x "$XAMPP_BIN" ]; then
  echo -e "${RED}✕  XAMPP not found at /Applications/XAMPP${RESET}"
  echo -e "   Download it from https://www.apachefriends.org/download.html"
  echo -e "   and install it before running this script."
  exit 1
fi

echo -e "${GREEN}✓${RESET}  XAMPP found at ${BLUE}${XAMPP_BIN}${RESET}"
echo -e "${GREEN}✓${RESET}  Configuring permissions for user: ${BOLD}${USERNAME}${RESET}"
echo ""

# ── Use stable macOS system paths ────────────────────────────────────────────
LSOF_PATH="/usr/sbin/lsof"
KILL_PATH="/bin/kill"
PGREP_PATH="/usr/bin/pgrep"

echo -e "   The following commands will be allowed without a password prompt:"
echo -e "   ${BLUE}${XAMPP_BIN}${RESET}"
echo -e "   ${BLUE}${LSOF_PATH}${RESET}"
echo -e "   ${BLUE}${KILL_PATH}${RESET}"
echo -e "   ${BLUE}${PGREP_PATH}${RESET}"
echo ""
echo -e "${YELLOW}   No blanket sudo access is granted. Only these four binaries.${RESET}"
echo ""

# ── Write sudoers file ────────────────────────────────────────────────────────
SUDOERS_CONTENT="${USERNAME} ALL=(ALL) NOPASSWD: ${XAMPP_BIN}
${USERNAME} ALL=(ALL) NOPASSWD: ${LSOF_PATH}
${USERNAME} ALL=(ALL) NOPASSWD: ${KILL_PATH}
${USERNAME} ALL=(ALL) NOPASSWD: ${PGREP_PATH}"

# Validate before installing. The script may be running as root through
# macOS's administrator prompt, so sudo must be optional here.
TEMP_SUDOERS=$(mktemp)
trap 'rm -f "$TEMP_SUDOERS"' EXIT
printf '%s\n' "$SUDOERS_CONTENT" > "$TEMP_SUDOERS"
if ! $SUDO_CMD /usr/sbin/visudo -cf "$TEMP_SUDOERS" > /dev/null 2>&1; then
  echo -e "${RED}✕  Sudoers validation failed. Aborting to avoid breaking sudo.${RESET}"
  exit 1
fi

$SUDO_CMD /bin/mkdir -p /etc/sudoers.d
$SUDO_CMD /usr/bin/install -m 440 "$TEMP_SUDOERS" "$SUDOERS_FILE"

echo -e "${GREEN}✓  Permissions configured successfully.${RESET}"
echo ""
echo -e "   To remove these permissions at any time, run:"
echo -e "   ${BLUE}sudo rm ${SUDOERS_FILE}${RESET}"
echo ""
echo -e "${BOLD}   You can now run the app with: npm run dev${RESET}"
echo ""
