import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  executiveProfiles,
  getExecutiveCardUrl,
  type ExecutiveProfile
} from "../packages/config/executives/profiles.ts";

const outputRoot = resolve(process.cwd(), "downloads", "executive-cards");
const errors: string[] = [];
const secretPattern =
  /(DATABASE_URL|POSTGRES_PASSWORD|BIDAYAX_IP_HASH_SECRET|NEXTAUTH_SECRET|SESSION_SECRET|API_KEY|SECRET=|PASSWORD=)/i;

function readText(path: string) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    errors.push(message);
  }
}

function isPng(path: string) {
  if (!existsSync(path)) {
    return false;
  }

  const signature = readFileSync(path).subarray(0, 8);
  return signature.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}

function verifyProfileJson(profile: ExecutiveProfile, path: string) {
  const content = readText(path);

  assert(Boolean(content), `${path} is missing.`);
  assert(!secretPattern.test(content), `${path} contains a secret-like token.`);

  try {
    const parsed = JSON.parse(content) as {
      readonly profile?: ExecutiveProfile;
      readonly profiles?: ExecutiveProfile[];
      readonly cardUrl?: string;
    };

    assert(!Array.isArray(parsed.profiles), `${path} must not contain a shared profiles array.`);
    assert(parsed.profile?.slug === profile.slug, `${path} must contain only ${profile.slug}.`);
    assert(parsed.profile?.displayName === profile.displayName, `${path} has the wrong display name.`);
    assert(parsed.profile?.qrUrl === profile.qrUrl, `${path} has the wrong QR URL.`);
    assert(parsed.cardUrl === getExecutiveCardUrl(profile), `${path} has the wrong card URL.`);
  } catch (error) {
    assert(false, `${path} is not valid JSON: ${(error as Error).message}`);
  }
}

function verifyNoOtherExecutiveData(profile: ExecutiveProfile, path: string) {
  const content = readText(path);

  for (const otherProfile of executiveProfiles) {
    if (otherProfile.slug === profile.slug) {
      continue;
    }

    assert(
      !content.includes(otherProfile.displayName),
      `${path} contains another executive display name: ${otherProfile.displayName}.`
    );
    assert(
      !content.includes(`/card/${otherProfile.slug}`),
      `${path} contains another executive card URL: ${otherProfile.slug}.`
    );
  }
}

function verifyPackage(profile: ExecutiveProfile) {
  const packageDirectory = join(outputRoot, profile.slug);
  const profilePath = join(packageDirectory, "profile.json");
  const vcardPath = join(packageDirectory, profile.vcardFileName);
  const qrPath = join(packageDirectory, "qr.png");
  const readmePath = join(packageDirectory, "README.md");
  const avatarPath = join(packageDirectory, "assets", "avatar-placeholder.png");
  const logoPath = join(packageDirectory, "assets", "logo.png");
  const markPath = join(packageDirectory, "assets", "mark.png");
  const zipPath = join(outputRoot, `${profile.slug}-executive-card.zip`);

  assert(existsSync(packageDirectory), `${packageDirectory} is missing.`);
  verifyProfileJson(profile, profilePath);

  const vcard = readText(vcardPath);
  assert(vcard.includes(`FN:${profile.displayName}`), `${vcardPath} has the wrong vCard name.`);
  assert(vcard.includes(`TEL;TYPE=WORK,VOICE:${profile.phone}`), `${vcardPath} has the wrong phone.`);
  assert(vcard.includes(`EMAIL;TYPE=WORK:${profile.email}`), `${vcardPath} has the wrong email.`);
  assert(!secretPattern.test(vcard), `${vcardPath} contains a secret-like token.`);

  assert(isPng(qrPath), `${qrPath} is missing or is not a PNG.`);
  assert(isPng(avatarPath), `${avatarPath} is missing or is not a PNG.`);
  assert(isPng(logoPath), `${logoPath} is missing or is not a PNG.`);
  assert(isPng(markPath), `${markPath} is missing or is not a PNG.`);

  const readme = readText(readmePath);
  assert(readme.includes(profile.displayName), `${readmePath} does not identify the executive.`);
  assert(
    readme.includes("Replace `assets/avatar-placeholder.png`"),
    `${readmePath} must document avatar replacement.`
  );
  assert(!secretPattern.test(readme), `${readmePath} contains a secret-like token.`);

  assert(existsSync(zipPath), `${zipPath} is missing.`);

  for (const textFile of [profilePath, vcardPath, readmePath]) {
    verifyNoOtherExecutiveData(profile, textFile);
  }
}

const slugs = executiveProfiles.map((profile) => profile.slug);
assert(new Set(slugs).size === slugs.length, "Executive slugs must be unique.");
assert(executiveProfiles.length === 3, "Exactly three executive card packages are expected.");

for (const profile of executiveProfiles) {
  verifyPackage(profile);
}

if (errors.length > 0) {
  console.error(
    JSON.stringify({
      component: "executive-card-download-verifier",
      errors,
      event: "executive_card_download_verification_failed",
      status: "failed"
    })
  );
  process.exit(1);
}

console.info(
  JSON.stringify({
    component: "executive-card-download-verifier",
    event: "executive_card_download_verification_passed",
    packages: slugs,
    status: "passed"
  })
);
