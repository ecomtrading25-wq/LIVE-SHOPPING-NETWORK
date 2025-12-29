/**
 * Avatar Influencer Studio - Seed Data
 * Seeds the database with Elle Hart, Aya Park, and Vera Noir avatar profiles
 * 
 * Run: node seed-avatars.mjs
 */

import mysql from 'mysql2/promise';
import { nanoid } from 'nanoid';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// Get or create default channel
async function getDefaultChannel() {
  const [channels] = await conn.execute('SELECT id FROM channels LIMIT 1');
  
  if (channels.length > 0) {
    return channels[0].id;
  }
  
  // Create default channel
  const channelId = nanoid();
  await conn.execute(
    'INSERT INTO channels (id, slug, name, status, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
    [channelId, 'live-shopping-network', 'Live Shopping Network', 'active']
  );
  
  return channelId;
}

const channelId = await getDefaultChannel();

console.log(`Using channel: ${channelId}`);

// ============================================================================
// ELLE HART - Home & Lifestyle Avatar
// ============================================================================

const elleId = nanoid();
await conn.execute(`
  INSERT INTO avatar_creators (
    id, channel_id, slug, display_name, age, category,
    look_description, wardrobe_style, camera_framing, personality,
    content_pillars, brand_safety,
    avatar_image_url, status, is_verified,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
`, [
  elleId,
  channelId,
  'elle-hart',
  'Elle Hart',
  23,
  'home',
  'Warm neutral tones, shoulder-length brunette hair, soft glam makeup. Natural, approachable beauty that builds trust.',
  'Neutral basics (cream, beige, soft gray). Occasionally wears apron for cleaning demos. Coverage-first, no revealing cuts.',
  'Hands + surfaces focus. Above-chest framing. Camera stays on product interaction, not body. Professional distance.',
  'Calm, practical, method-focused. "It\'s not about the product, it\'s about the method." Evidence-based approach.',
  JSON.stringify([
    'Proof wipes (before/after surface tests)',
    'Surface safety (pH tests, material compatibility)',
    'Routine building (morning reset, weekly deep clean)',
    'Trust lines ("not ideal for..." honest disclaimers)'
  ]),
  JSON.stringify({
    noSuggestive: true,
    noLookalike: true,
    originalFace: true,
    age21Plus: true
  }),
  '/avatars/elle-hart-profile.jpg',
  'active',
  true
]);

console.log('✓ Created Elle Hart (Home & Lifestyle)');

// Sample scripts for Elle
const elleScriptId = nanoid();
await conn.execute(`
  INSERT INTO script_library (
    id, channel_id, avatar_id, title, script_type, category,
    script, duration, hook_type, angle, tags, status,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
`, [
  elleScriptId,
  channelId,
  elleId,
  'Surface Safety Test - Kitchen Counter Demo',
  'product_demo',
  'home',
  `Hi everyone, Elle here. Before we use any cleaner, let's do a quick safety test.

[Hold up pH strip]
I'm testing this on a hidden corner first. Why? Because not all surfaces handle the same chemicals.

[Apply small amount, wait 30 seconds]
See how it's reacting? No discoloration, no dulling. That's what we want.

[Show close-up]
This is safe for sealed granite. But - and this is important - it's NOT ideal for marble or unsealed stone. Always test first.

[Wipe surface]
Method over product, always. A $5 cleaner used correctly beats a $50 one used wrong.

Questions? Drop them below.`,
  180,
  'proof_test',
  'Safety-first approach with live testing',
  JSON.stringify(['cleaning', 'safety', 'home', 'proof']),
  'active'
]);

console.log('✓ Created sample script for Elle');

// ============================================================================
// AYA PARK - Tech & Gadgets Avatar
// ============================================================================

const ayaId = nanoid();
await conn.execute(`
  INSERT INTO avatar_creators (
    id, channel_id, slug, display_name, age, category,
    look_description, wardrobe_style, camera_framing, personality,
    content_pillars, brand_safety,
    avatar_image_url, status, is_verified,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
`, [
  ayaId,
  channelId,
  'aya-park',
  'Aya Park',
  24,
  'tech',
  'Sleek, minimal aesthetic. Clean desk setup. Modern, professional tech reviewer look.',
  'Minimal techwear basics (black, navy, gray). Simple, functional clothing that doesn\'t distract from products.',
  'Desk POV + product close-ups. Hands-on demonstrations. Focus on device, not presenter.',
  'Precise, detail-oriented. Compatibility-first mindset. "Does it work with what you already have?"',
  JSON.stringify([
    'Hold tests (weight, grip, one-handed use)',
    'Stability tests (wobble, flex, durability)',
    'Install steps (unboxing to setup in real-time)',
    'Compatibility warnings ("not ideal for..." honest disclaimers)'
  ]),
  JSON.stringify({
    noSuggestive: true,
    noLookalike: true,
    originalFace: true,
    age21Plus: true
  }),
  '/avatars/aya-park-profile.jpg',
  'active',
  true
]);

console.log('✓ Created Aya Park (Tech & Gadgets)');

// Sample script for Aya
const ayaScriptId = nanoid();
await conn.execute(`
  INSERT INTO script_library (
    id, channel_id, avatar_id, title, script_type, category,
    script, duration, hook_type, angle, tags, status,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
`, [
  ayaScriptId,
  channelId,
  ayaId,
  'Phone Stand Stability Test',
  'product_demo',
  'tech',
  `Aya here. Let's test this phone stand properly.

[Place phone on stand]
First test: stability. I'm tapping the desk around it.

[Tap desk]
No wobble. Good sign.

[Apply pressure to phone]
Second test: can it handle actual use? Typing, swiping, FaceID unlocking.

[Demonstrate typing]
Solid. No tipping.

[Show angle adjustment]
Third test: does the angle stay put? Some cheaper stands drift down over time.

[Adjust, wait 10 seconds]
Holding position. That's what we need.

Now - compatibility warning: This works great for phones 6-7 inches. If you have a tablet or a phone with a very thick case, this is NOT ideal. The grip won't be secure enough.

Questions? Let me know below.`,
  150,
  'stability_test',
  'Real-world stress testing before recommendation',
  JSON.stringify(['tech', 'phone', 'accessories', 'proof']),
  'active'
]);

console.log('✓ Created sample script for Aya');

// ============================================================================
// VERA NOIR - Beauty & Skincare Avatar
// ============================================================================

const veraId = nanoid();
await conn.execute(`
  INSERT INTO avatar_creators (
    id, channel_id, slug, display_name, age, category,
    look_description, wardrobe_style, camera_framing, personality,
    content_pillars, brand_safety,
    avatar_image_url, status, is_verified,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
`, [
  veraId,
  channelId,
  'vera-noir',
  'Vera Noir',
  25,
  'beauty',
  'Elegant, premium aesthetic. Daylight-lit setup. Sophisticated, editorial beauty look.',
  'Blazer or satin blouse. Professional, polished. Not revealing - focus stays on face and product.',
  'Above-chest framing. Face + product close-ups. Natural daylight for true color accuracy.',
  'Elegant, premium positioning. Focuses on texture, finish, and layering order. Evidence-based beauty.',
  JSON.stringify([
    'Texture/finish tests (matte vs dewy, pilling, separation)',
    'Layering order (what goes first, what breaks down combos)',
    'Patch-test reminders (always test new actives)',
    'Trust lines ("not ideal for..." skin type disclaimers)'
  ]),
  JSON.stringify({
    noSuggestive: true,
    noLookalike: true,
    originalFace: true,
    age21Plus: true
  }),
  '/avatars/vera-noir-profile.jpg',
  'active',
  true
]);

console.log('✓ Created Vera Noir (Beauty & Skincare)');

// Sample script for Vera
const veraScriptId = nanoid();
await conn.execute(`
  INSERT INTO script_library (
    id, channel_id, avatar_id, title, script_type, category,
    script, duration, hook_type, angle, tags, status,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
`, [
  veraScriptId,
  channelId,
  veraId,
  'Serum Layering Order Test',
  'product_demo',
  'beauty',
  `Vera here. Let's talk about layering order - because it actually matters.

[Hold up three serums]
Hyaluronic acid, niacinamide, and retinol. If you layer these wrong, you waste product or cause irritation.

[Apply first serum]
Rule one: thinnest to thickest. Hyaluronic acid goes first - it's water-based, absorbs fast.

[Wait 30 seconds, show skin]
See how it's absorbed? No pilling, no residue. That's your green light for the next layer.

[Apply second serum]
Niacinamide second. This is where most people mess up - if you rush it, the products pill and don't penetrate.

[Show texture]
Smooth, even. No balling up.

[Hold up retinol]
Retinol goes last. Always. And here's the important part: this is NOT ideal for sensitive skin or if you're new to actives. Start with a lower percentage and patch-test first.

Questions? I'm here.`,
  180,
  'layering_order',
  'Technical education with safety disclaimers',
  JSON.stringify(['beauty', 'skincare', 'serum', 'education']),
  'active'
]);

console.log('✓ Created sample script for Vera');

// ============================================================================
// SAMPLE CONTENT CALENDAR ENTRIES
// ============================================================================

// Schedule some upcoming content for each avatar
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(18, 0, 0, 0);

const elleContentId = nanoid();
await conn.execute(`
  INSERT INTO content_calendar (
    id, channel_id, avatar_id, scheduled_for, content_type, platform,
    title, script_id, hook_angle, status,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
`, [
  elleContentId,
  channelId,
  elleId,
  tomorrow,
  'post',
  'tiktok',
  'Kitchen Counter Safety Test - Granite vs Marble',
  elleScriptId,
  'Proof-based surface testing to build trust',
  'draft'
]);

const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 7);
nextWeek.setHours(19, 0, 0, 0);

const ayaContentId = nanoid();
await conn.execute(`
  INSERT INTO content_calendar (
    id, channel_id, avatar_id, scheduled_for, content_type, platform,
    title, script_id, hook_angle, status,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
`, [
  ayaContentId,
  channelId,
  ayaId,
  nextWeek,
  'post',
  'tiktok',
  'Phone Stand Stress Test - Real World Usage',
  ayaScriptId,
  'Hands-on stability testing before recommendation',
  'draft'
]);

console.log('✓ Created sample content calendar entries');

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n==============================================');
console.log('Avatar Influencer Studio - Seed Complete');
console.log('==============================================\n');
console.log('Created 3 Avatar Creators:');
console.log(`  • Elle Hart (${elleId}) - Home & Lifestyle`);
console.log(`  • Aya Park (${ayaId}) - Tech & Gadgets`);
console.log(`  • Vera Noir (${veraId}) - Beauty & Skincare`);
console.log('\nCreated 3 Sample Scripts');
console.log('Created 2 Content Calendar Entries');
console.log('\nAll avatars follow brand safety rules:');
console.log('  ✓ Age 21+');
console.log('  ✓ Original faces (no lookalikes)');
console.log('  ✓ Brand-safe presentation');
console.log('  ✓ Above-chest framing');
console.log('  ✓ Trust-building disclaimers');
console.log('\nNext steps:');
console.log('  1. Add avatar profile images to /client/public/avatars/');
console.log('  2. Configure HeyGen API for video generation');
console.log('  3. Set up content calendar automation');
console.log('  4. Begin creating content with scripts');
console.log('\n==============================================\n');

await conn.end();
