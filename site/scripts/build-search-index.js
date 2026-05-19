/**
 * Builds public/search-index.json from src/data/courses.json + contributors.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir  = join(__dirname, '..', 'src', 'data');
const publicDir = join(__dirname, '..', 'public');

const courses      = JSON.parse(readFileSync(join(dataDir, 'courses.json'), 'utf8'));
const contributors = JSON.parse(readFileSync(join(dataDir, 'contributors.json'), 'utf8'));

// Build track list from courses
const trackMap = new Map();
for (const c of courses) {
  const t = c.track;
  if (!trackMap.has(t)) trackMap.set(t, 0);
  trackMap.set(t, trackMap.get(t) + 1);
}

const tracks = Array.from(trackMap.entries()).map(([name, count]) => ({ name, count }));

const index = {
  courses: courses.map(c => ({
    title:       c.title,
    slug:        c.slug,
    description: c.description,
    tags:        c.tags,
    track:       c.track,
    difficulty:  c.difficulty,
  })),
  tracks,
  contributors: contributors.map(c => ({
    login:     c.login,
    name:      c.name,
    courses:   c.courses,
    avatarUrl: c.avatarUrl,
    tracks:    c.tracks || [],
    bio:       c.bio || '',
  })),
};

writeFileSync(join(publicDir, 'search-index.json'), JSON.stringify(index));
console.log(`✓ search-index.json (${courses.length} courses, ${tracks.length} tracks, ${contributors.length} contributors)`);
