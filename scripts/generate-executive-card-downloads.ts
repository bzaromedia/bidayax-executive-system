import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";
import { dirname, join, relative, resolve, sep } from "node:path";
import React from "../node_modules/react/index.js";
import { ImageResponse } from "../apps/card/node_modules/next/og.js";
import { QRCodeSVG } from "../apps/card/node_modules/qrcode.react/lib/esm/index.js";
import {
  executiveProfiles,
  getExecutiveCardUrl,
  type ExecutiveProfile
} from "../packages/config/executives/profiles.ts";
import { createVCard } from "../apps/card/src/lib/vcard.ts";

const outputRoot = resolve(process.cwd(), "downloads", "executive-cards");
const brand = {
  black: [17, 17, 17, 255],
  charcoal: [26, 26, 26, 255],
  gold: [212, 175, 55, 255],
  mutedGray: [138, 138, 138, 255],
  softWhite: [245, 245, 245, 255],
  white: [255, 255, 255, 255]
} as const;
const brandHex = {
  black: "#111111",
  white: "#ffffff"
} as const;

type Rgba = readonly [number, number, number, number];

const crcTable = Array.from({ length: 256 }, (_unused, index) => {
  let value = index;

  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  return value >>> 0;
});

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  const checksum = Buffer.alloc(4);

  length.writeUInt32BE(data.length, 0);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function createPng(width: number, height: number, paint: (x: number, y: number) => Rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;

  const raw = Buffer.alloc((width * 4 + 1) * height);

  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (width * 4 + 1);
    raw[rowOffset] = 0;

    for (let x = 0; x < width; x += 1) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [red, green, blue, alpha] = paint(x, y);

      raw[pixelOffset] = red;
      raw[pixelOffset + 1] = green;
      raw[pixelOffset + 2] = blue;
      raw[pixelOffset + 3] = alpha;
    }
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

function inCircle(x: number, y: number, centerX: number, centerY: number, radius: number) {
  return (x - centerX) ** 2 + (y - centerY) ** 2 <= radius ** 2;
}

function createAvatarAsset(profile: ExecutiveProfile) {
  const initials = profile.displayName
    .split(/\s+/)
    .map((part) => part.at(0) ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return createPng(512, 512, (x, y) => {
    if (!inCircle(x, y, 256, 256, 222)) {
      return [0, 0, 0, 0];
    }

    if (inCircle(x, y, 256, 256, 218)) {
      const stripe = Math.floor((x + y) / 42) % 2 === 0;
      const centerBand =
        (initials.length === 1 && x > 218 && x < 294 && y > 156 && y < 356) ||
        (initials.length > 1 && x > 148 && x < 364 && y > 156 && y < 356);

      if (centerBand && (x + y) % 7 < 4) {
        return brand.gold;
      }

      return stripe ? brand.black : brand.charcoal;
    }

    return brand.gold;
  });
}

function createLogoAsset() {
  return createPng(900, 300, (x, y) => {
    if (x < 12 || y < 12 || x > 887 || y > 287) {
      return brand.gold;
    }

    if (x > 92 && x < 188 && y > 74 && y < 226) {
      return brand.gold;
    }

    if (x > 210 && x < 246 && y > 74 && y < 226) {
      return brand.gold;
    }

    if (x > 292 && x < 790 && y > 108 && y < 136) {
      return brand.softWhite;
    }

    if (x > 292 && x < 704 && y > 166 && y < 188) {
      return brand.mutedGray;
    }

    return brand.black;
  });
}

function createMarkAsset() {
  return createPng(512, 512, (x, y) => {
    if (x < 14 || y < 14 || x > 497 || y > 497) {
      return brand.gold;
    }

    const leftStem = x > 138 && x < 194 && y > 112 && y < 400;
    const rightStem = x > 318 && x < 374 && y > 112 && y < 400;
    const bridge = x > 194 && x < 318 && y > 228 && y < 284;

    if (leftStem || rightStem || bridge) {
      return brand.gold;
    }

    return brand.black;
  });
}

async function createQrAsset(profile: ExecutiveProfile) {
  const response = new ImageResponse(
    React.createElement(
      "div",
      {
        style: {
          alignItems: "center",
          backgroundColor: brandHex.white,
          display: "flex",
          height: "640px",
          justifyContent: "center",
          width: "640px"
        }
      },
      React.createElement(QRCodeSVG, {
        bgColor: brandHex.white,
        fgColor: brandHex.black,
        level: "H",
        marginSize: 4,
        size: 560,
        title: `QR link for ${profile.displayName}`,
        value: profile.qrUrl
      })
    ),
    {
      height: 640,
      width: 640
    }
  );

  return Buffer.from(await response.arrayBuffer());
}

function packageProfile(profile: ExecutiveProfile) {
  return {
    profile,
    cardUrl: getExecutiveCardUrl(profile),
    packageType: "per-executive-card",
    safety: {
      containsSecrets: false,
      containsDatabaseCredentials: false,
      sharedMutableProfile: false
    }
  };
}

function readme(profile: ExecutiveProfile) {
  return `# ${profile.displayName} Executive Card Package

This package contains the isolated production card assets for ${profile.displayName}.

## Contents

- \`profile.json\` contains this executive profile and card URL.
- \`${profile.vcardFileName}\` contains this executive contact card.
- \`qr.png\` is the QR asset for this executive card URL.
- \`assets/avatar-placeholder.png\` is the replaceable avatar asset.
- \`assets/logo.png\` and \`assets/mark.png\` are packaged brand assets.

## Public Card

${getExecutiveCardUrl(profile)}

## Safe Customization

Replace \`assets/avatar-placeholder.png\` with the approved executive avatar using the same file name. Do not edit application code for an avatar replacement.

Update production profile data only in \`packages/config/executives/profiles.ts\`, then regenerate this package with:

\`\`\`powershell
pnpm cards:downloads
pnpm cards:downloads:verify
\`\`\`

## Do Not Add

- secrets
- API keys
- passwords
- database URLs
- another executive profile
- shared mutable profile files

This package is environment-free and intended for internal operational distribution only.
`;
}

async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        return listFiles(fullPath);
      }

      return [fullPath];
    })
  );

  return files.flat();
}

async function createZip(sourceDirectory: string, zipPath: string) {
  const files = await listFiles(sourceDirectory);
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const data = await readFile(file);
    const name = relative(sourceDirectory, file).split(sep).join("/");
    const nameBuffer = Buffer.from(name, "utf8");
    const checksum = crc32(data);
    const localHeader = Buffer.alloc(30);

    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuffer, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, nameBuffer);

    offset += localHeader.length + nameBuffer.length + data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const localData = Buffer.concat(localParts);
  const end = Buffer.alloc(22);

  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(localData.length, 16);
  end.writeUInt16LE(0, 20);

  await mkdir(dirname(zipPath), { recursive: true });
  await writeFile(zipPath, Buffer.concat([localData, centralDirectory, end]));
}

async function writeExecutivePackage(profile: ExecutiveProfile) {
  const packageDirectory = join(outputRoot, profile.slug);
  const assetsDirectory = join(packageDirectory, "assets");

  await rm(packageDirectory, { force: true, recursive: true });
  await mkdir(assetsDirectory, { recursive: true });

  await writeFile(
    join(packageDirectory, "profile.json"),
    `${JSON.stringify(packageProfile(profile), null, 2)}\n`
  );
  await writeFile(join(packageDirectory, profile.vcardFileName), `${createVCard(profile)}\r\n`);
  await writeFile(join(packageDirectory, "qr.png"), await createQrAsset(profile));
  await writeFile(join(assetsDirectory, "avatar-placeholder.png"), createAvatarAsset(profile));
  await writeFile(join(assetsDirectory, "logo.png"), createLogoAsset());
  await writeFile(join(assetsDirectory, "mark.png"), createMarkAsset());
  await writeFile(join(packageDirectory, "README.md"), readme(profile));
  await createZip(packageDirectory, join(outputRoot, `${profile.slug}-executive-card.zip`));
}

await mkdir(outputRoot, { recursive: true });

for (const profile of executiveProfiles) {
  await writeExecutivePackage(profile);
}

console.info(
  JSON.stringify({
    component: "executive-card-download-generator",
    event: "executive_card_downloads_generated",
    packages: executiveProfiles.map((profile) => profile.slug),
    status: "passed"
  })
);
